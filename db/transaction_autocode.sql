create or replace function public.generate_transaction_code()
returns trigger
language plpgsql
as $$
declare
  last_code text;
  code_match text[];
  code_prefix text;
  code_number integer;
  code_suffix text;
begin
  if new.transaction_code is not null and btrim(new.transaction_code) <> '' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('public.transactions.transaction_code'));

  select t.transaction_code
    into last_code
  from public.transactions t
  where t.transaction_code is not null
  order by t.transaction_date desc, t.transaction_id desc
  limit 1;

  if last_code is null then
    new.transaction_code := 'TXN-001';
    return new;
  end if;

  code_match := regexp_match(last_code, '^(.*?)(\d+)([^\d]*)$');

  if code_match is null then
    new.transaction_code := last_code || '-001';
    return new;
  end if;

  code_prefix := code_match[1];
  code_number := code_match[2]::integer + 1;
  code_suffix := code_match[3];

  new.transaction_code := code_prefix || lpad(code_number::text, length(code_match[2]), '0') || code_suffix;
  return new;
end;
$$;

drop trigger if exists set_transaction_code on public.transactions;

create trigger set_transaction_code
before insert on public.transactions
for each row
execute function public.generate_transaction_code();