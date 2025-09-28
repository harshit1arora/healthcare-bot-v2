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

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(new Error('Failed to read image file'));
    });
  };

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
            content: 'You are a smart rainwater harvesting assistant. You provide information and answer questions related to rainwater harvesting, smart monitoring, water conservation, and rooftop rainwater management. Help users with practical advice and data-driven insights.'
          }, {
            role: 'user',
            content: text
          }],
          temperature: 0.7,
          max_completion_tokens: 1024,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
        } catch {
          throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const responseText = await response.text();
      if (!responseText.trim()) throw new Error('Empty response from API');

      const data = JSON.parse(responseText);
      if (!data.choices?.[0]?.message) throw new Error('Invalid response structure from API');

      return data.choices[0].message.content;
    } catch (error) {
      throw error;
    }
  };

  const processImageWithPrompt = async (image, userPrompt) => {
    try {
      const base64Image = await getBase64(image);
      const imageDataUri = base64Image.startsWith('data:') 
        ? base64Image 
        : `data:${image.type};base64,${base64Image.split(',')[1] || base64Image}`;
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `As a smart rainwater harvesting assistant, please analyze this image and respond to the user's question: ${userPrompt}. Provide insights on rainwater harvesting and rooftop water management.` },
              { type: 'image_url', image_url: { url: imageDataUri } }
            ]
          }],
          max_completion_tokens: 1024,
          temperature: 0.3,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
        } catch {
          throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const responseText = await response.text();
      if (!responseText.trim()) throw new Error('Empty response from API');

      const data = JSON.parse(responseText);
      if (!data.choices?.[0]?.message) throw new Error('Invalid response structure from API');

      return data.choices[0].message.content;
    } catch (error) {
      throw error;
    }
  };

  const handleImageInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (!file.type.startsWith('image/')) throw new Error('Please upload an image file (JPEG, PNG, etc.)');
      if (file.size > 4 * 1024 * 1024) throw new Error('Image size should be less than 4MB for processing');

      const img = new Image();
      img.onload = () => {
        const maxPixels = 33177600; // 33 megapixels limit
        if (img.width * img.height > maxPixels) {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: 'Error: Image resolution too high. Please use an image with less than 33 megapixels.',
            timestamp: new Date()
          }]);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        setPendingImage(file);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: 'Error: Invalid image file. Please try with a different image.',
          timestamp: new Date()
        }]);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `Error: ${error.message}. Please try again with a different image.`,
        timestamp: new Date()
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input, timestamp: new Date() };
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
      const botResponse = { role: 'bot', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, botResponse]);
      speakText(response);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again, and if the problem persists, check your internet connection or try with a different image/question.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) setDarkMode(JSON.parse(savedMode));
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => setInput(event.results[0][0].transcript);
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') alert('Microphone access was denied. Please allow microphone access.');
        else alert(`Speech recognition error: ${event.error}`);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowWelcome(true);
    setImagePreview(null);
    setPendingImage(null);
    setInput('');
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
                  JalRakshak AI
                </h1>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    darkMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  title="Clear Chat"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <FaSun className="w-5 h-5 text-yellow-400" /> : <FaMoon className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
          </div>
        </header>

        <div className="messages-container">
          {showWelcome && (
            <div className="message-wrapper bot-message-wrapper">
              <div className="bot-logo-wrapper">
                <SmallBotLogo />
              </div>
              <div className="welcome-message">
                <p>Hello! 👋 I'm here to assist you with your smart rainwater harvesting need. Whether you have questions about rainwater harvesting, smart calculations, analysis, or need help with free smart assessment, feel free to ask.</p>
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
            <div className="message-wrapper bot-message-wrapper">
              <div className="bot-logo-wrapper">
                <SmallBotLogo />
              </div>
              <div className="loading-dots dark:bg-gray-800">
                <div className="dot dark:bg-purple-400"></div>
                <div className="dot dark:bg-purple-400"></div>
                <div className="dot dark:bg-purple-400"></div>
              </div>
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
                  ? "What would you like to know about this document?" 
                  : "Type your message... "}
                className="chat-input dark:bg-gray-800 dark:text-white dark:border-gray-700"
                rows="1"
                disabled={isLoading}
              />
              <div className="action-buttons">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="action-button dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  title="Upload Image"
                  disabled={isLoading}
                >
                  <FaImage className="w-4 h-4" />
                </button>
                <button
                  onClick={handleVoiceInput}
                  className={`action-button dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
                    isListening ? 'text-purple-500 dark:text-purple-400' : ''
                  }`}
                  title="Voice Input"
                  disabled={isLoading}
                >
                  <FaMicrophone className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSend}
                  className="action-button send-button dark:bg-purple-600 dark:hover:bg-purple-700"
                  disabled={!input.trim() || isLoading}
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
