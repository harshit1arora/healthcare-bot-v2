import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Image, Sun, Moon, X } from 'lucide-react';

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
  const recognitionRef = useRef(null);

  // Mock function to simulate AI response (replace with your actual API call)
  const processWithAI = async (text, image = null) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (image) {
      return `I can see you've uploaded an image. For a real medical assistant, I would analyze this medical document and provide insights about the findings, reference ranges, and key information. Please note: This is a demo version - in production, this would connect to your Groq API for actual image analysis.`;
    } else {
      return `Thank you for your question: "${text}". This is a demo response. In the production version, this would connect to your Groq API to provide actual medical assistance and health guidance. Please consult with healthcare professionals for real medical advice.`;
    }
  };

  const handleImageInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image too large. Please upload under 5 MB.');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target.result);
      };
      reader.readAsDataURL(file);
      setPendingImage(file);

      // Clear the input so the same file can be selected again
      e.target.value = '';
      
    } catch (error) {
      setMessages((prev) => [...prev, { 
        role: 'bot', 
        content: `Error: ${error.message}`, 
        timestamp: new Date() 
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !pendingImage) return;

    const userMessage = { 
      role: 'user', 
      content: input || '(sent image)', 
      timestamp: new Date(),
      hasImage: !!pendingImage
    };
    
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = pendingImage;
    
    // Clear inputs immediately
    setInput('');
    setPendingImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const responseText = await processWithAI(currentInput, currentImage);
      setMessages((prev) => [...prev, { 
        role: 'bot', 
        content: responseText, 
        timestamp: new Date() 
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, { 
        role: 'bot', 
        content: `Error: ${error.message}. Please try again.`, 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    // Check for speech recognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for voice input.');
      return;
    }

    // Check for secure context (HTTPS)
    if (!window.isSecureContext) {
      alert('Voice input requires a secure connection (HTTPS). Please use HTTPS for voice functionality.');
      return;
    }

    try {
      // Use the standard API if available, fallback to webkit
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure recognition
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        console.log('Speech recognition result:', event);
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          console.log('Transcript:', transcript);
          setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = 'Voice input error occurred.';
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your microphone connection.';
            break;
          case 'network':
            errorMessage = 'Network error occurred. Please check your internet connection.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        alert(errorMessage);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      // Store reference for cleanup
      recognitionRef.current = recognition;
      
      // Start recognition
      recognition.start();
      console.log('Starting speech recognition...');
      
    } catch (error) {
      console.error('Speech recognition initialization error:', error);
      setIsListening(false);
      alert('Failed to initialize voice input. Please try again or check browser permissions.');
    }
  };

  // Cleanup speech recognition on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && messages.some((m) => m.role === 'user')) {
      setShowWelcome(false);
    }
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col h-screen max-w-4xl mx-auto">
        {/* Header */}
        <header className={`p-4 border-b transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BotLogo />
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  HealthHype
                </h1>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  YOUR HEALTH, SIMPLIFIED.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? 
                <Sun className="w-5 h-5 text-yellow-400" /> : 
                <Moon className="w-5 h-5 text-gray-600" />
              }
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showWelcome && (
            <div className="flex items-start space-x-2">
              <SmallBotLogo />
              <div className={`p-4 rounded-lg max-w-md ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} shadow-sm`}>
                <p>Upload a medical report image (JPEG/PNG under 5 MB) or type a question to begin.</p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex items-start space-x-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'bot' && <SmallBotLogo />}
              <div className={`p-4 rounded-lg max-w-md shadow-sm ${
                message.role === 'user' 
                  ? darkMode 
                    ? 'bg-purple-900 text-white' 
                    : 'bg-purple-600 text-white'
                  : darkMode 
                    ? 'bg-gray-800 text-gray-200' 
                    : 'bg-white text-gray-800'
              }`}>
                {message.hasImage && (
                  <div className="mb-2 text-sm opacity-75">
                    📷 Image uploaded
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-2">
              <SmallBotLogo />
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-purple-400' : 'bg-purple-600'}`} style={{animationDelay: '0ms'}}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-purple-400' : 'bg-purple-600'}`} style={{animationDelay: '150ms'}}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-purple-400' : 'bg-purple-600'}`} style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Uploaded document"
                  className="max-h-32 rounded-lg border"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setPendingImage(null);
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={pendingImage ? 'What would you like to know about this medical document?' : 'Type your message...'}
                className={`w-full p-3 border rounded-lg resize-none transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                rows="1"
                style={{ minHeight: '48px' }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Upload Image"
              >
                <Image className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleVoiceInput}
                className={`p-3 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Voice Input"
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingImage) || isLoading}
                className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send Message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageInput}
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
