CREATE TABLE workspaces (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at bigint NOT NULL
);
CREATE TABLE projects (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  name text NOT NULL,
  brief text NOT NULL,
  created_at bigint NOT NULL,
  UNIQUE(id,workspace_id)
);
CREATE TABLE participants (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid,
  kind text NOT NULL CHECK(kind IN ('owner','agent')),
  name text NOT NULL,
  email text UNIQUE,
  created_at bigint NOT NULL,
  last_seen bigint NOT NULL,
  revoked_at bigint,
  CHECK(kind <> 'owner' OR project_id IS NULL),
  FOREIGN KEY(project_id,workspace_id) REFERENCES projects(id,workspace_id),
  UNIQUE(id,workspace_id)
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES participants(id),
  label text NOT NULL,
  expires_at bigint NOT NULL
);
CREATE TABLE invitations (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid,
  code_hash text NOT NULL,
  expires_at bigint NOT NULL,
  consumed_at bigint,
  FOREIGN KEY(project_id,workspace_id) REFERENCES projects(id,workspace_id)
);
CREATE TABLE notes (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL,
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  reference_links jsonb NOT NULL DEFAULT '[]',
  client_key uuid NOT NULL,
  created_at bigint NOT NULL,
  FOREIGN KEY(project_id,workspace_id) REFERENCES projects(id,workspace_id),
  FOREIGN KEY(author_id,workspace_id) REFERENCES participants(id,workspace_id),
  UNIQUE(author_id,client_key),
  UNIQUE(id,project_id,workspace_id)
);
CREATE TABLE requests (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL,
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  note_id uuid,
  result_note_id uuid,
  client_key uuid NOT NULL,
  created_at bigint NOT NULL,
  completed_at bigint,
  FOREIGN KEY(project_id,workspace_id) REFERENCES projects(id,workspace_id),
  FOREIGN KEY(author_id,workspace_id) REFERENCES participants(id,workspace_id),
  FOREIGN KEY(note_id,project_id,workspace_id) REFERENCES notes(id,project_id,workspace_id),
  FOREIGN KEY(result_note_id,project_id,workspace_id) REFERENCES notes(id,project_id,workspace_id),
  UNIQUE(author_id,client_key),
  UNIQUE(id,project_id,workspace_id)
);
CREATE TABLE recipients (
  request_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  acknowledged_at bigint,
  PRIMARY KEY(request_id,participant_id),
  FOREIGN KEY(request_id,project_id,workspace_id) REFERENCES requests(id,project_id,workspace_id),
  FOREIGN KEY(participant_id,workspace_id) REFERENCES participants(id,workspace_id)
);
CREATE TABLE reads (
  participant_id uuid NOT NULL REFERENCES participants(id),
  note_id uuid NOT NULL REFERENCES notes(id),
  read_at bigint NOT NULL,
  PRIMARY KEY(participant_id,note_id)
);
CREATE TABLE activity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id),
  author_id uuid NOT NULL REFERENCES participants(id),
  description text NOT NULL,
  resource_id uuid NOT NULL,
  created_at bigint NOT NULL
);
CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  resets_at bigint NOT NULL
);
CREATE INDEX notes_project ON notes(project_id,created_at DESC,id);
CREATE INDEX requests_project ON requests(project_id,created_at DESC,id);
CREATE INDEX recipients_participant ON recipients(participant_id,request_id);
CREATE INDEX participants_scope ON participants(workspace_id,project_id);
CREATE INDEX activity_project ON activity(project_id,id DESC);
CREATE INDEX sessions_participant ON sessions(participant_id);
