create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  mobile text not null unique,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender text not null,
  monthly_income numeric(14, 2) not null default 0 check (monthly_income >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.additional_incomes (
  id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  income_month text not null check (income_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.expenses (
  id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  item text not null check (length(trim(item)) > 0),
  category text not null check (category in ('Home & bills', 'Food & dining', 'Transport', 'Everything else')),
  amount numeric(14, 2) not null check (amount > 0),
  spent_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.monthly_transactions (
  id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('vehicle', 'rent')),
  name text not null check (length(trim(name)) > 0),
  amount numeric(14, 2) not null check (amount > 0),
  transacted_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.borrowings (
  id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount numeric(14, 2) not null check (amount > 0),
  monthly_payment numeric(14, 2) not null default 0 check (monthly_payment >= 0),
  start_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.borrowing_payments (
  id text not null,
  user_id uuid not null,
  borrowing_id text not null,
  amount numeric(14, 2) not null check (amount > 0),
  paid_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, borrowing_id)
    references public.borrowings (user_id, id) on delete cascade
);

create table public.investment_plans (
  id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('LIC', 'SIP', 'Savings')),
  contribution_amount numeric(14, 2) not null check (contribution_amount > 0),
  frequency text not null check (frequency in ('Monthly', 'Quarterly', 'Yearly', 'Not specified')),
  start_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.plan_contributions (
  id text not null,
  user_id uuid not null,
  plan_id text not null,
  amount numeric(14, 2) not null check (amount > 0),
  contributed_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, plan_id)
    references public.investment_plans (user_id, id) on delete cascade
);

create index additional_incomes_user_month_idx on public.additional_incomes (user_id, income_month);
create index expenses_user_date_idx on public.expenses (user_id, spent_on desc);
create index monthly_transactions_user_category_date_idx on public.monthly_transactions (user_id, category, transacted_on desc);
create index borrowings_user_idx on public.borrowings (user_id);
create index borrowing_payments_user_date_idx on public.borrowing_payments (user_id, paid_on desc);
create index investment_plans_user_category_idx on public.investment_plans (user_id, category);
create index plan_contributions_user_date_idx on public.plan_contributions (user_id, contributed_on desc);

alter table public.profiles enable row level security;
alter table public.additional_incomes enable row level security;
alter table public.expenses enable row level security;
alter table public.monthly_transactions enable row level security;
alter table public.borrowings enable row level security;
alter table public.borrowing_payments enable row level security;
alter table public.investment_plans enable row level security;
alter table public.plan_contributions enable row level security;

create policy "Users manage their own profile"
  on public.profiles for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users manage their own additional incomes"
  on public.additional_incomes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own expenses"
  on public.expenses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own monthly transactions"
  on public.monthly_transactions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own borrowings"
  on public.borrowings for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own borrowing payments"
  on public.borrowing_payments for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own investment plans"
  on public.investment_plans for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own plan contributions"
  on public.plan_contributions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on
  public.profiles,
  public.additional_incomes,
  public.expenses,
  public.monthly_transactions,
  public.borrowings,
  public.borrowing_payments,
  public.investment_plans,
  public.plan_contributions
to authenticated;

create function public.get_dashboard_data()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'expenses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'item', e.item,
        'category', e.category,
        'amount', e.amount,
        'date', to_char(e.spent_on, 'YYYY-MM-DD')
      ) order by e.spent_on desc, e.created_at desc)
      from public.expenses e
    ), '[]'::jsonb),
    'vehicleTransactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'amount', t.amount,
        'date', to_char(t.transacted_on, 'YYYY-MM-DD')
      ) order by t.transacted_on desc, t.created_at desc)
      from public.monthly_transactions t
      where t.category = 'vehicle'
    ), '[]'::jsonb),
    'rentTransactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'amount', t.amount,
        'date', to_char(t.transacted_on, 'YYYY-MM-DD')
      ) order by t.transacted_on desc, t.created_at desc)
      from public.monthly_transactions t
      where t.category = 'rent'
    ), '[]'::jsonb),
    'borrowings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'amount', b.amount,
        'monthlyPayment', b.monthly_payment,
        'startDate', to_char(b.start_date, 'YYYY-MM-DD'),
        'payments', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', p.id,
            'amount', p.amount,
            'date', to_char(p.paid_on, 'YYYY-MM-DD')
          ) order by p.paid_on desc, p.created_at desc)
          from public.borrowing_payments p
          where p.user_id = b.user_id and p.borrowing_id = b.id
        ), '[]'::jsonb)
      ) order by b.created_at desc)
      from public.borrowings b
    ), '[]'::jsonb),
    'investmentPlans', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'category', p.category,
        'contributionAmount', p.contribution_amount,
        'frequency', p.frequency,
        'startDate', to_char(p.start_date, 'YYYY-MM-DD'),
        'contributions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', c.id,
            'amount', c.amount,
            'date', to_char(c.contributed_on, 'YYYY-MM-DD')
          ) order by c.contributed_on desc, c.created_at desc)
          from public.plan_contributions c
          where c.user_id = p.user_id and c.plan_id = p.id
        ), '[]'::jsonb)
      ) order by p.created_at desc)
      from public.investment_plans p
    ), '[]'::jsonb)
  );
$$;

create function public.save_dashboard_data(p_data jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to save dashboard data.';
  end if;

  delete from public.additional_incomes where user_id = current_user_id;
  delete from public.expenses where user_id = current_user_id;
  delete from public.monthly_transactions where user_id = current_user_id;
  delete from public.borrowing_payments where user_id = current_user_id;
  delete from public.plan_contributions where user_id = current_user_id;
  delete from public.borrowings where user_id = current_user_id;
  delete from public.investment_plans where user_id = current_user_id;

  insert into public.expenses (id, user_id, item, category, amount, spent_on)
  select entry ->> 'id', current_user_id, entry ->> 'item', entry ->> 'category',
    (entry ->> 'amount')::numeric, (entry ->> 'date')::date
  from jsonb_array_elements(coalesce(p_data -> 'expenses', '[]'::jsonb)) as records(entry);

  insert into public.monthly_transactions (id, user_id, category, name, amount, transacted_on)
  select entry ->> 'id', current_user_id, 'vehicle', entry ->> 'name',
    (entry ->> 'amount')::numeric, (entry ->> 'date')::date
  from jsonb_array_elements(coalesce(p_data -> 'vehicleTransactions', '[]'::jsonb)) as records(entry);

  insert into public.monthly_transactions (id, user_id, category, name, amount, transacted_on)
  select entry ->> 'id', current_user_id, 'rent', entry ->> 'name',
    (entry ->> 'amount')::numeric, (entry ->> 'date')::date
  from jsonb_array_elements(coalesce(p_data -> 'rentTransactions', '[]'::jsonb)) as records(entry);

  insert into public.borrowings (id, user_id, name, amount, monthly_payment, start_date)
  select entry ->> 'id', current_user_id, entry ->> 'name', (entry ->> 'amount')::numeric,
    (entry ->> 'monthlyPayment')::numeric, (entry ->> 'startDate')::date
  from jsonb_array_elements(coalesce(p_data -> 'borrowings', '[]'::jsonb)) as records(entry);

  insert into public.borrowing_payments (id, user_id, borrowing_id, amount, paid_on)
  select payment ->> 'id', current_user_id, borrowing ->> 'id',
    (payment ->> 'amount')::numeric, (payment ->> 'date')::date
  from jsonb_array_elements(coalesce(p_data -> 'borrowings', '[]'::jsonb)) as borrowings(borrowing)
  cross join lateral jsonb_array_elements(coalesce(borrowing -> 'payments', '[]'::jsonb)) as payments(payment);

  insert into public.investment_plans (id, user_id, name, category, contribution_amount, frequency, start_date)
  select entry ->> 'id', current_user_id, entry ->> 'name', entry ->> 'category',
    (entry ->> 'contributionAmount')::numeric, entry ->> 'frequency', (entry ->> 'startDate')::date
  from jsonb_array_elements(coalesce(p_data -> 'investmentPlans', '[]'::jsonb)) as records(entry);

  insert into public.plan_contributions (id, user_id, plan_id, amount, contributed_on)
  select contribution ->> 'id', current_user_id, plan ->> 'id',
    (contribution ->> 'amount')::numeric, (contribution ->> 'date')::date
  from jsonb_array_elements(coalesce(p_data -> 'investmentPlans', '[]'::jsonb)) as plans(plan)
  cross join lateral jsonb_array_elements(coalesce(plan -> 'contributions', '[]'::jsonb)) as contributions(contribution);
end;
$$;

revoke all on function public.get_dashboard_data() from public, anon;
revoke all on function public.save_dashboard_data(jsonb) from public, anon;
grant execute on function public.get_dashboard_data() to authenticated;
grant execute on function public.save_dashboard_data(jsonb) to authenticated;