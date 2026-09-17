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