ALTER TABLE projects ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE notes ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE notes ADD COLUMN edited_at bigint;
ALTER TABLE participants ADD COLUMN removed_at bigint;
ALTER TABLE sessions ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE sessions ADD COLUMN created_at bigint NOT NULL DEFAULT (extract(epoch FROM now()) * 1000)::bigint;
ALTER TABLE graph_sync DROP CONSTRAINT graph_sync_project_id_fkey;
ALTER TABLE graph_entities DROP CONSTRAINT graph_entities_project_id_fkey;
DROP TABLE graph_notes;
DELETE FROM activity WHERE resource_id IN (SELECT id FROM requests);
DROP TABLE recipients;
DROP TABLE requests;
ALTER TABLE graph_entities DROP CONSTRAINT graph_entities_kind_check;

CREATE OR REPLACE FUNCTION queue_graph_project() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE project uuid;
BEGIN
  project := CASE WHEN TG_OP='DELETE' THEN OLD.project_id ELSE NEW.project_id END;
  INSERT INTO graph_sync(project_id) VALUES(project)
  ON CONFLICT(project_id) DO UPDATE SET revision=graph_sync.revision+1;
  RETURN NULL;
END;
$$;
DROP TRIGGER notes_graph ON notes;
CREATE TRIGGER notes_graph AFTER INSERT OR UPDATE OR DELETE ON notes FOR EACH ROW EXECUTE FUNCTION queue_graph_project();
CREATE FUNCTION queue_deleted_project() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO graph_sync(project_id) VALUES(OLD.id)
  ON CONFLICT(project_id) DO UPDATE SET revision=graph_sync.revision+1;
  RETURN NULL;
END;
$$;
CREATE TRIGGER project_deleted_graph AFTER DELETE ON projects FOR EACH ROW EXECUTE FUNCTION queue_deleted_project();
UPDATE graph_sync SET revision=revision+1;
