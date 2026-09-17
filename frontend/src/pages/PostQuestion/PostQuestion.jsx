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