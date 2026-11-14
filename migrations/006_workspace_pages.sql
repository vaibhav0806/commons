CREATE TABLE pages (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  project_id uuid NOT NULL,
  author_id uuid NOT NULL,
  parent_id uuid,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  client_key uuid NOT NULL,
  created_at bigint NOT NULL,
  edited_at bigint,
  UNIQUE(id,project_id,workspace_id),
  UNIQUE(author_id,client_key),
  FOREIGN KEY(project_id,workspace_id) REFERENCES projects(id,workspace_id) ON DELETE CASCADE,
  FOREIGN KEY(author_id,workspace_id) REFERENCES participants(id,workspace_id),
  FOREIGN KEY(parent_id,project_id,workspace_id) REFERENCES pages(id,project_id,workspace_id) ON DELETE SET NULL (parent_id)
);
CREATE INDEX pages_project ON pages(project_id,created_at DESC,id);
CREATE INDEX pages_parent ON pages(parent_id);
