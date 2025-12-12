#StageReady - AI-Powered Live Stream Practice Environment

##Project Overview
StageReady is a simulated live streaming environment that helps content creators practice and improve their streaming skills before going live. It solves the challenge of practicing live streams in a realistic setting without an actual audience.

##The Problem
Content creators, educators, and presenters often struggle with:
Nervousness when going live for the first time
No way to practice engaging with a live audience
Lack of feedback on their streaming presence
Difficulty preparing for spontaneous audience interactions

## The Solution
StageReady provides a realistic practice environment with:
AI-Generated Live Chat - Simulated audience comments that respond to what you're actually saying, powered by Google Gemini's audio understanding
Raise Hand Feature - AI audience members can "raise their hand" to ask questions or share insights, just like in Zoom
AI Co-Host Integration - Invite raised-hand users to co-host your stream with natural voice conversation powered by ElevenLabs Conversational AI
Post-Stream Summary - Generate summaries of your practice session in various styles (Casual, Academic, LinkedIn)
Video Recording - Download your practice sessions for review

## ***Tech Stack
Frontend
React 19 - UI framework
TypeScript - Type-safe development
Vite - Build tool and dev server
Tailwind CSS - Utility-first styling (via CDN)
AI/ML Services
Google Gemini API (@google/genai) - Audio processing for generating contextual live chat comments and post-stream summaries
ElevenLabs Conversational AI (@elevenlabs/react) - Voice-based AI co-host that can listen and respond naturally
Browser APIs
MediaRecorder API - Video and audio recording
Web Audio API - Real-time audio processing for live comment generation
getUserMedia - Camera and microphone access

## ***Setup & Installation
Prerequisites
Node.js 18+
npm or yarn
A modern browser (Chrome, Firefox, Edge)
Environment Variables
Create a .env file in the project root:
GEMINI_API_KEY=your_google_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

Installation
### Clone the repository
git clone https://github.com/your-username/StageReady.git
cd StageReady
### Install dependencies
npm install
### Start development server
npm run dev
The app will be available at http://localhost:3000
Build for Production
npm run build
npm run preview
***Demo Video
> [[Insert Demo Video Link Here](https://youtu.be/1DkC9Gb4RRM)]
>
> A short demo video (≤ 2 minutes) showcasing the main features:
> 1. Starting a live stream practice session
> 2. AI-generated comments responding to speech
> 3. Audience members raising their hands
> 4. Inviting a co-host and having a conversation
> 5. Generating a post-stream summary
***Tools & APIs Used
Open Source Libraries
| Tool | Purpose |
|------|---------|
| React | UI framework |
| Vite | Build tool and dev server |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS | Utility-first CSS framework |
APIs & Services
| Service | Purpose |
|---------|---------|
| Google Gemini API | Audio understanding for generating contextual comments and summaries |
| ElevenLabs Conversational AI | Voice-based AI co-host with natural conversation |
| DiceBear Avatars | Generated avatars for co-host profiles |
npm Packages
@google/genai - Google Generative AI SDK
@elevenlabs/react - ElevenLabs React SDK for conversational AI
@vitejs/plugin-react - Vite plugin for React
typescript - TypeScript compiler
***Project Structure
StageReady/
├── App.tsx                    # Main application component
├── index.tsx                  # React entry point
├── index.html                 # HTML template
├── types.ts                   # TypeScript type definitions
├── utils.ts                   # Utility functions
├── vite.config.ts             # Vite configuration
├── components/
│   ├── Button.tsx             # Reusable button component
│   ├── ChatStream.tsx         # Live chat display
│   ├── StreamOverlay.tsx      # LIVE indicator and stats
│   ├── RaisedHandsPanel.tsx   # Raised hands UI
│   └── CoHostWindow.tsx       # Co-host video window
└── services/
    ├── geminiService.ts       # Google Gemini API integration
    └── elevenLabsService.ts   # ElevenLabs API integration
***Features
1. Live Chat Simulation
Real-time AI-generated comments based on your speech
Mix of supportive fans, curious questions, and casual observers
Comments appear with realistic timing and usernames
2. Raise Hand System
10-15% of AI audience members "raise their hand"
Each raised hand includes a reason for wanting to speak
Host can invite or dismiss raised hands
3. AI Co-Host
Invite raised-hand users to become co-hosts
Natural voice conversation powered by ElevenLabs
Co-host responds based on their reason for raising hand
Visual indicators for speaking/listening states
4. Post-Stream Tools
Download recorded video
Generate AI summaries in multiple styles
Copy summaries for social media sharing
***License
MIT License - feel free to use and modify for your own projects.
***Acknowledgments
Built for the ElevenLabs Hackathon. Special thanks to:
Google for the Gemini API
ElevenLabs for the Conversational AI platform
The open-source community for the amazing tools
