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