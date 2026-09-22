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
  const [listError, setListError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);
  const activeDocument =
    documents.find((doc) => doc.document_id === selectedId) || null;
  const hasProcessingDocuments = documents.some((doc) =>
    isProcessing(doc.status),
  // Load the library on mount.
  useEffect(() => {
    let cancelled = false;
    ragService
      .listDocuments()
      .then((result) => {
        if (!cancelled) setDocuments(result.data || []);
      })
      .catch((err) => {
        if (!cancelled) setListError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
 // Poll only while something is still processing (e.g. after a page reload).
  useEffect(() => {
    if (!hasProcessingDocuments) return undefined;

    const timer = setInterval(async () => {
      try {
        const result = await ragService.listDocuments();
        setDocuments(result.data || []);
      } catch {
        // Keep what we have; the next tick will try again.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [hasProcessingDocuments]);
  const chooseFile = (file) => {
    setLibraryError('');
    if (!file) return;

    if (!isPdfFile(file)) {
      setSelectedFile(null);
      setLibraryError('Only PDF files are supported.');
      return;
    }
    setSelectedFile(file);
  };
  const handleFileInputChange = (event) => {
    chooseFile(event.target.files?.[0]);
  };
  );
}
