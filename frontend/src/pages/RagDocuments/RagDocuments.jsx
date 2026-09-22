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
  );
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
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    chooseFile(event.dataTransfer.files?.[0]);
  };
 const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setLibraryError('');
    try {
      const result = await ragService.uploadPdf(selectedFile);
      const created = result.data;
      setDocuments((prev) => [
        created,
        ...prev.filter((doc) => doc.document_id !== created.document_id),
      ]);
      setSelectedId(created.document_id);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setLibraryError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (deletingId) return;
    const confirmed = window.confirm(
      `Delete "${doc.title}"? The PDF and its search index will be removed.`
    );
    if (!confirmed) return;

    setDeletingId(doc.document_id);
    setLibraryError('');
    try {
      await ragService.deleteDocument(doc.document_id);
      setDocuments((prev) => prev.filter((item) => item.document_id !== doc.document_id));
      setSelectedId((current) => (current === doc.document_id ? null : current));
    } catch (err) {
      setLibraryError(err.message);
    } finally {
      setDeletingId(null);
    }
  };
   return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.kicker}>Knowledge base</span>
        <h1>Private PDF library</h1>
        <p>
          Upload study or reference PDFs to your own workspace. Each file is
          indexed for semantic search and optional AI answers that cite passages
          from that document only. File size limits apply on the server; other
          users never see your uploads.
        </p>
      </section>
      {listError && (
        <div className={styles.errorBanner} role="alert">
          {listError}
        </div>
      )}
<div className={styles.workspace}>
        {/* Left column: upload + document list */}
        <aside className={styles.card}>
          <h2 className={styles.cardTitle}>Library</h2>
          <p className={styles.cardHint}>
            Add PDFs here. Processing runs once per upload.
          </p>
          <
            className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isUploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
          <p className={styles.dropText}>
              Accepted format: PDF. Maximum file size is enforced by the server.
            </p>
  }
}
