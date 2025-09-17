import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaMicrophone, FaPaperPlane, FaImage, FaSun, FaMoon, FaTimes } from 'react-icons/fa';
import { SpeedInsights } from '@vercel/speed-insights/react';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_BASE_URL = process.env.REACT_APP_GROQ_BASE_URL;
const GROQ_TEXT_MODEL = process.env.REACT_APP_GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = process.env.REACT_APP_GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

if (!GROQ_API_KEY || !GROQ_BASE_URL) {
  console.error('Missing REACT_APP_GROQ_API_KEY or REACT_APP_GROQ_BASE_URL. Set them in .env.local and rebuild.');
}

const BotLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" className="mr-3">
    <circle cx="20" cy="20" r="18" fill="#8B5CF6" />
    <path d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM24 21H21V24C21 24.552 20.552 25 20 25C19.448 25 19 24.552 19 24V21H16C15.448 21 15 20.552 15 20C15 19.448 15.448 19 16 19H19V16C19 15.448 19.448 15 20 15C20.552 15 21 15.448 21 16V19H24C24.552 19 25 19.448 25 20C25 20.552 24.552 21 24 21Z" fill="white" />
  </svg>
);

const SmallBotLogo = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" className="mr-2 flex-shrink-0">
    <circle cx="20" cy="20" r="18" fill="#8B5CF6" />
    <path d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM24 21H21V24C21 24.552 20.552 25 20 25C19.448 25 19 24.552 19 24V21H16C15.448 21 15 20.552 15 20C15 19.448 15.448 19 16 19H19V16C19 15.448 19.448 15 20 15C20.552 15 21 15.448 21 16V19H24C24.552 19 25 19.448 25 20C25 20.552 24.552 21 24 21Z" fill="white" />
  </svg>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Text-only Groq call
  const processWithGroq = async (text) => {
    const prompt = text?.trim() || 'Provide general health guidance.';
    const payload = {
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful medical assistant that answers general medical questions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 768
    };

    const resp = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Text request failed (${resp.status} ${resp.statusText}): ${txt}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? 'No response.';
  };

  // Vision Groq call using a temporary HTTPS object URL (more reliable than large base64)
  const processImageWithPrompt = async (image, userPrompt) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(image.type)) {
      throw new Error('Only JPEG and PNG images are supported.');
    }
    if (image.size > 5 * 1024 * 1024) {
      throw new Error('Image too large. Please upload under 5 MB.');
    }

    const objectUrl = URL.createObjectURL(image); // blob:https URL over https origin
    const prompt =
      userPrompt?.trim() ||
      'Analyze this medical document image. Extract key findings, reference ranges, impressions, and explain simply.';

    const payload = {
      model: GROQ_VISION_MODEL,
      messages: [
        { role: 'system', content: 'You analyze medical documents from images and explain results clearly and safely.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: objectUrl } }
          ]
        }
      ],
      max_tokens: 640,
      temperature: 0.2
    };

    const resp = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify(payload)
    });

    // Revoke early to free memory
    URL.revokeObjectURL(objectUrl);

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Vision request failed (${resp.status} ${resp.statusText}): ${txt}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? 'No response.';
  };

  const handleImageInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
      }
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
      setPendingImage(file);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', content: `Error: ${error.message}`, timestamp: new Date() }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !pendingImage) return;

    const userMessage = { role: 'user', content: input || '(sent image)', timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText;
      if (pendingImage) {
        responseText = await processImageWithPrompt(pendingImage, input);
        setPendingImage(null);
        setImagePreview(null);
      } else {
        responseText = await processWithGroq(input);
      }
      setMessages((prev) => [...prev, { role: 'bot', content: responseText, timestamp: new Date() }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: `Error: ${error.message}. Try a JPEG/PNG under 5 MB.`, timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice input with robust handling
  const handleVoiceInput = async () => {
    const hasWebkit = 'webkitSpeechRecognition' in window;
    const isSecure = window.isSecureContext;
    if (!hasWebkit || !isSecure) {
      alert('Voice input requires Chrome on a secure (https) site. As a fallback, consider using a cloud ASR API.');
      return;
    }

    try {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = (event) => {
        let msg = 'Voice input error.';
        if (event.error === 'not-allowed') msg = 'Microphone permission denied. Please allow mic access in the browser.';
        if (event.error === 'no-speech') msg = 'No speech detected. Try again in a quieter environment.';
        alert(msg);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      alert('Voice input failed to start. Please check browser permissions.');
    }
  };

  // UI helpers
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && messages.some((m) => m.role === 'user')) setShowWelcome(false);
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', !!darkMode);
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="chat-container">
        <header className="header-container">
          <div className="header-content">
            <div className="flex items-center">
              <BotLogo />
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>HealthHype</h1>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>YOUR HEALTH, SIMPLIFIED.</p>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {darkMode ? <FaSun className="w-5 h-5 text-yellow-400" /> : <FaMoon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </header>

        <div className="messages-container">
          {showWelcome && (
            <div className="message-wrapper bot-message-wrapper">
              <div className="bot-logo-wrapper"><SmallBotLogo /></div>
              <div className="welcome-message"><p>Upload a report image (JPEG/PNG under 5 MB) or type a question to begin.</p></div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`message-wrapper ${message.role === 'user' ? 'user-message-wrapper' : 'bot-message-wrapper'}`}>
              {message.role === 'bot' && <div className="bot-logo-wrapper"><SmallBotLogo /></div>}
              <div className={`chat-message ${message.role === 'user' ? 'user-message dark:bg-purple-900 dark:text-white' : 'bot-message dark:bg-gray-800 dark:text-gray-200'}`}>
                {message.role === 'bot' ? <ReactMarkdown>{message.content}</ReactMarkdown> : message.content}
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
                <button onClick={() => { setImagePreview(null); setPendingImage(null); }} className="close-button" title="Remove image">
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
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={pendingImage ? 'What would you like to know about this medical document?' : 'Type your message...'}
                className="chat-input dark:bg-gray-800 dark:text-white dark:border-gray-700"
                rows="1"
              />
              <div className="action-buttons">
                <button onClick={() => fileInputRef.current?.click()} className="action-button dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600" title="Upload Image">
                  <FaImage className="w-4 h-4" />
                </button>
                <button onClick={handleVoiceInput} className={`action-button dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${isListening ? 'text-purple-500 dark:text-purple-400' : ''}`} title="Voice Input">
                  <FaMicrophone className="w-4 h-4" />
                </button>
                <button onClick={handleSend} className="action-button send-button dark:bg-purple-600 dark:hover:bg-purple-700" disabled={(!input.trim() && !pendingImage) || isLoading}>
                  <FaPaperPlane className="w-4 h-4 text-white" />
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageInput} accept="image/png,image/jpeg" className="hidden" />
            </div>
          </div>
        </div>
      </div>

      <SpeedInsights />
    </div>
  );
}

export default App;
