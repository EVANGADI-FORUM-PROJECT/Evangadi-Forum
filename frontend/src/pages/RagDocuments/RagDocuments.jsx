import { useEffect, useRef, useState } from "react";
import { FileText, FileUp, Upload } from "lucide-react";
import { ragService } from "../../services/rag/rag.service.js";
import styles from "./RagDocuments.module.css";
import DocumentList from "./DocumentList";
import RagAskAI from "./RagAskAI";
import RagPreview from "./RagPreview";
import RagSearch from "./RagSearch";

// While a document is still being processed the list is refreshed this often.
const POLL_INTERVAL_MS = 3000;
function isProcessing(status) {
  return status === "processing" || status === "pending";
}
function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
function isPdfFile(file) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export default function RagDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);
}
