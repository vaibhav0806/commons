-- Prospective cohorts only: historical context reads cannot be reconstructed.
CREATE TABLE workspace_activation (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  workspace_created_at bigint NOT NULL,
  first_agent_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  first_agent_connected_at bigint,
  second_agent_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  second_agent_connected_at bigint,
  second_agent_context_read_at bigint
);
