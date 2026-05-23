-- ─────────────────────────────────────────────────────────────────────────────
-- Finance Tracker — Supabase Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. EXPENSES
create table if not exists expenses (
  id         bigint primary key generated always as identity,
  name       text    not null,
  category   text    not null default 'Other',
  icon       text    not null default '📦',
  amount     numeric not null default 0,
  date       date    not null default current_date,
  time       text    not null default '12:00 PM',
  created_at timestamptz default now()
);

-- 2. LOANS
create table if not exists loans (
  id         bigint primary key generated always as identity,
  name       text    not null,
  type       text    not null default 'Personal',
  icon       text    not null default '💳',
  monthly    numeric not null default 0,
  total      numeric not null default 0,
  paid       numeric not null default 0,
  payoff     text    not null default '',
  months     integer not null default 0,
  color      text    not null default '#6366f1',
  due        boolean not null default false,
  created_at timestamptz default now()
);

-- 3. CHECKLIST
create table if not exists checklist (
  id         bigint primary key generated always as identity,
  name       text    not null,
  amount     numeric not null default 0,
  paid       boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- 4. EV SESSIONS
create table if not exists ev_sessions (
  id         bigint primary key generated always as identity,
  date       text    not null,
  kwh        numeric not null default 0,
  duration   text    not null default '—',
  type       text    not null default 'AC',
  created_at timestamptz default now()
);

-- 5. SETTINGS
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

-- 6. INCOME SOURCES
create table if not exists income_sources (
  id         bigint primary key generated always as identity,
  name       text    not null,
  amount     numeric not null default 0,
  icon       text    not null default '💼',
  color      text    not null default '#6366f1',
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- ─── Seed income sources ──────────────────────────────────────────────────────
insert into income_sources (name, amount, icon, color, sort_order) values
  ('Main Income', 6240, '💼', '#6366f1', 1),
  ('Locum',       0,    '🏥', '#22c55e', 2)
on conflict do nothing;

-- ─── Seed settings ────────────────────────────────────────────────────────────
insert into settings (key, value) values
  ('monthly_budget', '2400'),
  ('tnb_rate',       '0.571'),
  ('cutoff_day',     '17')
on conflict (key) do nothing;

-- ─── Seed sample loans ────────────────────────────────────────────────────────
insert into loans (name, type, icon, monthly, total, paid, payoff, months, color, due) values
  ('Car Loan',         'Car Loan',  '🚗', 850,  95000, 3,  'Dec 2034', 103, '#ef4444', true),
  ('Medical Card',     'Medical',   '🏥', 220,  18000, 17, 'May 2031', 60,  '#f97316', true),
  ('Personal Loan CC', 'Personal',  '💳', 480,  12000, 32, 'Oct 2029', 41,  '#eab308', true),
  ('PTPTN',            'Education', '🎓', 150,  22000, 55, 'Mar 2028', 22,  '#8b5cf6', false)
on conflict do nothing;

-- ─── Seed checklist ───────────────────────────────────────────────────────────
insert into checklist (name, amount, paid, sort_order) values
  ('Car Loan',         850,  true,  1),
  ('Medical Card',     220,  true,  2),
  ('Netflix',          18.9, true,  3),
  ('Spotify',          7.9,  true,  4),
  ('Personal Loan CC', 480,  false, 5),
  ('PTPTN',            150,  false, 6),
  ('Internet',         89,   false, 7),
  ('Phone Bill',       58,   false, 8),
  ('Gym',              99,   false, 9),
  ('EV Charging',      31,   false, 10),
  ('Insurance',        210,  false, 11)
on conflict do nothing;

-- ─── Seed EV sessions ─────────────────────────────────────────────────────────
insert into ev_sessions (date, kwh, duration, type) values
  ('26 Apr', 30.2, '3h 12m', 'DC'),
  ('21 Apr', 25.2, '2h 44m', 'AC')
on conflict do nothing;

-- ─── Seed expenses ────────────────────────────────────────────────────────────
insert into expenses (name, category, icon, amount, date, time) values
  ('Lunch',            'Food',      '🍽️', 12.50, '2026-05-21', '08:00 AM'),
  ('Petronas',         'Transport', '⛽',  80.00, '2026-05-21', '07:30 AM'),
  ('myNEWS',           'Groceries', '🛒',  24.90, '2026-05-19', '12:15 PM'),
  ('Grab',             'Transport', '🚕',  15.00, '2026-05-19', '06:45 PM'),
  ('Electricity Bill', 'Utilities', '⚡', 145.00, '2026-05-18', '09:00 AM')
on conflict do nothing;
