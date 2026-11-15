CREATE TABLE project_files (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  project_id uuid NOT NULL,
  author_id uuid NOT NULL,
  name text NOT NULL,
  mime_type text NOT NULL,
  size integer NOT NULL CHECK(size >= 0 AND size <= 16777216),
  checksum text NOT NULL,
  object_key text UNIQUE NOT NULL,
  ready boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL,
  UNIQUE(id,project_id,workspace_id),
  FOREIGN KEY(project_id,workspace_id) REFERENCES projects(id,workspace_id) ON DELETE CASCADE,
  FOREIGN KEY(author_id,workspace_id) REFERENCES participants(id,workspace_id)
);
CREATE INDEX project_files_project ON project_files(project_id,created_at DESC,id);
CREATE TABLE file_cleanup (object_key text PRIMARY KEY, queued_at timestamptz NOT NULL DEFAULT now());
CREATE FUNCTION queue_file_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO file_cleanup(object_key) VALUES(OLD.object_key) ON CONFLICT DO NOTHING;
  RETURN OLD;
END $$;
CREATE TRIGGER project_file_cleanup AFTER DELETE ON project_files FOR EACH ROW EXECUTE FUNCTION queue_file_cleanup();
