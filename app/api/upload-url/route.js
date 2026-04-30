import { getUploadUrl } from "@/lib/r2";

export async function POST(req) {
  const { fileName, contentType } = await req.json();

  const result = await getUploadUrl(fileName, contentType);

  return Response.json(result);
}