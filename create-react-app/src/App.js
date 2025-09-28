import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaMicrophone, FaPaperPlane, FaImage, FaSun, FaMoon, FaTimes } from 'react-icons/fa';
import { SpeedInsights } from '@vercel/speed-insights/react';

// API configurations
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_BASE_URL = process.env.REACT_APP_GROQ_BASE_URL;

// Validation
if (!GROQ_API_KEY || !GROQ_BASE_URL) {
  console.error(`
    Missing environment variables:
    Groq API: ${GROQ_API_KEY && GROQ_BASE_URL ? '✓' : '✗'}
    Please check your .env.local file.
  `);
}

// Logo component - Droplet icon in dark blue
const BotLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#1e3a8a" className="mr-3">
    <path d="M12 2.69c-.55.65-5.79 7.63-5.79 11.83a5.79 5.79 0 1 0 11.58 0c0-4.2-5.24-11.18-5.79-11.83zm0 15.6a3.81 3.81 0 1 1 3.81-3.81 3.82 3.82 0 0 1-3.81 3.81z"/>
  </svg>
);

// Small version of the BotLogo for messages
const SmallBotLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1e3a8a" className="mr-2 flex-shrink-0">
    <path d="M12 2.69c-.55.65-5.79 7.63-5.79 11.83a5.79 5.79 0 1 0 11.58 0c0-4.2-5.24-11.18-5.79-11.83zm0 15.6a3.81 3.81 0 1 1 3.81-3.81 3.82 3.82 0 0 1-3.81 3.81z"/>
  </svg>
);

// Text-to-Speech helper
const speakText = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("TTS not supported in this browser.");
  }
};

function App() {
  // State declarations
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [rawOcrText, setRawOcrText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ... [keep all your existing helper and API call functions here] ...

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Failed to read image file'));
      };
    });
  };

  const processWithGroq = async (text) => {
    // ...existing fetch logic with API...
  };

  const processImageWithPrompt = async (image, userPrompt) => {
    // ...existing fetch logic with image API...
  };

  const handleImageInput = async (e) => {
    // ... existing image input handler ...
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;

      if (pendingImage) {
        response = await processImageWithPrompt(pendingImage, input);
        setPendingImage(null);
        setImagePreview(null);
      } else {
        response = await processWithGroq(input);
      }

      const botResponse = {
        role: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);

      // Speak the response aloud
      speakText(response);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again, and if the problem persists, check your internet connection or try with a different image/question.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... [keep all your existing useEffect hooks and JSX rendering here] ...

  // Ensure to keep your existing JSX layout with dark mode toggle, chat messages, input controls, etc.

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      {/* Your existing JSX UI here */}
    </div>
  );
}

export default App;
