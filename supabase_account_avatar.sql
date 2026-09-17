-- US - We Spent / We Saved
-- Run this AFTER your existing schema SQL.

-- Store the shared account picture URL.
alter table public.accounts
add column if not exists avatar_url text;

-- Create a public bucket so the account picture can be displayed by the app.
insert into storage.buckets (id, name, public)
values ('account-avatars', 'account-avatars', true)
on conflict (id) do update set public = true;

-- Storage security: each signed-in account owner can manage only
-- the folder whose name is their own account UUID.

drop policy if exists "account avatar upload" on storage.objects;
create policy "account avatar upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'account-avatars'
  and (storage.foldername(name))[1] = (
    select a.id::text
    from public.accounts a
    where a.owner_user_id = auth.uid()
  )
);


drop policy if exists "account avatar update" on storage.objects;
create policy "account avatar update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'account-avatars'
  and (storage.foldername(name))[1] = (
    select a.id::text
    from public.accounts a
    where a.owner_user_id = auth.uid()
  )
)
with check (
  bucket_id = 'account-avatars'
  and (storage.foldername(name))[1] = (
    select a.id::text
    from public.accounts a
    where a.owner_user_id = auth.uid()
  )
);


drop policy if exists "account avatar delete" on storage.objects;
create policy "account avatar delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'account-avatars'
  and (storage.foldername(name))[1] = (
    select a.id::text
    from public.accounts a
    where a.owner_user_id = auth.uid()
  )
);

-- Verify the column exists.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'accounts'
  and column_name = 'avatar_url';
