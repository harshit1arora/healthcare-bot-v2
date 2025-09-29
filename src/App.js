import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaMicrophone, FaPaperPlane, FaImage, FaSun, FaMoon, FaTimes, FaVolumeUp } from 'react-icons/fa';
import { SpeedInsights } from '@vercel/speed-insights/react';

// API configurations can stay outside
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_BASE_URL = process.env.REACT_APP_GROQ_BASE_URL;

// Validation can stay outside
if (!GROQ_API_KEY || !GROQ_BASE_URL) {
  console.error(`
    Missing environment variables:
    Groq API: ${GROQ_API_KEY && GROQ_BASE_URL ? '✓' : '✗'}
    Please check your .env.local file.
  `);
}

// Logo component can stay outside
const BotLogo = () => (
  <svg 
    width="40" 
    height="40" 
    viewBox="0 0 40 40" 
    className="mr-3"
  >
    <circle cx="20" cy="20" r="18" fill="#3B82F6" />
    <path
      d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM24 21H21V24C21 24.552 20.552 25 20 25C19.448 25 19 24.552 19 24V21H16C15.448 21 15 20.552 15 20C15 19.448 15.448 19 16 19H19V16C19 15.448 19.448 15 20 15C20.552 15 21 15.448 21 16V19H24C24.552 19 25 19.448 25 20C25 20.552 24.552 21 24 21Z"
      fill="white"
    />
  </svg>
);

// Smaller BotLogo for messages with blue circle
const SmallBotLogo = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 40 40" 
    className="mr-2 flex-shrink-0"
  >
    <circle cx="20" cy="20" r="18" fill="#3B82F6" />
    <path
      d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM24 21H21V24C21 24.552 20.552 25 20 25C19.448 25 19 24.552 19 24V21H16C15.448 21 15 20.552 15 20C15 19.448 15.448 19 16 19H19V16C19 15.448 19.448 15 20 15C20.552 15 21 15.448 21 16V19H24C24.552 19 25 19.448 25 20C25 20.552 24.552 21 24 21Z"
      fill="white"
    />
  </svg>
);

function App() {
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

  // Convert file to Base64 string
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Groq text processing
  const processWithGroq = async (text) => {
    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'system',
            content: 'You are a helpful medical assistant that can analyze medical documents and answer general medical questions.'
          }, {
            role: 'user',
            content: text
          }],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to process request');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in Groq processing:', error);
      throw error;
    }
  };

  // Groq image processing with user prompt
  const processImageWithPrompt = async (image, userPrompt) => {
    try {
      const base64Image = await getBase64(image);
      
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.2-90b-vision-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }],
          max_tokens: 1024,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Groq API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to process image');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error processing image with Groq:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  };

  // Handle image file input
  const handleImageInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, etc.)');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size should be less than 10MB');
      }

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      setPendingImage(file);
      
    } catch (error) {
      console.error('Error with image:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `Error: ${error.message}. Please try again with a different image.`,
        timestamp: new Date()
      }]);
    }
  };

  // Handle sending user input
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
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `Error: ${error.message}. Please try again.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && messages.some(msg => msg.role === 'user')) {
      setShowWelcome(false);
    }
  }, [messages]);

  // Dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) setDarkMode(JSON.parse(savedMode));
  }, []);

  // Update dark mode class and localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Voice input handling
  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };

  // Text to Speech: speak last bot message
  const handleTextToSpeech = () => {
    const lastBotMessage = [...messages].reverse().find(msg => msg.role === 'bot');
    if (!lastBotMessage) return;

    const utterance = new SpeechSynthesisUtterance();
    // Strip markdown for better speech
    utterance.text = lastBotMessage.content.replace(/[#>*_\[\]]/g, '') || 'No message to read.';
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="chat-container">
        <header className="header-container">
          <div className="header-content">
            <div className="flex items-center">
              <BotLogo />
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  JalSanrakshak AI
                </h1>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                </p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <FaSun className="w-5 h-5 text-yellow-400" /> : <FaMoon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </header>

        <div className="messages-container">
          {showWelcome && (
            <div className="message-wrapper bot-message-wrapper">
              <div className="bot-logo-wrapper">
                <SmallBotLogo />
              </div>
              <div className="welcome-message">
                <p>Hello! 👋 I'm here to assist you with your smart rainwater harvesting needs. Whether you have questions about rainwater harvesting, smart calculations, analysis or need help with free smart assessment, feel free to ask. How can I help you today?</p>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message-wrapper ${message.role === 'user' ? 'user-message-wrapper' : 'bot-message-wrapper'}`}
            >
              {message.role === 'bot' && (
                <div className="bot-logo-wrapper">
                  <SmallBotLogo />
                </div>
              )}
              <div className={`chat-message ${
                message.role === 'user' 
                  ? 'user-message dark:bg-purple-900 dark:text-white' 
                  : 'bot-message dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {message.role === 'bot' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="loading-dots dark:bg-gray-800">
              <div className="dot dark:bg-purple-400"></div>
              <div className="dot dark:bg-purple-400"></div>
              <div className="dot dark:bg-purple-400"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          {imagePreview && (
            <div className="image-preview-wrapper">
              <div className="image-preview-container">
                <img src={imagePreview} alt="Uploaded document" className="image-preview" />
                <button 
                  onClick={() => {
                    setImagePreview(null);
                    setPendingImage(null);
                  }}
                  className="close-button"
                  title="Remove image"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={pendingImage 
                  ? "What would you like to know about this medical document?" 
                  : "Type your message..."}
                className="chat-input dark:bg-gray-800 dark:text-white dark:border-gray-700"
                rows="1"
              />
              <div className="action-buttons">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="action-button dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  title="Upload Image"
                >
                  <FaImage className="w-4 h-4" />
                </button>
                <button
                  onClick={handleVoiceInput}
                  className={`action-button dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
                    isListening ? 'text-purple-500 dark:text-purple-400' : ''
                  }`}
                  title="Voice Input"
                >
                  <FaMicrophone className="w-4 h-4" />
                </button>
                <button
                  onClick={handleTextToSpeech}
                  className="action-button dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  title="Text to Speech"
                >
                  <FaVolumeUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSend}
                  className="action-button send-button dark:bg-purple-600 dark:hover:bg-purple-700"
                  disabled={!input.trim() || isLoading}
                  title="Send Message"
                >
                  <FaPaperPlane className="w-4 h-4 text-white" />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageInput}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
      <SpeedInsights />
    </div>
  );
}

export default App;
