import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bold, Code2, Heading2, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react';
import styles from './MarkdownEditor.module.css';

const tools = [
  { id: 'bold', label: 'Bold', icon: Bold, prefix: '**', suffix: '**', placeholder: 'bold text' },
  { id: 'italic', label: 'Italic', icon: Italic, prefix: '*', suffix: '*', placeholder: 'italic text' },
  { id: 'heading', label: 'Heading', icon: Heading2, prefix: '## ', suffix: '', placeholder: 'heading' },
  { id: 'bullet', label: 'Bulleted list', icon: List, prefix: '- ', suffix: '', placeholder: 'list item' },
  { id: 'numbered', label: 'Numbered list', icon: ListOrdered, prefix: '1. ', suffix: '', placeholder: 'list item' },
  { id: 'quote', label: 'Quote', icon: Quote, prefix: '> ', suffix: '', placeholder: 'quoted text' },
  { id: 'inline-code', label: 'Inline code', icon: Code2, prefix: '`', suffix: '`', placeholder: 'code' },
  { id: 'code-block', label: 'Code block', icon: Code2, prefix: '```\n', suffix: '\n```', placeholder: 'your code here' },
  { id: 'link', label: 'Link', icon: Link2, prefix: '[', suffix: '](https://)', placeholder: 'link text' },
];

export default function MarkdownEditor() {
  // TODO: Implement markdown editing/formatting and preview as required by the task specification.
 value,
  onChange,
  placeholder,
  rows = 13,
  disabled = false,
  preview = true,
  className = '',
  ariaLabel = 'Markdown editor',
}) 