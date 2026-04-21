# Meta App Setup Guide

Step-by-step instructions for creating the Meta developer app required to use the Meta Ads Bulk Uploader.

> ⚠️ **The #1 mistake people make:** leaving the app in Development mode. **The app MUST be published (Live mode) to create ads.** Development mode will silently fail or throw permission errors even with a valid token.

---

## Prerequisites

- A Facebook account
- A [Meta Business Manager](https://business.facebook.com) (free)
- Your ad account and Facebook page already created in Business Manager

---

## Step 1 — Create the app

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in
2. Click **My Apps → Create App**
3. For the use case, select **"Other"** (not Games, Commerce, etc.)
4. App type: select **"Business"**
5. Fill in app name (e.g. "Jess Trading Ads Uploader") and contact email
6. Click **Create app**

---

## Step 2 — Connect to Business Manager

1. Inside the app dashboard, go to **Settings → Basic**
2. Scroll down to **Business Manager** and click **Select Business Manager**
3. Choose your Business Manager account
4. Click **Save changes**

---

## Step 3 — Add the Ads use case

1. From your app dashboard, click **Add use case** (or **Add product** if you don't see it)
2. Find **"Marketing API"** or the section that includes **"Create and manage ads"**
3. Click **Set up**

This adds the Marketing API permissions to your app.

---

## Step 4 — Create a System User token

System User tokens don't expire (unlike regular User tokens), making them ideal for automation.

1. Go to [Business Manager](https://business.facebook.com) → **Settings → Users → System Users**
2. Click **Add** → name it (e.g. "Ads Uploader Bot") → role: **Admin**
3. After creating the user, click **Generate New Token**
4. Select your app from the dropdown
5. Grant these permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `pages_show_list`
6. Click **Generate Token** and **copy it immediately** — it won't be shown again

> **Tip:** Keep the token in a password manager. It doesn't expire but you can revoke and regenerate it anytime.

---

## Step 5 — Add a Privacy Policy URL

Meta requires a Privacy Policy URL before you can publish the app.

1. Go to **Settings → Basic** in your app dashboard
2. Fill in **Privacy Policy URL** — a Google Doc set to "Anyone with the link can view" works fine
3. Fill in **Terms of Service URL** (same Google Doc is fine)
4. Click **Save changes**

---

## Step 6 — Publish the app (CRITICAL)

By default, apps are in **Development mode** — only users listed as developers/testers can use them, and **creating ads is blocked**.

To publish:

1. In the app dashboard, find the toggle at the top that says **"Development"**
2. Click it to switch to **"Live"**
3. A dialog will ask you to confirm — click **Switch to Live Mode**

Once Live, your System User token can create campaigns, creatives, and ads on any ad account connected to your Business Manager.

---

## Step 7 — Paste your token into the app

1. Open the Content App in your browser
2. Go to **Meta Ads → Settings** (or click the settings icon from the Meta Ads tool)
3. Paste the System User token in the **Access Token** field
4. Click **Save token** — the app will automatically fetch your ad accounts and pages
5. Select your **Ad Account** and **Facebook Page**
6. Click **Save selections**

You're ready to upload ads.

---

## Troubleshooting

| Error | Likely cause | Fix |
|---|---|---|
| `(#200) The user hasn't authorized the application to perform this action` | App is in Development mode | Publish the app (Step 6) |
| `Invalid OAuth access token` | Token is wrong or revoked | Regenerate in Business Manager → System Users |
| `Ad account not found` | System User not added to ad account | Add the System User as admin on the ad account in Business Manager |
| `Page not authorized` | Page not connected to Business Manager | Go to Business Manager → Accounts → Pages and add the page |
| Empty accounts dropdown | Token doesn't have `business_management` permission | Regenerate token with all required permissions |

---

## Required permissions summary

| Permission | Why it's needed |
|---|---|
| `ads_management` | Create and manage ad campaigns, ad sets, and ads |
| `ads_read` | Read campaigns and ad sets to populate dropdowns |
| `business_management` | Access Business Manager resources |
| `pages_show_list` | List Facebook pages for creative publishing |
