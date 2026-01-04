create or replace function public.set_sales_locale(new_locale text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_locale is null then
    return;
  end if;

  update public.sales
  set locale = new_locale
  where user_id = auth.uid();
end;
$$;

grant execute on function public.set_sales_locale(text) to authenticated;
