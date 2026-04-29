<div align="center">
<img width="1200" height="475" alt="GHBanner" src="Assets/Screenshot_20260318_214641.jpg" />

# 🌸 Komorebi
**Your Japanese Learning AI Companion**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-komorebi.onrender.com-brightgreen?style=for-the-badge)](https://komoreebi.onrender.com)
</div>

---

## 📋 Overview

Komorebi is an AI-powered Japanese learning application built with **React 19** and powered by **Google Gemini AI**. The app features an intuitive interface for learning Japanese characters, vocabulary, and grammar with AI assistance, real-time feedback, and progress tracking.

### ✨ Key Features
- 🤖 **AI-Powered Learning** - Powered by Google Gemini API for intelligent, personalized feedback
- 📱 **Responsive Design** - Beautiful UI built with React 19, Tailwind CSS, and Lucide icons
- 📊 **Progress Tracking** - Track your learning journey with interactive charts (Recharts)
- 🔐 **Secure Backend** - Firebase authentication and Firestore database
- 📄 **Export Progress** - Generate PDF reports of your learning journey
- ⚡ **Real-time Updates** - Live synchronization with Firebase

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Gemini API Key** - Get it from [Google AI Studio](https://ai.google.dev)
- **Firebase Project** (optional, for full features)

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/riteshkumar477823-wq/Komorebi.git
   cd Komorebi
   npm install
   ```

2. **Configure Environment**
   
   Create or update `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your-gemini-api-key-here
   VITE_FIREBASE_CONFIG=your-firebase-config
   ```

   Refer to `.env.example` for all available options.

3. **Run Locally**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
Komorebi/
├── src/                    # React components and application logic
├── public/                 # Static assets
├── Assets/                 # Design assets
├── server.ts               # Express backend server
├── firebase-blueprint.json # Firebase configuration
├── firestore.rules         # Firestore security rules
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - Latest React with modern hooks and features
- **Vite** - Lightning-fast build tool
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icon library
- **Recharts** - Interactive charts and graphs

### Backend & Services
- **Express 5** - Node.js web framework
- **Firebase** - Authentication & Realtime Database
- **Firestore** - Cloud document database
- **Google Gemini API** - AI-powered responses

### Utilities
- **Axios** - HTTP client
- **date-fns** - Date manipulation
- **html2canvas & jsPDF** - PDF export functionality
- **Motion** - Smooth animations
- **React Markdown** - Markdown rendering

---

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm start` | Start production server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove dist directory |

---

## 🌐 Deployment

The app is currently deployed on:
- **Render**: [komoreebi.onrender.com](https://komoreebi.onrender.com)

### Deploy to Render
1. Push to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy!

---

## 🔐 Environment Variables

```env
# Required
VITE_GEMINI_API_KEY=your-gemini-api-key

# Firebase (optional)
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-firebase-key
# ... other firebase config
```

See `.env.example` for complete configuration options.

---

## 📖 Learning Features

- **Interactive Lessons** - Engaging lessons powered by AI
- **Vocabulary Builder** - Learn common Japanese words and phrases
- **Grammar Guide** - Master Japanese grammar with examples
- **Progress Dashboard** - Visualize your learning progress
- **AI Feedback** - Get personalized feedback on your answers

---

## 📝 License

This project is no open source and available under the permission of the Ritesh

---

## 🙋 Support & Questions

- 📧 **Report Issues**: [Create an Issue](https://github.com/riteshkumar477823-wq/Komorebi/issues)
- 💬 **Discussions**: [Join Discussions](https://github.com/riteshkumar477823-wq/Komorebi/discussions)
- 🌐 **Live App**: [Visit Komorebi](https://komoreebi.onrender.com)

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline mode support
- [ ] Community forums
- [ ] Multiplayer lessons
- [ ] Advanced spaced repetition algorithm
- [ ] Voice recognition for pronunciation

---

<div align="center">

**Made with ❤️ by [@riteshkumar477823-wq](https://github.com/riteshkumar477823-wq)**

*"Komorebi" (木漏れ日) - the beautiful light that filters through the trees* 🌳

</div>
