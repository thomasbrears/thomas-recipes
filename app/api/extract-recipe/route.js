// AI Component for importing recipes from a URL or file upload, using the /api/extract-recipe endpoint.
// NOT CURRENTLY USED — this was an experimental feature that we ended up not including in the final product, but the code is left here for reference/future use.


import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract recipe data from the provided content and return ONLY valid JSON with no markdown, no code fences, no explanation.

Return this exact shape:
{
  "title": "string or null",
  "subtitle": "string or null",
  "description": "string or null",
  "tags": ["array", "of", "strings"],
  "prepTime": "string or null (e.g. '15 mins')",
  "cookTime": "string or null (e.g. '30 mins')",
  "servings": "string or null (e.g. '4 people')",
  "difficulty": "Easy | Medium | Hard | null",
  "ingredients": ["array of ingredient strings"],
  "steps": ["array of step strings"],
  "notes": "string or null"
}

Rules:
- Return null for any field you cannot find — never guess or fabricate
- ingredients and steps must be arrays (empty array if not found)
- tags should be short lowercase keywords relevant to the recipe (cuisine, dietary info, meal type etc.)
- difficulty: infer from complexity if not stated, or return null
- steps should be complete sentences describing each action
- Remove any ads, unrelated content, or website boilerplate`;

/**
 * Strips unnecessary HTML tags to reduce token count before sending to Claude.
 */
function trimHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { url, fileData, fileType } = body;

    if (!url && !fileData) {
      return Response.json({ error: "Either url or fileData is required" }, { status: 400 });
    }

    let messages;

    if (url) {
      // Fetch and trim the HTML server-side to avoid CORS and reduce tokens
      let html;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; RecipeBot/1.0)",
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        html = await response.text();
      } catch (fetchErr) {
        return Response.json(
          { error: `Could not fetch URL: ${fetchErr.message}` },
          { status: 422 }
        );
      }

      const trimmed = trimHtml(html).slice(0, 40000);
      messages = [
        {
          role: "user",
          content: `Extract the recipe from this webpage HTML:\n\n${trimmed}`,
        },
      ];
    } else {
      // File upload — send as a base64 document
      const supportedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!supportedTypes.includes(fileType)) {
        return Response.json(
          { error: `Unsupported file type: ${fileType}` },
          { status: 400 }
        );
      }

      // Claude only natively supports PDF as a document type.
      // For DOCX and TXT, send as base64 text block with a note.
      const isPdf = fileType === "application/pdf";

      messages = [
        {
          role: "user",
          content: isPdf
            ? [
                {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: fileData },
                },
                { type: "text", text: "Extract the recipe from this document." },
              ]
            : [
                {
                  type: "text",
                  text: `Extract the recipe from this file (base64 encoded, type: ${fileType}).\nContent: ${fileData}`,
                },
              ],
        },
      ];
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages,
    });

    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      return Response.json(
        { error: "Claude returned invalid JSON", raw: cleaned },
        { status: 500 }
      );
    }

    return Response.json(extracted);
  } catch (err) {
    console.error("[extract-recipe]", err);
    return Response.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}