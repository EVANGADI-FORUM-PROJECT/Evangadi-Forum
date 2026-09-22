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
export default function RagDocuments() {
  // TODO [FE-RAG]: Implement the Milestone 3 RAG Documents page.
  return <div>TODO: Implement RAG Documents page</div>;
}
