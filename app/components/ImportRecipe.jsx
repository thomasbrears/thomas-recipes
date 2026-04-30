// AI Component for importing recipes from a URL or file upload, using the /api/extract-recipe endpoint.
// NOT CURRENTLY USED — this was an experimental feature that we ended up not including in the final product, but the code is left here for reference/future use.

"use client";
import { useState } from "react";
import { Button, Input, Upload, Typography, Divider, Alert } from "antd";
import {
  LinkOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const ACCEPTED_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};

/**
 * Reads a file as a base64 string.
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * ImportRecipe
 *
 * Props:
 *   onImport(data) — called with extracted recipe JSON when extraction succeeds
 */
export default function ImportRecipe({ onImport }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const callExtract = async (body) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Extraction failed");
      onImport(data);
      setUrl("");
      setFileName(null);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleUrl = () => {
    if (!url.trim()) return;
    callExtract({ url: url.trim() });
  };

  const handleFile = async (file) => {
    if (!ACCEPTED_TYPES[file.type]) {
      setError(`Unsupported file type. Please upload a PDF, DOCX, or TXT file.`);
      return false;
    }
    setFileName(file.name);
    try {
      const fileData = await readFileAsBase64(file);
      callExtract({ fileData, fileType: file.type });
    } catch {
      setError("Could not read file");
    }
    return false; // prevent antd auto-upload
  };

  return (
    <div
      style={{
        marginBottom: 24,
        borderRadius: 14,
        border: "1.5px dashed #d4aa7d",
        background: "linear-gradient(135deg, #fffdf9 0%, #fdf6ec 100%)",
        padding: "20px 24px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <ThunderboltOutlined style={{ color: "#d4863a", fontSize: 16 }} />
        <Text style={{ fontWeight: 700, fontSize: 14, color: "#2a2420" }}>
          Auto-import a recipe
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          — paste a link or upload a file and we'll fill the form for you
        </Text>
      </div>

      {/* URL row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Input
          prefix={<LinkOutlined style={{ color: "#c07030" }} />}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleUrl}
          placeholder="https://www.recipeblog.com/chocolate-cake"
          style={{ borderRadius: 8, flex: 1 }}
          disabled={loading}
        />
        <Button
          type="primary"
          onClick={handleUrl}
          disabled={!url.trim() || loading}
          icon={loading ? <LoadingOutlined /> : <ThunderboltOutlined />}
          style={{
            borderRadius: 8,
            background: "#d4863a",
            borderColor: "#d4863a",
            fontWeight: 600,
            minWidth: 100,
          }}
        >
          {loading ? "Importing…" : "Import"}
        </Button>
      </div>

      {/* Divider */}
      <Divider plain style={{ margin: "10px 0", color: "#bbb", fontSize: 12 }}>
        or
      </Divider>

      {/* File upload */}
      <Upload
        beforeUpload={handleFile}
        accept=".pdf,.docx,.txt"
        showUploadList={false}
        disabled={loading}
      >
        <Button
          icon={loading && fileName ? <LoadingOutlined /> : <UploadOutlined />}
          disabled={loading}
          style={{ borderRadius: 8, borderColor: "#d4aa7d", color: "#8a6030" }}
        >
          {fileName && loading
            ? `Reading ${fileName}…`
            : "Upload PDF, Word doc, or .txt"}
        </Button>
      </Upload>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={() => setError(null)}
          style={{ marginTop: 12, borderRadius: 8 }}
        />
      )}
    </div>
  );
}