-- Replace generic categories with Design Canvas plugin categories

-- Remove old categories (cascade will nullify package references)
delete from categories;

-- Insert new Design Canvas categories
insert into categories (name, slug, description) values
  ('AI Feedback', 'ai-feedback', 'Get LLM-powered design reviews, layout suggestions, and automated critiques'),
  ('Visual Editing', 'visual-editing', 'Tweak styles, tokens, and layout directly on the canvas'),
  ('Inspection', 'inspection', 'Inspect elements, spacing, box model, and computed styles'),
  ('Annotation', 'annotation', 'Mark up designs, leave comments, and sync feedback to issues'),
  ('Testing & QA', 'testing-qa', 'Run accessibility audits, visual regression checks, and project validations'),
  ('Theming', 'theming', 'Switch themes, compare token sets, and manage design tokens'),
  ('Spec & Handoff', 'spec-handoff', 'Extract specs, generate docs, and bridge designs to code'),
  ('Deploy', 'deploy', 'Ship prototypes and apps to staging and production'),
  ('CLI Control', 'cli-control', 'Scaffold, build, and manage plugins from the command line');
