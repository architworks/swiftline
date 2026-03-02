-- Add the chapters column to the document_contents table.
-- It will store an array of { title: string, word_index: number }
ALTER TABLE document_contents
ADD COLUMN chapters JSONB DEFAULT '[]'::jsonb;
