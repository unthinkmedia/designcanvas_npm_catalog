-- Create a SECURITY DEFINER function to update package metrics.
-- This bypasses RLS so any caller (including anon) can refresh version/download data.
create or replace function update_package_metrics(
  p_id uuid,
  p_latest_version text,
  p_last_published_at timestamptz,
  p_weekly_downloads bigint,
  p_metrics_updated_at timestamptz
) returns void as $$
begin
  update packages set
    latest_version = p_latest_version,
    last_published_at = p_last_published_at,
    weekly_downloads = p_weekly_downloads,
    metrics_updated_at = p_metrics_updated_at
  where id = p_id;
end;
$$ language plpgsql security definer;

-- Allow anon and authenticated to call it
grant execute on function update_package_metrics to anon, authenticated;
