// Import React's useState hook for managing component state 

import { useState } from 'react';

// Import useNavigate for programmatic navigation between pages \
import { useNavigate } from 'react-router-dom';
// Import icons used throughout the page 
import { 
    ArrowLeft, 
    CheckCircle2, 
    Lightbulb, 
    Loader2, 
    Sparkles, 
    } from 'lucide-react';
// Import ReactMarkdown to render Markdown content as HTML 
import ReactMarkdown from 'react-markdown';
// Import the custom Markdown editor component 
import MarkdownEditor from '../../components/MarkdownEditor/MarkdownEditor.jsx';

// Import the question service used to communicate with the backend API 
import { questionService } from '../../services/question/question.service.js';

// Import CSS module styles for this component 
import styles from './PostQuestion.module.css';

// Initial/default values for the question form 
const initialForm = { 
    title: '', 
    content: '', 
};
/** 
 * PostQuestion Component 
 * This component allows a user to: 
 * 1. Enter a question title. 
 * 2. Write the question body using Markdown. 
 * 3. Get AI-powered feedback on the question. 
 * 4. Submit/publish the question. 
 * 5. Navigate back or return to the dashboard after publishing. 
 */ 
export default function PostQuestion() { 
    // React Router navigation function 
    const navigate = useNavigate();
    
    // Store the question title and content 
    const [formData, setFormData] = useState(initialForm); 
    
    // Track whether the question is currently being submitted 
    const [isSubmitting, setIsSubmitting] = useState(false); 
    
    // Track whether the AI Draft Coach is generating feedback 
    const [isCoaching, setIsCoaching] = useState(false); 
    
    // Store the feedback returned by the AI Draft Coach 
    const [coachFeedback, setCoachFeedback] = useState(null);

    // Store any validation or API error message 
    const [error, setError] = useState(''); 
    
    // Track whether the question was successfully published 
    const [success, setSuccess] = useState(false);

    /** 
     * Update a specific form field. 
     *  @param {string} field - The field to update, such as title or content 
     ** @param {string} value - The new value 
     */ 
    const update = (field, value) => { 
        // Update only the selected field while keeping the other fields unchanged 
        setFormData(prev => ({ 
            ...prev, 
            [field]: value, 
        }));
    // Clear any previous error when the user starts editing 
    setError(''); 
    
    // Clear old AI feedback because the question has changed 
    if (coachFeedback) { 
        setCoachFeedback(null); 
    } 
};
/** 
 *  Validate the question before submitting or requesting AI feedback. 
 *  @returns {string} An error message, or an empty string if valid 
 */ 
const validate = () => { 
    // Remove unnecessary spaces from the beginning and end 
    const title = formData.title.trim(); const content = formData.content.trim(); 
    // Check whether the title has been provided if (!title) { 
    return 'Question title is required.'; 
}
// Ensure the title is at least 5 characters long if (title.length < 5) { 
return 'Title must be at least 5 characters.'; 
} 
// Ensure the title does not exceed the database/API limit 
if (title.length > 255) { 
    return 'Title must be 255 characters or fewer.'; 
}
// Check whether the question body has been provided 
if (!content) { 
    return 'Question content is required.'; } 
    // Ensure the question body contains enough information 
    if (content.length < 10) { 
        return 'Question content must be at least 10 characters.'; } 
    // Empty string means validation passed
    return ''; 
};

/** 
 * Request AI feedback for the question draft. 
 * The AI Draft Coach provides suggestions to improve 
 * the question before it is published. 
 */ 
const handleCoach = async () => { 
    // Validate the form before sending it to the AI service 
const validationError = validate(); 
// Stop if validation fails 
if (validationError) { 
    setError(validationError); 
    return; 
}
// Show the loading state for the AI feedback button se
setIsCoaching(true); 

// Clear any previous error 
setError(''); 

try {   
// Send the question title and content to the AI coaching service 
const result = await questionService.generateQuestionDraftCoach({ 
    title: formData.title.trim(), 
    content: formData.content.trim(), 
});

// Save the returned AI feedback 
// // If no data is returned, use an empty tips array 
setCoachFeedback(result.data || { tips: [] }); 
} catch (err) { 
// Display the error returned by the API/service 
setError(err.message); 
} finally { 
// Always stop the loading state, whether the request succeeds or fails 
setIsCoaching(false); 
} 
};
/** 
 * Submit/publish the question. 
 */ 
const handleSubmit = async e => { 
// Prevent the browser from performing a normal form submission 
e.preventDefault(); 
// Validate the question before sending it to the backend 
const validationError = validate(); 
// Stop submission if validation fails 
if (validationError) { 
    setError(validationError); 
    return; 
}
// Show the publishing/loading state 
setIsSubmitting(true); 

// Clear previous errors 
setError(''); 

try { 
// Send the question to the backend API 
await questionService.createQuestion({ 
    title: formData.title.trim(), 
    content: formData.content.trim(), 
}); 

// Mark the question as successfully published 
setSuccess(true); 
// Redirect the user to the dashboard after 1.2 seconds 
setTimeout(() => navigate('/dashboard'), 1200); 
} catch (err) { 

// Display the error if publishing fails 
setError(err.message); 
} finally { 
// Stop the publishing/loading state setIsSubmitting(false); 
} 
};

/**
 * Display the success screen after the question is published. 
 *
 * This prevents the question form from being displayed 
 * after a successful submission. 
 */ 
if (success) { 
    return ( 
    <div className={styles.successPage}> 
        <div className={styles.successCard}> 
            {/* Success/check icon */}
             <CheckCircle2 
             size={42} 
             className={styles.successIcon} 
             /> 
             {/* Success message */} 
             <h1>Thread published</h1> 
             <p> Your question is now part of the community feed. </p> 
             
             {/* Actions available after publishing */} 
             <div className={styles.successActions}> 
                
            {/* Return to the dashboard/home page */} 
            <button 
                onClick={() => navigate('/dashboard')} 
                className={styles.primary} 
            > 
            Go to home 
            </button> 

            {/* Reset the form so the user can ask another question */} <button 
            onClick={() => { 
                setSuccess(false); 
                setFormData(initialForm); 
            }} 
            className={styles.secondary} 
            > 
            Ask another 
            </button> 
            </div> 
            </div> 
            </div> 
            ); 
        }
        
        /** 
         * Main question posting form. 
         */ 
        return ( 
        <div className={styles.page}> 
        {/* Back button - returns to the previous page */} 
        <button 
            className={styles.back} 
            onClick={() => navigate(-1)} 
            type="button" 
            > 
            
            <ArrowLeft size={15} /> 
            Back 
            </button> 
            
            {/* Main question form card */} 
            <section className={styles.card}>

            {/* Introduction section */} 
            <div className={styles.intro}> 
                
            {/* Small label above the main heading */} 
            <span className={styles.kicker}> 
            Start a discussion 
            </span> 
            
            <h1>Ask a question</h1> 
            
            <p> 
                Give other learners enough context to reproduce the problem and help you quickly. 
            </p> 
            </div> 
            
            {/* Information box explaining the AI Draft Coach */} 
            <div className={styles.coachInfo}> 
                
            {/* AI icon */} 
            <div className={styles.coachIcon}> 
                <Sparkles size={17} /> 
            </div> 
            
            {/* AI Draft Coach description */} 
            <div> 
                <strong>AI Draft Coach</strong> 
            <p> Get constructive checklist-style suggestions before you publish. 
            </p> 
            </div> 
            </div> 
            
            {/* Display validation/API errors when available */} 
            {error && ( 
                <div 
                className={styles.error} 
                role="alert" 
                >
            {error} 
            </div> 
            )} 
            
            {/* Question form */} 
            <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            <span>Question title</span>
            <input
              value={formData.title}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g. Why does my React route break after refresh?"
              maxLength={255}
              disabled={isSubmitting}
            />
            <small>{formData.title.length}/255 · minimum 5 characters</small>
          </label>

          <label>
            <span>Question body</span>
            <MarkdownEditor
              value={formData.content}
              onChange={value => update('content', value)}
              placeholder="Describe what you are trying to do, what you expected, what happened, and any relevant code or errors."
              rows={13}
              disabled={isSubmitting}
              ariaLabel="Question body markdown editor"
            />
            <small>Use the formatting toolbar to add headings, lists, quotes, links, inline code, and code blocks.</small>
          </label>

          <div className={styles.actions}>
            <button type="button" onClick={handleCoach} className={styles.coachButton} disabled={isCoaching || isSubmitting}>
              {isCoaching ? <><Loader2 className={styles.spin} size={15} /> Thinking…</> : <><Lightbulb size={15} /> Get AI feedback</>}
            </button>
            <button type="submit" className={styles.primary} disabled={isSubmitting || isCoaching}>
              {isSubmitting ? <><Loader2 className={styles.spin} size={15} /> Publishing…</> : 'Post question'}
            </button>
          </div>
        </form>
      </section>

      {coachFeedback && (
        <section className={styles.feedback}>
          <div className={styles.feedbackHeader}><Sparkles size={16} /><div><h2>Draft coach</h2><p>Suggestions to make the question easier to answer.</p></div></div>
          <div className={styles.tips}>
            {(coachFeedback.tips || []).map((tip, i) => <div className={styles.tip} key={`${tip}-${i}`}><span>{i + 1}</span><p>{tip}</p></div>)}
          </div>
          {formData.content && <details className={styles.preview}><summary>Preview markdown</summary><ReactMarkdown>{formData.content}</ReactMarkdown></details>}
        </section>
      )}
    </div>
  );

