import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  MessageSquarePlus,
  Sparkles,
  Users,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { questionService } from "../../services/question/question.service.js";
import QuestionCard from "../../components/QuestionCard/QuestionCard.jsx";
import ui from "../../styles/pageStates.module.css";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user } = useAuth();
  // Read search values from the URL
  const [searchParams] = useSearchParams();

  // "q" is used for normal keyword search
  const search = searchParams.get('q') || ''; // || '' -> If the parameter doesn't exist in the URL, we use an empty string instead of getting null

  // "semantic" is used for AI-powered semantic search
  const semantic = searchParams.get('semantic') || '';

  return null;
}
