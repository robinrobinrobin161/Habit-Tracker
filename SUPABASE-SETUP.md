# Set up your habit tracker's storage

Supabase saves your habits and handles your login. You do not need to install anything to set up the database. The Supabase dashboard account and the login inside your tracker are two separate accounts.

## Step 1 — Create the project

1. Open [Supabase](https://supabase.com/dashboard) and sign in or create an account.
2. If your screen says **Create an organization**, click **New organization**, name it **Personal**, and choose the **Free** plan. An organization is a container for your projects. Once it is created, click **New project** inside it.
3. Name your project **Habit Tracker**.
4. Generate a strong **database password** and save it in your password manager. This is not the password you will use to log in to the tracker.
5. Choose a European region, preferably Frankfurt if available.
6. Create the project and wait for it to finish preparing.

## Step 2 — Create the storage tables

1. In the project sidebar, open **SQL Editor** and create a new query.
2. Open the file [supabase/schema.sql](supabase/schema.sql) in this project.
3. Copy the entire file and paste it into the SQL Editor.
4. Click **Run**. A successful result may say “Success. No rows returned.” This is normal: you created tables, rather than searched for data.
5. Open **Table Editor**. You should see `habits`, `completions`, and `reminder_deliveries`.

Run this file only once. If you already see those tables, do not run it again. If an error appears, copy the error text into our chat; do not delete existing tables to retry.

## Step 3 — Create your tracker login

1. Open **Authentication → Users**.
2. Use **Add user → Create new user** (the label may be shortened to Create user).
3. Enter `robin04102003@gmail.com` and choose a new password for the tracker. Save it privately.
4. Enable **Auto Confirm User**, if shown, and create the user.
5. Open that user's details and copy the **User UID / ID**. This long identifier goes into the GitHub secret `OWNER_USER_ID` later. It is not a password.
6. In Authentication settings, find **Allow new users to sign up** and switch it off. The exact section can vary; look under Sign In / Providers or User Signups. Your existing user can still sign in.

Your email remains your login name even though reminders are now Telegram messages. You do not need Gmail sending settings.

## Step 4 — Find the connection details

Use the project's **Connect** dialog to find the project URL and publishable key. Keys are also available under **Settings → API Keys**.

| What to find | What it looks like | Where it will go in GitHub |
| --- | --- | --- |
| Project URL | `https://...supabase.co` | Variable `VITE_SUPABASE_URL` and secret `SUPABASE_URL` |
| Publishable key | `sb_publishable_...` | Variable `VITE_SUPABASE_ANON_KEY` |
| Secret key | `sb_secret_...` | Secret `SUPABASE_SECRET_KEY` |
| Your user's UID from Step 3 | A long ID with hyphens | Secret `OWNER_USER_ID` |

The frontend variable still contains the word ANON for compatibility; paste the modern publishable key there. Do not confuse the publishable key with the secret key. The secret key belongs only in GitHub Actions secrets, never in browser settings, source files, or chat.

You do not need a database connection string or your database password to connect this app.

## Step 5 — Connect the website

Once your GitHub repository exists:

1. Open its **Settings → Secrets and variables → Actions**.
2. On the **Variables** tab, use **New repository variable** for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. On the **Secrets** tab, use **New repository secret** for `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `OWNER_USER_ID`.
4. Follow the remaining GitHub Pages and Telegram steps in [README.md](README.md).
5. Once you know the Pages address, put it in Supabase under **Authentication → URL Configuration → Site URL**. Include the repository path and trailing slash.

For local use, the same two public values go in `.env.local` using `.env.example` as the template. Restart the app after changing them.

## Step 6 — Check that it works

Open the deployed tracker and log in using the email and tracker password from Step 3. Add a habit, check off a past day, and reload the page. The habit and completed day should still be there. Open the app on your phone and sign in to see the same data.

If the app only offers “Explore the preview,” its public connection settings have not been added to the build. Set both GitHub variables and rerun the Pages deployment.

If login works but saving fails, check that Step 2 completed and the user email is exactly the one above. Share the error text for help.

Official references: [Supabase database and SQL Editor](https://supabase.com/docs/guides/database/overview), [user management](https://supabase.com/docs/guides/auth/managing-user-data), and [API keys](https://supabase.com/docs/guides/getting-started/api-keys).
