CREATE TRIGGER pages_graph AFTER INSERT OR UPDATE OR DELETE ON pages FOR EACH ROW EXECUTE FUNCTION queue_graph_project();
CREATE TRIGGER files_graph AFTER INSERT OR UPDATE OR DELETE ON project_files FOR EACH ROW EXECUTE FUNCTION queue_graph_project();
UPDATE graph_sync SET revision=revision+1;
