ALTER TABLE participants ADD COLUMN agent_identity text;
ALTER TABLE participants ADD CONSTRAINT participants_agent_identity_check CHECK (
  agent_identity IS NULL OR (
    kind = 'agent' AND agent_identity IN (
      'muse', 'claude', 'codex', 'instinct', 'grok-bot', 'hermes',
      'openclaw', 'openai-dots', 'poke', 'cue', 'claude-duet'
    )
  )
);
