ALTER TABLE pages ADD COLUMN kind text NOT NULL DEFAULT 'page' CHECK (kind IN ('page','folder','collection'));
ALTER TABLE pages ADD COLUMN status text NOT NULL DEFAULT 'Idea' CHECK (status IN ('Idea','Drafting','Ready'));
CREATE TABLE page_comments (
 id uuid PRIMARY KEY,
 page_id uuid NOT NULL,
 project_id uuid NOT NULL,
 workspace_id uuid NOT NULL,
 author_id uuid NOT NULL,
 body text NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
 client_key uuid NOT NULL,
 created_at bigint NOT NULL,
 UNIQUE(author_id,client_key),
 FOREIGN KEY(page_id,project_id,workspace_id) REFERENCES pages(id,project_id,workspace_id) ON DELETE CASCADE,
 FOREIGN KEY(author_id,workspace_id) REFERENCES participants(id,workspace_id)
);
CREATE INDEX page_comments_page ON page_comments(page_id,created_at,id);
