/**
 * @file Landing.jsx
 * @description Public marketing route (`/`) for Evangadi Forum.
 *
 * Architecture & Design Alignment:
 * - Layout, spacing, typography, and card tokens align with the in-app shell
 *   (Evangadi Slate + Vibrant Orange design system).
 * - Implements full marketing narrative: Header, Hero, Course RAG pipeline,
 *   Capabilities grid, 4-step workflow process, Call to Action, and Footer.
 * - Optimized for accessibility with semantic landmarks (<header>, <main>,
 *   <section>, <aside>, <nav>, <footer>, <ol>, <ul>, <article>) and ARIA attributes.
 * - Incorporates Framer Motion for subtle entry transitions on hero elements.
 *
 * @module components/landing/Landing
 */

// ─── External Libraries & Hooks ───────────────────────────────────────────────
import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ─── Icon System (Lucide React) ───────────────────────────────────────────────
import {
  Sparkles,
  MessageSquare,
  Search,
  PenSquare,
  Library,
  ArrowRight,
  CheckCircle2,
  Layers,
  FileText,
  Database,
} from "lucide-react";

// ─── Modular Stylesheet ───────────────────────────────────────────────────────
import styles from "./Landing.module.css";

/**
 * Landing Component
 *
 * Primary marketing entry point for visitors and prospective learners.
 * Features an interactive layout with anchor scrolling to key sections
 * ("Course RAG", "How it works") and direct navigation to authentication routes.
 *
 * @returns {JSX.Element} The rendered marketing landing page.
 */
export default function Landing() {
  // Navigation hook for programmatic client-side routing between pages
  const navigate = useNavigate();

  /**
   * Smoothly scrolls the viewport to the 'How it works' workflow section.
   */
  const scrollToHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Smoothly scrolls the viewport to the 'Course RAG' pipeline section.
   */
  const scrollToCourseRag = () => {
    document
      .getElementById("course-rag")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.landing}>
      {/* =========================================================================
          HEADER & NAVIGATION BAR
          Sticky top navigation with brand lockup, section jump links, and auth CTAs
         ========================================================================= */}
      <header className={styles.landing__header}>
        <div
          className={styles.landing__headerInner}>
          {/* Brand Lockup: Logo mark and title/tagline text */}
          <button
            type="button"
            className={styles.landing__brand}
            onClick={() => navigate("/")}
            aria-label="Evangadi Forum home">
            {/* Orange gradient icon badge with message bubble symbol */}
            <span
              className={
                styles.landing__brandMark
              }
              aria-hidden="true">
              <MessageSquare
                size={20}
                strokeWidth={2}
              />
            </span>
            {/* Text lockup: Brand name and descriptive cohort tagline */}
            <span
              className={
                styles.landing__brandText
              }>
              <span
                className={
                  styles.landing__brandName
                }>
                Evangadi Forum
              </span>
              <span
                className={
                  styles.landing__brandLine
                }>
                Learn together. Ask with context.
              </span>
            </span>
          </button>

          {/* Marketing Navigation Links: Smooth scroll triggers */}
          <nav
            className={styles.landing__nav}
            aria-label="Marketing Navigation">
            <button
              type="button"
              className={styles.landing__navLink}
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }>
              Overview
            </button>
            <button
              type="button"
              className={styles.landing__navLink}
              onClick={scrollToCourseRag}>
              Course RAG
            </button>
            <button
              type="button"
              className={styles.landing__navLink}
              onClick={scrollToHowItWorks}>
              How it works
            </button>
          </nav>

          {/* Header Action Buttons: Sign In link & Create Account CTA */}
          <div
            className={
              styles.landing__headerActions
            }>
            <button
              type="button"
              className={styles.landing__btnGhost}
              onClick={() => navigate("/auth")}>
              Sign in
            </button>
            <button
              type="button"
              className={
                styles.landing__btnPrimary
              }
              onClick={() => navigate("/auth")}>
              Create account
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTENT AREA
          Sequential presentation: Hero -> Course RAG -> Capabilities -> Process -> CTA
         ========================================================================= */}
      <main className={styles.landing__main}>
        {/* -----------------------------------------------------------------------
            1. HERO SECTION
            Dominant value proposition with dual action buttons and feature panel
           ----------------------------------------------------------------------- */}
        <section
          className={styles.landing__hero}
          aria-label="Hero Introduction">
          <div
            className={styles.landing__heroInner}>
            {/* Left Column: Hero copy, eyebrow badge, heading, and action CTAs */}
            <div
              className={
                styles.landing__heroCopy
              }>
              {/* Eyebrow Pill: Highlight technical search capabilities */}
              <Motion.p
                className={
                  styles.landing__eyebrow
                }
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}>
                <Sparkles
                  size={14}
                  aria-hidden="true"
                />
                KEYWORD SEARCH + EMBEDDING
                SIMILARITY
              </Motion.p>

              {/* Main Headline: Two-tone typography with accent color */}
              <Motion.h1
                className={styles.landing__title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}>
                A calm place for{" "}
                <span
                  className={
                    styles.landing__titleAccent
                  }>
                  technical Q&A
                </span>
              </Motion.h1>

              {/* Value Proposition Description */}
              <Motion.p
                className={styles.landing__lead}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}>
                Post with enough context for peers
                to help in one pass. Search the
                archive by phrase or by meaning,
                keep your threads in one place,
                and ground questions in{" "}
                <strong
                  className={
                    styles.landing__leadStrong
                  }>
                  course documents
                </strong>{" "}
                with retrieval-augmented
                generation (RAG) so answers cite
                the right syllabus, readings, and
                handouts.
              </Motion.p>

              {/* Call-to-Action Group: Primary registration and secondary workflow jump */}
              <Motion.div
                className={
                  styles.landing__heroCtas
                }
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}>
                <button
                  type="button"
                  className={
                    styles.landing__btnPrimary
                  }
                  onClick={() =>
                    navigate("/auth")
                  }>
                  Get started
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  className={
                    styles.landing__btnOutline
                  }
                  onClick={scrollToHowItWorks}>
                  See how it works
                </button>
              </Motion.div>
            </div>

            {/* Right Column: 'At a Glance' Inset Summary Card */}
            <aside
              className={
                styles.landing__heroPanel
              }
              aria-label="Key platform features at a glance">
              <p
                className={
                  styles.landing__heroPanelLabel
                }>
                AT A GLANCE
              </p>
              <ul
                className={
                  styles.landing__heroPanelList
                }>
                {/* Feature 1: Structured markdown support */}
                <li>
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                  <span>
                    Markdown threads and replies
                  </span>
                </li>

                {/* Feature 2: Vector embedding search */}
                <li>
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                  <span>
                    Semantic search on question
                    embeddings
                  </span>
                </li>

                {/* Feature 3: Non-intrusive AI assistance */}
                <li>
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                  <span>
                    Optional AI draft tips when
                    you ask or answer
                  </span>
                </li>

                {/* Feature 4: Course RAG with citation-backed responses */}
                <li>
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                  <span>
                    <strong
                      className={
                        styles.landing__heroPanelStrong
                      }>
                      Course RAG:
                    </strong>{" "}
                    upload or sync course
                    materials, retrieve the best
                    chunks for each question, and
                    answer with citations, not
                    generic web text.
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            2. COURSE RAG SECTION
            Detailed technical breakdown of the retrieval-augmented generation pipeline
           ----------------------------------------------------------------------- */}
        <section
          className={styles.landing__rag}
          id="course-rag"
          aria-labelledby="rag-heading">
          <div
            className={
              styles.landing__sectionInner
            }>
            {/* Section Eyebrow */}
            <p
              className={
                styles.landing__ragEyebrow
              }>
              RETRIEVAL-AUGMENTED GENERATION
            </p>

            {/* Section Heading */}
            <h2
              className={
                styles.landing__sectionTitle
              }
              id="rag-heading">
              How course RAG works with the forum
            </h2>

            {/* Explanatory Lead Prose */}
            <p
              className={
                styles.landing__sectionLead
              }>
              Forum search already helps you find{" "}
              <em>similar questions</em> from
              peers. RAG goes further: it finds{" "}
              <em>
                evidence inside your own documents
              </em>{" "}
              (readings, rubrics, lab specs) and
              surfaces those snippets when you
              write or review an answer. That
              keeps AI assistance on-policy for
              Evangadi-style courses and reduces
              “confident but wrong” generic
              answers.
            </p>

            {/* Pipeline Steps Grid: Ingest -> Retrieve -> Ground */}
            <div
              className={
                styles.landing__ragPipeline
              }>
              {/* Step 1: Document Ingestion and Chunking */}
              <article
                className={
                  styles.landing__ragStep
                }>
                <span
                  className={
                    styles.landing__ragStepIcon
                  }
                  aria-hidden="true">
                  <FileText size={20} />
                </span>
                <h3
                  className={
                    styles.landing__ragStepTitle
                  }>
                  Ingest & chunk
                </h3>
                <p
                  className={
                    styles.landing__ragStepText
                  }>
                  Upload or connect course files;
                  split them into overlapping
                  chunks and store embeddings the
                  same way we already embed
                  questions, so retrieval stays
                  fast and auditable.
                </p>
              </article>

              {/* Step 2: Context Retrieval at Query Time */}
              <article
                className={
                  styles.landing__ragStep
                }>
                <span
                  className={
                    styles.landing__ragStepIcon
                  }
                  aria-hidden="true">
                  <Database size={20} />
                </span>
                <h3
                  className={
                    styles.landing__ragStepTitle
                  }>
                  Retrieve at question time
                </h3>
                <p
                  className={
                    styles.landing__ragStepText
                  }>
                  When you open Ask or run a
                  search, the app pulls the
                  top-matching chunks from the
                  cohort corpus (with scores), not
                  just other threads. That is
                  ideal for “what does the
                  syllabus say about…” style
                  questions.
                </p>
              </article>

              {/* Step 3: Source-Grounded AI & Peer Responses */}
              <article
                className={
                  styles.landing__ragStep
                }>
                <span
                  className={
                    styles.landing__ragStepIcon
                  }
                  aria-hidden="true">
                  <Sparkles size={20} />
                </span>
                <h3
                  className={
                    styles.landing__ragStepTitle
                  }>
                  Grounded responses
                </h3>
                <p
                  className={
                    styles.landing__ragStepText
                  }>
                  Downstream prompts quote or
                  summarize only from retrieved
                  spans, with room for instructors
                  to review sources. The UI makes
                  it obvious when an answer drew
                  on RAG versus peer replies
                  alone.
                </p>
              </article>
            </div>

            {/* Architecture Integration Footnote Banner */}
            <p
              className={
                styles.landing__ragFootnote
              }>
              Live forum threads, semantic
              question search, draft/fit AI
              helpers, and this RAG pipeline work
              together: uploads and access control
              live in the Knowledge base per
              cohort, and RAG-backed context shows
              up in the same thread view you
              already use.
            </p>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            3. CAPABILITIES GRID
            4-Card showcase of features designed specifically for cohort learning
           ----------------------------------------------------------------------- */}
        <section
          className={styles.landing__capabilities}
          aria-labelledby="capabilities-heading">
          <div
            className={
              styles.landing__sectionInner
            }>
            <h2
              className={
                styles.landing__sectionTitle
              }
              id="capabilities-heading">
              Built for cohort coursework
            </h2>
            <p
              className={
                styles.landing__sectionLead
              }>
              Same patterns you use after sign-in,
              without a separate “marketing
              product.”
            </p>

            {/* 4-Card Responsive Grid */}
            <div
              className={
                styles.landing__cardGrid
              }>
              {/* Capability 1: Keyword and Similarity Search */}
              <article
                className={styles.landing__card}>
                <div
                  className={
                    styles.landing__cardIcon
                  }
                  aria-hidden="true">
                  <Search
                    size={22}
                    strokeWidth={1.75}
                  />
                </div>
                <h3
                  className={
                    styles.landing__cardTitle
                  }>
                  Find related work
                </h3>
                <p
                  className={
                    styles.landing__cardBody
                  }>
                  Keyword filters for exact
                  matches, plus similarity search
                  when you are still shaping the
                  right vocabulary.
                </p>
              </article>

              {/* Capability 2: Structured Discussion Threads */}
              <article
                className={styles.landing__card}>
                <div
                  className={
                    styles.landing__cardIcon
                  }
                  aria-hidden="true">
                  <MessageSquare
                    size={22}
                    strokeWidth={1.75}
                  />
                </div>
                <h3
                  className={
                    styles.landing__cardTitle
                  }>
                  Readable threads
                </h3>
                <p
                  className={
                    styles.landing__cardBody
                  }>
                  Questions and answers stay
                  structured so the group can
                  reuse explanations before exams
                  and interviews.
                </p>
              </article>

              {/* Capability 3: Lightweight AI Feedback */}
              <article
                className={styles.landing__card}>
                <div
                  className={
                    styles.landing__cardIcon
                  }
                  aria-hidden="true">
                  <Sparkles
                    size={22}
                    strokeWidth={1.75}
                  />
                </div>
                <h3
                  className={
                    styles.landing__cardTitle
                  }>
                  Lightweight AI help
                </h3>
                <p
                  className={
                    styles.landing__cardBody
                  }>
                  Suggestions on your question
                  draft and a quick relevance
                  check on answer drafts. Always
                  your choice to apply or post.
                </p>
              </article>

              {/* Capability 4: Dedicated Cohort Document Corpus */}
              <article
                className={styles.landing__card}>
                <div
                  className={
                    styles.landing__cardIcon
                  }
                  aria-hidden="true">
                  <Layers
                    size={22}
                    strokeWidth={1.75}
                  />
                </div>
                <h3
                  className={
                    styles.landing__cardTitle
                  }>
                  RAG over your course library
                </h3>
                <p
                  className={
                    styles.landing__cardBody
                  }>
                  Instructors and cohorts add
                  PDFs, syllabi, and notes into a
                  controlled corpus. When you ask,
                  the system retrieves the most
                  relevant passages and attaches
                  them to the prompt, so
                  explanations stay tied to your
                  class materials, not the open
                  web.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            4. WORKFLOW PROCESS (HOW IT WORKS)
            2x2 grid representing the 4 sequential steps in the peer Q&A lifecycle
           ----------------------------------------------------------------------- */}
        <section
          className={styles.landing__process}
          id="how-it-works"
          aria-labelledby="how-heading">
          <div
            className={
              styles.landing__sectionInner
            }>
            <h2
              className={
                styles.landing__sectionTitle
              }
              id="how-heading">
              How it works
            </h2>
            <p
              className={
                styles.landing__sectionLead
              }>
              Four steps from question to
              searchable knowledge for the next
              person.
            </p>

            {/* Ordered List of Steps (2x2 Grid) */}
            <ol className={styles.landing__steps}>
              {/* Step 1: Formulating Questions with Environment Context */}
              <li
                className={styles.landing__step}>
                <span
                  className={
                    styles.landing__stepIcon
                  }
                  aria-hidden="true">
                  <PenSquare size={18} />
                </span>
                <div>
                  <h3
                    className={
                      styles.landing__stepTitle
                    }>
                    Ask with context
                  </h3>
                  <p
                    className={
                      styles.landing__stepText
                    }>
                    Title, environment, errors,
                    and what you tried, so peers
                    reproduce before they teach.
                  </p>
                </div>
              </li>

              {/* Step 2: Collaborative Answers with Markdown & Code */}
              <li
                className={styles.landing__step}>
                <span
                  className={
                    styles.landing__stepIcon
                  }
                  aria-hidden="true">
                  <MessageSquare size={18} />
                </span>
                <div>
                  <h3
                    className={
                      styles.landing__stepTitle
                    }>
                    Get answers
                  </h3>
                  <p
                    className={
                      styles.landing__stepText
                    }>
                    Replies live in one thread
                    with markdown and code blocks,
                    visible to everyone in the
                    cohort.
                  </p>
                </div>
              </li>

              {/* Step 3: Dual-Mode Search (Literal + Semantic Vector) */}
              <li
                className={styles.landing__step}>
                <span
                  className={
                    styles.landing__stepIcon
                  }
                  aria-hidden="true">
                  <Search size={18} />
                </span>
                <div>
                  <h3
                    className={
                      styles.landing__stepTitle
                    }>
                    Search two ways
                  </h3>
                  <p
                    className={
                      styles.landing__stepText
                    }>
                    Classic text search on the
                    feed, or semantic search when
                    you want “questions like this
                    one.”
                  </p>
                </div>
              </li>

              {/* Step 4: Knowledge Retention & Grounded Trails */}
              <li
                className={styles.landing__step}>
                <span
                  className={
                    styles.landing__stepIcon
                  }
                  aria-hidden="true">
                  <Library size={18} />
                </span>
                <div>
                  <h3
                    className={
                      styles.landing__stepTitle
                    }>
                    Own your trail
                  </h3>
                  <p
                    className={
                      styles.landing__stepText
                    }>
                    Your topics list keeps
                    authorship clear. The
                    Knowledge base hosts uploads
                    and RAG retrieval so answers
                    can cite your materials. See{" "}
                    <strong>Course RAG</strong>{" "}
                    above for the full pipeline.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            5. FINAL CALL TO ACTION (READY WHEN YOU ARE)
            Prominent registration invitation in an elevated container
           ----------------------------------------------------------------------- */}
        <section
          className={styles.landing__cta}
          aria-labelledby="cta-heading">
          {/* Centered elevated white card surrounded by soft slate background */}
          <div
            className={styles.landing__ctaInner}>
            <h2
              className={styles.landing__ctaTitle}
              id="cta-heading">
              Ready when you are
            </h2>
            <p
              className={styles.landing__ctaText}>
              Create a free learner account to
              post, reply, and search the forum
              index.
            </p>
            <button
              type="button"
              className={
                styles.landing__btnPrimary
              }
              onClick={() => navigate("/auth")}>
              Create free account
              <ArrowRight
                size={16}
                aria-hidden="true"
              />
            </button>
          </div>
        </section>
      </main>

      {/* =========================================================================
          SITE FOOTER
          Persistent copyright, platform metadata, and legal links
         ========================================================================= */}
      <footer className={styles.landing__footer}>
        <div
          className={styles.landing__footerInner}>
          {/* Left: Brand name and dynamic copyright notice */}
          <div>
            <p
              className={
                styles.landing__footerBrand
              }>
              Evangadi Forum
            </p>
            <p
              className={
                styles.landing__footerMeta
              }>
              © {new Date().getFullYear()} ·
              Learner-led Q&A
            </p>
          </div>

          {/* Right: Unadorned navigational and policy anchors */}
          <div
            className={
              styles.landing__footerLinks
            }>
            <button
              type="button"
              className={
                styles.landing__footerLink
              }
              onClick={() => navigate("/auth")}>
              Sign in
            </button>
            <a
              href="#privacy"
              className={
                styles.landing__footerLinkAnchor
              }>
              Privacy
            </a>
            <a
              href="#terms"
              className={
                styles.landing__footerLinkAnchor
              }>
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
