CREATE TABLE graph_notes (
  id bigint PRIMARY KEY,
  note_id uuid NOT NULL UNIQUE REFERENCES notes(id)
);
