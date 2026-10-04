FinanceFlow Dynamic V6 — Supabase Cloud
=========================================

What changed
------------
- Starts EMPTY: no demo accounts, transactions, budgets, goals, categories or areas.
- Uses your Supabase project for permanent financial data.
- Email/password login is required.
- Data syncs across devices when you sign in with the same account.
- Responsive layout for desktop, tablet and mobile.
- Keeps the V5 Dashboard, Accounts, Income, Expenses, Transfers, Budget, Goals,
  Subscriptions, Analysis, Reports, Categories, Areas and Settings features.
- Add / Edit / Duplicate / Delete operations sync to Supabase.
- Currency and theme are device preferences stored locally; financial records are cloud data.

Project structure
-----------------
index.html
css/style.css
js/data.js
js/supabase.js
js/database.js
js/auth.js
js/calculations.js
js/ui.js
js/app.js

How to run
----------
Option A (recommended): host the folder with GitHub Pages.
Option B: use VS Code Live Server locally.
Option C: opening index.html directly may work, but a local web server is more reliable.

Login
-----
Use the email/password user already created in Supabase Authentication > Users.

Security
--------
This frontend contains only the Supabase PROJECT URL and PUBLISHABLE key.
Never put a Supabase secret key or service_role key in this project.
The database schema uses Row Level Security (RLS) so authenticated users can access only their own rows.

First-time setup inside the app
-------------------------------
Because the database is blank, a sensible order is:
1. Areas (optional)
2. Categories (at least one Income and one Expense category)
3. Accounts
4. Income / Expenses / Transfers
5. Budget / Goals / Subscriptions

FinanceFlow will block transactions that cannot be created safely yet, e.g. no account or no matching category.
