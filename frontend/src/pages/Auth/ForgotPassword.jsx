import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageSquare } from "lucide-react";
import { authService } from "../../services/auth/auth.service";
import styles from "./Auth.module.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.forgotPassword(normalizedEmail);
      setMessage(result.message);
    } catch (err) {
      setError(err.message || "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth}>
      <section className={styles.auth__info}>
        <div className={styles.auth__infoContent}>
          <div className={styles.auth__infoBranding} onClick={() => navigate("/")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/"); } }}>
            <div className={styles.auth__infoLogo} aria-hidden><MessageSquare size={22} /></div>
            <div className={styles.auth__infoBrandCopy}>
              <p className={styles.auth__infoTitle}>Evangadi Forum</p>
              <p className={styles.auth__infoTagline}>Learn together. Ask with context.</p>
            </div>
          </div>
          <p className={styles.auth__infoDescription}>
            Enter your email and we will send you a link to create a new password.
          </p>
        </div>
      </section>

      <section className={styles.auth__formSection}>
        <div className={styles.auth__formContainer}>
          <div className={styles.auth__formHeader}>
            <h2 className={styles.auth__formTitle}>Forgot your password?</h2>
            <p className={styles.auth__formSubtitle}>Enter your email address to receive a password reset link.</p>
          </div>

          <form className={styles.auth__form} onSubmit={handleSubmit}>
            <div className={styles.auth__inputGroup}>
              <label htmlFor="email" className={styles.auth__label}>Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className={styles.auth__input}
                autoComplete="email" required disabled={loading} value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {message && <div role="status" className={styles.auth__success}>{message}</div>}
            {error && <div role="alert" className={styles.auth__error}>{error}</div>}

            <div className={styles.auth__buttonContainer}>
              <button type="submit" className={`${styles.auth__button} ${styles["auth__button--primary"]}`} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
                {!loading && <ArrowRight size={16} className={styles.auth__buttonIcon} />}
              </button>
            </div>
          </form>

          <footer className={styles.auth__formFooter}>
            <p className={styles.auth__formFooterText}>
              Remember your password?
              <button onClick={() => navigate("/auth")} className={styles.auth__formFooterLink}>Back to sign in</button>
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
}
