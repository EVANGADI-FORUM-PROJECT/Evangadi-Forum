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