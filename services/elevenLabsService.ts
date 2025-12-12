const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const API_BASE = 'https://api.elevenlabs.io/v1';

interface CreateAgentConfig {
  name: string;
  systemPrompt: string;
  firstMessage: string;
  voiceId: string;
}

export const COHOST_SYSTEM_PROMPT = `
You are a friendly and engaged co-host on a live stream. Your role is to:

1. LISTEN actively to what the host is saying
2. ASK thoughtful follow-up questions that help the audience understand better
3. SHARE brief insights that add value to the conversation
4. ACKNOWLEDGE the host's points naturally ("That's a great point...", "I see what you mean...")

Personality traits:
- Curious and genuinely interested
- Supportive but not sycophantic
- Knowledgeable but humble
- Natural conversational flow with reactions like "uh huh", "right", "interesting"

Guidelines:
- Keep responses concise (1-3 sentences)
- Ask one question at a time
- Never interrupt - wait for natural pauses
- React naturally to what the host says
`;

export const COHOST_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
];

export const createCoHostAgent = async (config: CreateAgentConfig): Promise<string> => {
  const response = await fetch(`${API_BASE}/convai/agents/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      name: config.name,
      conversation_config: {
        agent: {
          first_message: config.firstMessage,
          language: 'en',
          prompt: {
            prompt: config.systemPrompt,
          },
        },
        tts: {
          model_id: 'eleven_turbo_v2',
          voice_id: config.voiceId,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create agent: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.agent_id;
};

export const getSignedUrl = async (agentId: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/convai/conversation/get_signed_url?agent_id=${agentId}`, {
    method: 'GET',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get signed URL: ${response.statusText}`);
  }

  const data = await response.json();
  return data.signed_url;
};
