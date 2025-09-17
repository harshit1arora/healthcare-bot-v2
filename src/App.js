import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Image, Sun, Moon, X } from 'lucide-react';

// API configurations - using placeholder values for demo
const GROQ_API_KEY = 'demo-key'; // In production: process.env.REACT_APP_GROQ_API_KEY
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'; // In production: process.env.REACT_APP_GROQ_BASE_URL

// For demo purposes, we'll simulate API calls
const IS_DEMO_MODE = true;

// Logo components
const BotLogo = () => (
  <svg 
    width="40" 
    height="40" 
    viewBox="0 0 40 40" 
    className="mr-3"
  >
    <circle cx="20" cy="20" r="18" fill="#8B5CF6" />
    <path
      d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM24 21H21V24C21 24.552 20.552 25 20 25C19.448 25 19 24.552 19 24V21H16C15.448 21 15 20.552 15 20C15 19.448 15.448 19 16 19H19V16C19 15.448 19.448 15 20 15C20.552 15 21 15.448 21 16V19H24C24.552 19 25 19.448 25 20C25 20.552 24.552 21 24 21Z"
      fill="white"
    />
  </svg>
);

const SmallBotLogo = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 40 40" 
    className="mr-2 flex-shrink-0"
  >
    <circle cx="20" cy="20" r="18" fill="#8B5CF6" />
    <path
      d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM24 21H21V24C21 24.552 20.552 25 20 25C19.448 25 19 24.552 19 24V21H16C15.448 21 15 20.552 15 20C15 19.448 15.448 19 16 19H19V16C19 15.448 19.448 15 20 15C20.552 15 21 15.448 21 16V19H24C24.552 19 25 19.448 25 20C25 20.552 24.552 21 24 21Z"
      fill="white"
    />
  </svg>
);

// Markdown renderer component
const MarkdownRenderer = ({ content }) => {
  // Simple markdown parsing for basic formatting
  const parseMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>');
  };

  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
};

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

  // Helper function to convert file to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Process text with Groq API (or simulate in demo mode)
  const processWithGroq = async (text) => {
    if (IS_DEMO_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate demo response based on input
      if (text.toLowerCase().includes('symptom')) {
        return `Thank you for your question about symptoms: "${text}". 

**Important Note:** This is a demo version of HealthHype. In the production version, I would provide detailed medical guidance through Groq's AI models.

For your symptoms, I recommend:
- Monitor your symptoms carefully
- Stay hydrated and get adequate rest
- Consider consulting with a healthcare professional if symptoms persist or worsen
- Keep a symptom diary to track patterns

**Disclaimer:** Always consult with qualified healthcare professionals for medical advice, diagnosis, or treatment. This demo is for illustration purposes only.`;
      } else if (text.toLowerCase().includes('medication') || text.toLowerCase().includes('medicine')) {
        return `Regarding your medication question: "${text}"

**Demo Response:** In the full version, I would provide comprehensive information about medications using Groq's medical AI models.

General medication guidance:
- Always follow your healthcare provider's instructions
- Take medications as prescribed
- Be aware of potential side effects
- Inform your doctor about all medications you're taking
- Never stop or change medications without consulting your healthcare provider

**Note:** This is a demonstration. For actual medication information, please consult your healthcare provider or pharmacist.`;
      } else {
        return `Thank you for your health question: "${text}"

**Demo Mode Active:** This is a demonstration of the HealthHype interface. In the production version, this would connect to Groq's advanced AI models to provide:

- Detailed medical information and guidance
- Symptom analysis and recommendations  
- Medication information and interactions
- Wellness tips and preventive care advice
- Evidence-based health insights

**Key Features in Production:**
- Real-time AI-powered responses using Groq's Llama models
- Medical document analysis and interpretation
- Personalized health recommendations
- Integration with medical databases

**Important:** Always consult healthcare professionals for medical decisions. This AI assistant is meant to supplement, not replace, professional medical advice.`;
      }
    }

    // Production API call (when not in demo mode)
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
            content: 'You are a helpful medical assistant that can analyze medical documents and answer general medical questions. Provide clear, informative responses while emphasizing the importance of consulting healthcare professionals for medical decisions.'
          }, {
            role: 'user',
            content: text
          }],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Groq API Error:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response received from the API.';
    } catch (error) {
      console.error('Error in Groq processing:', error);
      throw new Error(`Failed to process request: ${error.message}`);
    }
  };

  // Process image with prompt using Groq API (or simulate in demo mode)
  const processImageWithPrompt = async (image, userPrompt) => {
    if (IS_DEMO_MODE) {
      // Simulate API delay for image processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return `**Medical Document Analysis - Demo Mode**

I can see you've uploaded an image file (${image.name}, ${(image.size / 1024).toFixed(1)}KB).

${userPrompt ? `Your question: "${userPrompt}"` : ''}

**Demo Analysis Results:**
In the production version with Groq's vision AI, I would provide:

🔍 **Document Analysis:**
- Extract text from medical reports, lab results, prescriptions
- Identify key medical terms and values
- Highlight important findings and abnormalities

📊 **Key Findings:** 
- Reference ranges and normal values
- Flagged results requiring attention
- Trend analysis for follow-up tests

💡 **Simple Explanations:**
- Break down complex medical terminology
- Explain what results mean in plain language
- Provide context for understanding your health data

📋 **Recommendations:**
- Suggest follow-up actions based on results
- When to contact your healthcare provider
- Questions to ask your doctor

**Current Status:** Demo mode active - upload functionality working! In production, this would connect to Groq's Llama Vision models for actual medical document analysis.

**Important:** Always discuss medical documents and results with your healthcare provider for proper interpretation and guidance.`;
    }

    // Production API call (when not in demo mode)
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(image.type)) {
        throw new Error('Only JPEG and PNG images are supported.');
      }

      // Validate file size (10MB limit)
      if (image.size > 10 * 1024 * 1024) {
        throw new Error('Image size should be less than 10MB.');
      }

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
            role: 'system',
            content: 'You are a medical document analysis assistant. Analyze medical documents and images, extract key findings, and explain them in simple terms. Always remind users to consult healthcare professionals for medical decisions.'
          }, {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: userPrompt || 'Please analyze this medical document or image and explain the key findings in simple terms.'
              },
              { 
                type: 'image_url', 
                image_url: { url: base64Image } 
              }
            ]
          }],
          max_tokens: 1024,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Groq Vision API Error:', errorData);
        throw new Error(`Vision API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response received from the vision API.';
    } catch (error) {
      console.error('Error processing image with Groq:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  };

  // Handle image input
  const handleImageInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, etc.)');
      }

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size should be less than 10MB');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      setPendingImage(file);
      
      // Clear the input
      e.target.value = '';
      
    } catch (error) {
      console.error('Error with image:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `Error: ${error.message}. Please try again with a different image.`,
        timestamp: new Date()
      }]);
    }
  };

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() && !pendingImage) return;

    const userMessage = {
      role: 'user',
      content: input || '(sent image)',
      timestamp: new Date(),
      hasImage: !!pendingImage
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = pendingImage;
    
    // Clear inputs immediately
    setInput('');
    setPendingImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      let response;
      
      if (currentImage) {
        response = await processImageWithPrompt(currentImage, currentInput);
      } else {
        response = await processWithGroq(currentInput);
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

  // Handle voice input
  const handleVoiceInput = () => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for voice input.');
      return;
    }

    // Check for secure context
    if (!window.isSecureContext) {
      alert('Voice input requires a secure connection (HTTPS). Please use HTTPS for voice functionality.');
      return;
    }

    try {
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
          setInput(prev => prev ? `${prev} ${transcript}` : transcript);
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

      // Store reference and start
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Speech recognition initialization error:', error);
      setIsListening(false);
      alert('Failed to initialize voice input. Please try again or check browser permissions.');
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hide welcome message when user sends first message
  useEffect(() => {
    if (messages.length > 0 && messages.some(msg => msg.role === 'user')) {
      setShowWelcome(false);
    }
  }, [messages]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  // Update dark mode in localStorage and document class
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Handle keyboard input
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
              <div className={`p-4 rounded-lg max-w-md shadow-sm ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
                <p>Hello! 👋 I'm here to assist you with your healthcare needs. Whether you have questions about symptoms, medications, wellness tips, or need help analyzing medical documents, feel free to ask. How can I help you today?</p>
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
                {message.role === 'bot' ? (
                  <MarkdownRenderer content={message.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-2">
              <SmallBotLogo />
              <div className={`p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
                placeholder={pendingImage 
                  ? "What would you like to know about this medical document?" 
                  : "Type your message..."}
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
