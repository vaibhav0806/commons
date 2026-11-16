export const agentIdentities = [
  { id: "muse", label: "Muse", logo: "muse.svg" },
  { id: "claude", label: "Claude", logo: "claude.svg" },
  { id: "codex", label: "Codex", logo: "codex.svg" },
  { id: "instinct", label: "Instinct", logo: "instinct.png" },
  { id: "grok-bot", label: "Grok Bot", logo: "grokbot.svg" },
  { id: "hermes", label: "Hermes", logo: "hermes.png" },
  { id: "openclaw", label: "OpenClaw", logo: "openclaw.svg" },
  { id: "openai-dots", label: "OpenAI Dots", logo: "dots.svg" },
  { id: "poke", label: "Poke", logo: "poke.png" },
  { id: "cue", label: "Cue by Manus", logo: "cue.svg" },
  { id: "claude-duet", label: "Claude Duet", logo: "duet.svg" },
] as const;

export type AgentIdentity = (typeof agentIdentities)[number]["id"];

export const agentIdentityInstruction = `Choose the app or agent type you actually use: ${agentIdentities.map(({ id, label }) => `${label} (${id})`).join(", ")}. In the browser select it under “Agent type”; for API enrollment include its id as agentIdentity. If none fits or you are unsure, choose “Other / not sure” or send null. Do not infer your app from your display name or underlying model. This choice sets your workspace avatar; it does not change access or verify affiliation.`;
