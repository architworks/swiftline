-- Initialize Swiftline Database Schema
-- Run this in the Supabase SQL Editor

-- Create a storage bucket for documents
insert into storage.buckets (id, name, public) 
values ('documents', 'documents', false) on conflict do nothing;

create policy "Users can upload their own documents" 
on storage.objects for insert 
to authenticated 
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own documents" 
on storage.objects for select 
to authenticated 
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own documents" 
on storage.objects for delete
to authenticated 
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Documents Table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  total_word_count integer not null default 0,
  storage_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.documents enable row level security;

create policy "Users can view own documents" 
on public.documents for select 
using (auth.uid() = user_id);

create policy "Users can insert own documents" 
on public.documents for insert 
with check (auth.uid() = user_id);

create policy "Users can update own documents" 
on public.documents for update 
using (auth.uid() = user_id);

create policy "Users can delete own documents" 
on public.documents for delete 
using (auth.uid() = user_id);

-- Document Contents Table (holds parsed data)
create table public.document_contents (
  id uuid primary key references public.documents on delete cascade,
  user_id uuid references auth.users not null default auth.uid(),
  content_array jsonb not null default '[]'::jsonb
);

alter table public.document_contents enable row level security;

create policy "Users can view own document contents" 
on public.document_contents for select 
using (auth.uid() = user_id);

create policy "Users can insert own document contents" 
on public.document_contents for insert 
with check (auth.uid() = user_id);

create policy "Users can update own document contents" 
on public.document_contents for update 
using (auth.uid() = user_id);

create policy "Users can delete own document contents" 
on public.document_contents for delete 
using (auth.uid() = user_id);

-- Reading Progress Table
create table public.reading_progress (
  document_id uuid primary key references public.documents on delete cascade,
  user_id uuid references auth.users not null default auth.uid(),
  current_word_index integer not null default 0,
  percent_complete double precision not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reading_progress enable row level security;

create policy "Users can view own reading progress" 
on public.reading_progress for select 
using (auth.uid() = user_id);

create policy "Users can insert own reading progress" 
on public.reading_progress for insert 
with check (auth.uid() = user_id);

create policy "Users can update own reading progress" 
on public.reading_progress for update 
using (auth.uid() = user_id);

-- Bookmarks Table
create table public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents on delete cascade not null,
  user_id uuid references auth.users not null default auth.uid(),
  word_index integer not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks" 
on public.bookmarks for select 
using (auth.uid() = user_id);

create policy "Users can insert own bookmarks" 
on public.bookmarks for insert 
with check (auth.uid() = user_id);

create policy "Users can update own bookmarks" 
on public.bookmarks for update 
using (auth.uid() = user_id);

create policy "Users can delete own bookmarks" 
on public.bookmarks for delete 
using (auth.uid() = user_id);

-- Function to automatically update 'updated_at' on documents
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_documents_updated_at
    before update on public.documents
    for each row
    execute function update_updated_at_column();

create trigger update_reading_progress_updated_at
    before update on public.reading_progress
    for each row
    execute function update_updated_at_column();
