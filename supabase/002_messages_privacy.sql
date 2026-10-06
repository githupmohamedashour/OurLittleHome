drop policy if exists "read" on public.messages;
create policy "read own or addressed" on public.messages for select to authenticated
  using (public.is_member() and (to_user = auth.uid() or created_by = auth.uid()));
