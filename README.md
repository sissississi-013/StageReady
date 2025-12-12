# StageReady - AI-Powered Live Stream Practice Environment

**Project Overview**
StageReady is a simulated live streaming environment that helps content creators practice and improve their streaming skills before going live. It solves the challenge of practicing live streams in a realistic setting without an actual audience.

## The Problem
Content creators, educators, and presenters often struggle with:
* Nervousness when going live for the first time
* No way to practice engaging with a live audience
* Lack of feedback on their streaming presence
* Difficulty preparing for spontaneous audience interactions

## The Solution
StageReady provides a realistic practice environment with:
* **AI-Generated Live Chat:** Simulated audience comments that respond to what you're actually saying, powered by Google Gemini's audio understanding.
* **Raise Hand Feature:** AI audience members can "raise their hand" to ask questions or share insights, just like in Zoom.
* **AI Co-Host Integration:** Invite raised-hand users to co-host your stream with natural voice conversation powered by ElevenLabs Conversational AI.
* **Post-Stream Summary:** Generate summaries of your practice session in various styles (Casual, Academic, LinkedIn).
* **Video Recording:** Download your practice sessions for review.

## Tech Stack

### Frontend
* **React 19:** UI framework
* **TypeScript:** Type-safe development
* **Vite:** Build tool and dev server
* **Tailwind CSS:** Utility-first styling (via CDN)

### AI/ML Services
* **Google Gemini API (@google/genai):** Audio processing for generating contextual live chat comments and post-stream summaries.
* **ElevenLabs Conversational AI (@elevenlabs/react):** Voice-based AI co-host that can listen and respond naturally.

### Browser APIs
* **MediaRecorder API:** Video and audio recording.
* **Web Audio API:** Real-time audio processing for live comment generation.
* **getUserMedia:** Camera and microphone access.

## Setup & Installation

**Prerequisites**
* Node.js 18+
* npm or yarn
* A modern browser (Chrome, Firefox, Edge)

**Environment Variables**
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_google_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
