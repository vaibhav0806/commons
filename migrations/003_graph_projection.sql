CREATE TABLE graph_sync (
  project_id uuid PRIMARY KEY REFERENCES projects(id),
  revision bigint NOT NULL DEFAULT 1,
  synced_revision bigint NOT NULL DEFAULT 0,
  synced_at timestamptz,
  last_error text
);
CREATE TABLE graph_entities (
  id bigint PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id),
  resource_id uuid NOT NULL,
  kind text NOT NULL CHECK(kind IN ('project','participant','note','request')),
  UNIQUE(project_id,kind,resource_id)
);
CREATE FUNCTION queue_graph_project() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO graph_sync(project_id) VALUES(NEW.project_id)
  ON CONFLICT(project_id) DO UPDATE SET revision=graph_sync.revision+1;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notes_graph AFTER INSERT OR UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION queue_graph_project();
CREATE TRIGGER requests_graph AFTER INSERT OR UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION queue_graph_project();
CREATE TRIGGER recipients_graph AFTER INSERT OR UPDATE ON recipients FOR EACH ROW EXECUTE FUNCTION queue_graph_project();
CREATE FUNCTION queue_graph_workspace() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO graph_sync(project_id) SELECT id FROM projects WHERE workspace_id=NEW.workspace_id
  ON CONFLICT(project_id) DO UPDATE SET revision=graph_sync.revision+1;
  RETURN NEW;
END;
$$;
CREATE TRIGGER projects_graph AFTER INSERT OR UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION queue_graph_workspace();
CREATE TRIGGER participants_graph AFTER INSERT OR UPDATE OF name,revoked_at,project_id ON participants FOR EACH ROW EXECUTE FUNCTION queue_graph_workspace();
INSERT INTO graph_sync(project_id) SELECT id FROM projects;
