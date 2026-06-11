export const MODES = [
  {
    id: 'chat',
    name: 'Chat',
    emoji: '💬',
    tagline: 'Everyday questions, anything goes',
    suggestions: [
      'Explain quantum computing like I’m 12',
      'Plan a 3-day budget trip to Rome',
      'Give me 5 ideas for a side hustle',
      'What should I cook with rice, eggs and spinach?',
    ],
  },
  {
    id: 'homework',
    name: 'Homework',
    emoji: '📚',
    tagline: 'Step-by-step help that actually teaches',
    suggestions: [
      'Walk me through solving x² + 5x + 6 = 0',
      'Explain photosynthesis for my bio exam',
      'Help me outline an essay on climate change',
      'What’s the difference between mitosis and meiosis?',
    ],
  },
  {
    id: 'research',
    name: 'Research',
    emoji: '🔍',
    tagline: 'Deep, structured answers',
    suggestions: [
      'Compare React vs Vue vs Svelte in 2026',
      'Summarize the pros and cons of nuclear energy',
      'How do interest rates affect housing prices?',
      'Break down how LLMs are trained',
    ],
  },
  {
    id: 'humanizer',
    name: 'Humanizer',
    emoji: '✍️',
    tagline: 'Make AI text sound like you wrote it',
    suggestions: [
      'Humanize this paragraph for my blog…',
      'Rewrite my cover letter so it sounds natural',
      'Make this LinkedIn post less robotic',
      'Turn these bullet points into a casual email',
    ],
  },
  {
    id: 'code',
    name: 'Code',
    emoji: '💻',
    tagline: 'Debug, build and learn to program',
    suggestions: [
      'Build a responsive navbar in React',
      'Why is my fetch returning undefined?',
      'Explain async/await with a simple example',
      'Write a Python script to rename files in bulk',
    ],
  },
  {
    id: 'creative',
    name: 'Creative',
    emoji: '🎨',
    tagline: 'Stories, captions and wild ideas',
    suggestions: [
      'Write a 100-word sci-fi story about Mars',
      'Catchy Instagram captions for a beach trip',
      'Name ideas for my coffee brand',
      'Plot twist ideas for my short film',
    ],
  },
]

export const getMode = (id) => MODES.find((m) => m.id === id) ?? MODES[0]
