-- Set search_path explicitly on functions
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Lock down handle_new_user (only the trigger needs to call it)
revoke all on function public.handle_new_user() from public, anon, authenticated;