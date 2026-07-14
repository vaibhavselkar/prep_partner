# Instagram Auto-Posting — One-Time Setup Checklist

Goal: end up with **three values** the local poster needs — `IG_USER_ID`, a long-lived `IG_ACCESS_TOKEN`, and your App ID/Secret (for auto-refresh). Total time ~20–30 min. Everything here is the official, ToS-safe Instagram Graph API path.

> Keep the app in **Development mode** the whole time. For posting to *your own* account you do **not** need Meta App Review.

---

## Part A — Instagram account → Creator (3 min)

- [ ] A1. Create (or open) the Instagram account you'll post from.
- [ ] A2. In the Instagram app: **Settings and privacy → Account type and tools → Switch to professional account**.
- [ ] A3. Pick a category (e.g. "Education") → choose **Creator** (or Business; both work) → finish.

*Result:* the account is now API-eligible. It stays public and looks normal to followers.

---

## Part B — Facebook Page + link it (5 min)

The API requires the Instagram account to be linked to a Facebook Page.

- [ ] B1. Go to **https://www.facebook.com/pages/create** → create a Page (any name, e.g. "Marathi Notes AI"; any category). A throwaway Page is fine.
- [ ] B2. Go to **https://business.facebook.com** (Meta Business Suite). Top-left, select your new Page.
- [ ] B3. **Settings → Linked accounts → Instagram → Connect account** → log in to the Instagram account → confirm.

*Result:* Page ↔ Instagram are linked. Verify in Business Suite that the IG account shows as connected.

---

## Part C — Meta developer app (5 min)

- [ ] C1. Go to **https://developers.facebook.com** → log in with the **same Facebook account** that owns the Page → accept the developer terms if prompted.
- [ ] C2. **My Apps → Create App**.
- [ ] C3. Use case: choose **Other** → **Next** → app type **Business** → **Next**.
- [ ] C4. Name the app (e.g. "mpsc-meme-poster") → create. You may be asked to re-enter your password.
- [ ] C5. On the app dashboard, find **Add products** → add **Instagram** (the "Instagram Graph API" / "Instagram" product) → **Set up**.
- [ ] C6. Copy from **App settings → Basic**:
  - **App ID** → save as `META_APP_ID`
  - **App Secret** (click *Show*) → save as `META_APP_SECRET`

*Result:* you have an app with the Instagram product and your App ID + Secret.

---

## Part D — Permissions + tokens (10 min)

### D1. Generate a short-lived user token
- [ ] Open **https://developers.facebook.com/tools/explorer** (Graph API Explorer).
- [ ] Top-right **Meta App** dropdown → select your app.
- [ ] **Add permissions** (Permissions dropdown) — tick all of:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_show_list`
  - `pages_read_engagement`
  - `business_management`
- [ ] Click **Generate Access Token** → a Facebook dialog opens → **select your Page and Instagram account** → approve.
- [ ] Copy the token shown — this is your **short-lived** user token (valid ~1 hour). Call it `SHORT_TOKEN`.

### D2. Find your Page ID
- [ ] In the Explorer's query box, run: `me/accounts` → **Submit**.
- [ ] In the response, find your Page and copy its `id` → call it `PAGE_ID`.

### D3. Find your Instagram Business Account ID
- [ ] Run this query in the Explorer:
  `PAGE_ID?fields=instagram_business_account`
  (replace `PAGE_ID` with the real id)
- [ ] The response contains `"instagram_business_account": { "id": "17841400000000000" }`.
- [ ] Copy that inner `id` → this is your **`IG_USER_ID`**. ✅ (value #1)

### D4. Exchange for a long-lived token (60 days)
- [ ] Open this URL in your browser, filling in the three placeholders:

```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=META_APP_ID&client_secret=META_APP_SECRET&fb_exchange_token=SHORT_TOKEN
```

- [ ] The JSON response has `"access_token": "EAAG..."` → this is your **long-lived `IG_ACCESS_TOKEN`**. ✅ (value #2)

*(The poster will auto-refresh this before day 60 using your App ID/Secret — value #3.)*

---

## Part E — Hand off the values (safely)

Put the three values into a **local, gitignored** file rather than pasting the token in chat if you can:

- [ ] Create `prep_partner/.env.local` (already gitignored) with:

```
IG_USER_ID=17841400000000000
IG_ACCESS_TOKEN=EAAG...your-long-lived-token...
META_APP_ID=1234567890
META_APP_SECRET=abcd...
```

- [ ] Tell me it's ready, and I'll wire the local poster to read from it and do a single real test post.

> Security note: the access token is like a password to post as you. Don't commit it, don't share it publicly. If it ever leaks, regenerate it in the Graph API Explorer (which invalidates the old one).

---

## Quick reference — the 3 values the poster needs

| Value | Source | Example |
|---|---|---|
| `IG_USER_ID` | Part D3 | `17841400000000000` |
| `IG_ACCESS_TOKEN` | Part D4 (long-lived) | `EAAG...` |
| `META_APP_ID` + `META_APP_SECRET` | Part C6 (for auto-refresh) | `1234567890` / `abcd...` |

## Common gotchas
- **"instagram_business_account" is null** → the Page isn't linked to Instagram yet (redo Part B), or the IG account isn't Creator/Business (redo Part A).
- **Token expired after an hour** → you copied the short-lived token; do the Part D4 exchange to get the 60-day one.
- **Permission error on publish** → make sure `instagram_content_publish` was ticked in D1 and you're the account admin (dev mode is fine for your own account).
