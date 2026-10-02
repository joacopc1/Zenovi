-- Límites de uso por persona o workspace (cuántos pedidos por ventana de tiempo), además
-- de los créditos: los créditos frenan el gasto del mes, esto frena las ráfagas y el abuso.
-- Sólo el servidor (service_role) cuenta; nadie desde el navegador lee ni toca la tabla.
create table if not exists public.rate_limit_counters (
  key text not null check (char_length(key) <= 200),
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

alter table public.rate_limit_counters enable row level security;
revoke all on public.rate_limit_counters from anon, authenticated;
grant select, insert, update, delete on public.rate_limit_counters to service_role;

-- Suma un pedido a la ventana actual y dice si todavía entra en el límite. Es atómico:
-- dos pedidos simultáneos no pueden pasar los dos por el último lugar libre.
create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limit_counters as counters (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = counters.hits + 1
  returning counters.hits into v_hits;

  -- Las ventanas viejas no sirven para nada: de vez en cuando se barren.
  if random() < 0.01 then
    delete from public.rate_limit_counters where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
