# Healthcare / Medical Report Analyzer Chatbot

A React-based medical report analysis chatbot powered by Groq's LLaMA AI. This application can process medical reports through image analysis, analyze lab results, and provide detailed explanations in simple language.

#Demo
<img src="https://github.com/rag3frost/healthcare-bot-v2/blob/main/2025-01-26-12-09-57.gif" alt="Medical Report Analyzer Demo" width="500" height="300">
<img src="https://github.com/rag3frost/healthcare-bot-v2/blob/main/2025-01-26-12-12-18_1.gif" alt="Medical Report Analyzer Demo" width="500" height="300">
<img src="https://github.com/rag3frost/healthcare-bot-v2/blob/main/2025-01-26-12-13-16.gif" alt="Medical Report Analyzer Demo" width="500" height="300">

## Features

- 🏥 Medical report analysis with detailed explanations
- 📷 Image processing and analysis
- 🤖 Two-stage LLaMA AI processing:
  1. Initial image analysis and text extraction
  2. Detailed medical analysis and interpretation
- 🎯 Precise analysis of medical reports and documents
- 🗣️ Voice input support
- 💬 Interactive chat interface
- ✨ Markdown support for formatted responses
- 🌓 Dark/Light mode support

### Unique Image Analysis Pipeline

This chatbot features a sophisticated document processing pipeline:

1. Upload a medical document image
2. The image is processed directly by LLaMA's vision model
3. The AI provides structured analysis of the image content
4. You can ask follow-up questions about specific aspects of the report
5. The entire process happens seamlessly in real-time

## Technologies Used

- React.js
- Groq API (LLaMA 3.3 70B & LLaMA 3.2 90B Vision)
- TailwindCSS
- React Markdown
- React Icons
- Vercel Speed Insights

## Prerequisites

Before you begin, ensure you have:

- Node.js (v14 or higher)
- npm or yarn
- A Groq API key

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd medical-report-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Groq API credentials:
```env
REACT_APP_GROQ_API_KEY=your_api_key_here
REACT_APP_GROQ_BASE_URL=https://api.groq.com/openai/v1
```

4. Start the development server:
```bash
npm start
```

The application will open in your default browser at `http://localhost:3000`.

## Usage

1. **Upload a Medical Report**
   - Click the image icon in the input area
   - Select a medical report image (supported formats: jpg, png)
   - The AI will automatically analyze the image

2. **Voice Input**
   - Click the microphone icon for voice input
   - Speak your question or description
   - The text will appear in the input area

3. **View Analysis**
   - The chatbot will provide a detailed analysis
   - Results are formatted with clear sections
   - Medical terms are explained in simple language

4. **Dark/Light Mode**
   - Toggle between dark and light modes using the sun/moon icon
   - Your preference is automatically saved

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Groq for providing powerful LLaMA models
- React and its community for the excellent framework and tools
- Vercel for hosting and performance insights

## Contact


Project Link: [https://github.com/rag3frost/health-bot](https://github.com/rag3frost/health-bot)

## Support

⭐️ If you found this project helpful, please give it a star!

---

Made with ❤️ by Sujal Sakhare
