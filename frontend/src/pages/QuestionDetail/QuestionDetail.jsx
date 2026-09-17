// T-16 & T-20 — Question Detail Page
// Task: Build /questions/:questionHash to display the question, answers, answer form, and AI Answer Fit.
// Reference: task-question-detail.md
// TODO: Teammate implementing T-16/T-20 should build this page.
// Import React hooks for state and side effects
import { useEffect, useState } from "react";
// Import tools for navigation and getting URL parameters
import { Link, useNavigate, useParams } from "react-router-dom";
// Import icons used in the page
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  UserRound,
} from "lucide-react";
// Display Markdown content
import ReactMarkdown from "react-markdown";
// Custom editor for writing answers in Markdown
import MarkdownEditor from "../../components/MarkdownEditor/MarkdownEditor.jsx";
// Get the logged-in user
import { useAuth } from "../../contexts/AuthContext";
// Functions for working with questions
import { questionService } from "../../services/question/question.service.js";
// Functions for working with answers
import { answerService } from "../../services/answer/answer.service.js";
// Format dates for related questions
import { formatRelativeDate } from "../../components/QuestionCard/QuestionCard.jsx";
// Import page loading/error styles
import ui from "../../styles/pageStates.module.css";
// Import QuestionDetail page styles
import styles from "./QuestionDetail.module.css";

// TODO: Implement question details, answers, answer form, and AI Answer Fit.
// Question detail page
export default function QuestionDetail() {
  // Route and auth data
  const { questionHash } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Local state
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [error, setError] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [fitResult, setFitResult] = useState(null);
  const [fitError, setFitError] = useState("");
  const [isCheckingFit, setIsCheckingFit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Fetch the main question and its answers
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    questionService
      .getSingleQuestion(questionHash)
      .then((result) => {
        if (cancelled) return;
        setQuestion(result.question);
        setAnswers(result.answers || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [questionHash]);
  // Load related questions for the sidebar
  useEffect(() => {
    let cancelled = false;
    setRelatedLoading(true);
    questionService
      .getSimilarQuestions(questionHash, { k: 5 })
      .then((result) => {
        if (!cancelled)
          setRelated(result.data || result.similarQuestions || []);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      })
      .finally(() => {
        if (!cancelled) setRelatedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [questionHash]);
  // Ownership check
  const isOwner = question?.author?.id === user?.id;
  // Form validation helpers
  const validateAnswer = () => {
    const text = answerText.trim();
    if (!text) return "Answer content is required.";
    if (text.length < 20) return "Answer must be at least 20 characters.";
    return "";
  };
  // Answer fit checker
  const handleFit = async () => {
    const validationError = validateAnswer();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setIsCheckingFit(true);
    setFitError("");
    setSubmitError("");
    try {
      const result = await questionService.assessAnswerFit(
        questionHash,
        answerText.trim(),
      );
      setFitResult({ level: result.level, note: result.note });
    } catch (err) {
      setFitError(err.message);
    } finally {
      setIsCheckingFit(false);
    }
  };
  // Submit a new answer
  const handlePostAnswer = async (e) => {
    e.preventDefault();
    const validationError = validateAnswer();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const result = await answerService.postAnswer(
        question.id,
        answerText.trim(),
      );
      const posted = result.data;
      setAnswers((prev) => [posted, ...prev]);
      setAnswerText("");
      setFitResult(null);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Share current page URL
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* clipboard may be unavailable */
    }
  };
  // Rendering states
  if (isLoading) {
    return (
      <div
        className={`${ui.pageStates__message} ${ui["pageStates__message--loading"]} ${styles.fullState}`}
        role="status"
      >
        <Loader2 className={styles.spin} size={22} />
        <p>Loading question…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${ui.pageStates__message} ${ui["pageStates__message--error"]} ${styles.fullState}`}
        role="alert"
      >
        <strong>We couldn't load this question.</strong>
        <p>{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className={styles.primary}
        >
          Back to home
        </button>
      </div>
    );
  }
  // Main page layout
  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate("/dashboard")}>
        <ArrowLeft size={15} /> Back to feed
      </button>

      <div className={styles.columns}>
        <main>
          <article className={styles.questionCard}>
            <Author author={question.author} date={question.createdAt} />
            <h1>{question.title}</h1>
            <div className={styles.markdown}>
              <ReactMarkdown>{question.content}</ReactMarkdown>
            </div>
            <div className={styles.questionActions}>
              <button onClick={share}>
                <Share2 size={14} /> Share
              </button>
              <span>
                <MessageSquare size={14} />{" "}
                {Number(question.answerCount || answers.length)}{" "}
                {Number(question.answerCount || answers.length) === 1
                  ? "Answer"
                  : "Answers"}
              </span>
            </div>
          </article>

          <section className={styles.answersSection}>
            <div className={styles.sectionHeader}>
              <h2>Community Answers ({answers.length})</h2>
              <span>
                {answers.length ? "Newest first" : "Be the first to help"}
              </span>
            </div>

            {answers.length === 0 ? (
              <div className={styles.emptyAnswers}>
                <MessageSquare size={22} />
                <strong>No answers yet</strong>
                <p>Your explanation can start the discussion.</p>
              </div>
            ) : (
              <div className={styles.answers}>
                {answers.map((answer) => (
                  <AnswerCard key={answer.id} answer={answer} />
                ))}
              </div>
            )}
          </section>

          {!isOwner ? (
            <section className={styles.answerFormCard}>
              <div className={styles.formHeading}>
                <Send size={16} />
                <div>
                  <h2>Write an answer</h2>
                  <p>Share a clear explanation or a reproducible solution.</p>
                </div>
              </div>
              {submitError && (
                <div className={styles.error} role="alert">
                  {submitError}
                </div>
              )}
              <form onSubmit={handlePostAnswer}>
                <MarkdownEditor
                  value={answerText}
                  onChange={(value) => {
                    setAnswerText(value);
                    setSubmitError("");
                    setFitResult(null);
                  }}
                  rows={8}
                  placeholder="Write your answer in markdown…"
                  disabled={isSubmitting || isCheckingFit}
                  ariaLabel="Answer markdown editor"
                />
                <div className={styles.formBottom}>
                  <small>
                    {answerText.trim().length}/20 minimum characters
                  </small>
                  <div>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={handleFit}
                      disabled={isCheckingFit || isSubmitting}
                    >
                      {isCheckingFit ? (
                        <>
                          <Loader2 className={styles.spin} size={14} />{" "}
                          Checking…
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} /> Check answer fit
                        </>
                      )}
                    </button>
                    <button
                      type="submit"
                      className={styles.primary}
                      disabled={isSubmitting || isCheckingFit}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className={styles.spin} size={14} /> Posting…
                        </>
                      ) : (
                        "Post answer"
                      )}
                    </button>
                  </div>
                </div>
              </form>
              {fitError && <div className={styles.error}>{fitError}</div>}
              {fitResult && <FitPanel result={fitResult} />}
            </section>
          ) : (
            <div className={styles.ownerNote}>
              <UserRound size={16} />
              <p>
                You asked this question. Other community members can post
                answers here.
              </p>
            </div>
          )}
        </main>

        <aside className={styles.related}>
          <div className={styles.relatedHeader}>
            <h2>Related Questions</h2>
            <Sparkles size={15} />
          </div>
          {relatedLoading ? (
            <div className={styles.relatedLoading}>Finding related topics…</div>
          ) : related.length === 0 ? (
            <div className={styles.relatedEmpty}>
              No related questions found.
            </div>
          ) : (
            related.map((item) => (
              <Link
                to={`/questions/${item.questionHash}`}
                className={styles.relatedCard}
                key={item.questionHash || item.id}
              >
                <strong>{item.title}</strong>
                <span>
                  {item.author?.firstName || "community"}{" "}
                  {item.author?.lastName || ""} ·{" "}
                  {item.createdAt ? formatRelativeDate(item.createdAt) : ""}
                </span>
              </Link>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
// Author section component
function Author({ author, date }) {
  const name =
    `${author?.firstName || "Unknown"} ${author?.lastName || ""}`.trim();
  return (
    <div className={styles.author}>
      <div className={styles.avatar}>
        {`${author?.firstName?.[0] || ""}${author?.lastName?.[0] || ""}`.toUpperCase() ||
          "U"}
      </div>
      <div>
        <strong>{name}</strong>
        <span>Posted {date ? new Date(date).toLocaleDateString() : ""}</span>
      </div>
    </div>
  );
}
// Single answer card
function AnswerCard({ answer }) {
  return <article className={styles.answerCard}><Author author={answer.author || answer.user} date={answer.createdAt}/><div className={styles.markdown}><ReactMarkdown>{answer.content}</ReactMarkdown></div></article>;
}
// Fit result badge
function FitPanel({ result }) {
  const label =
    result.level === "strong"
      ? "Strong fit"
      : result.level === "weak"
        ? "Weak fit"
        : "Partial fit";
  return (
    <div className={`${styles.fitPanel} ${styles[`fit--${result.level}`]}`}>
      <CheckCircle2 size={17} />
      <div>
        <strong>{label}</strong>
        <p>{result.note}</p>
      </div>
    </div>
  );
}
