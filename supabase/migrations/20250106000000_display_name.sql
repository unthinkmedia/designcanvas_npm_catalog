-- Add display_name column for friendly plugin names (from meta.name)
alter table packages add column display_name text;
