-- Full-text search indexes for PostgreSQL
-- Run this migration manually: psql $DATABASE_URL -f prisma/migrations/add_search_indexes.sql

-- Plants full-text search index
CREATE INDEX IF NOT EXISTS plants_search_idx ON plants 
USING gin(to_tsvector('english', 
  COALESCE(name, '') || ' ' || 
  COALESCE(scientific_name, '') || ' ' || 
  COALESCE(description, '')
));

-- Forum posts full-text search index
CREATE INDEX IF NOT EXISTS forum_posts_search_idx ON forum_posts 
USING gin(to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(content, '')
));

-- Add comments for documentation
COMMENT ON INDEX plants_search_idx IS 'Full-text search index for plants (name, scientific_name, description)';
COMMENT ON INDEX forum_posts_search_idx IS 'Full-text search index for forum posts (title, content)';

