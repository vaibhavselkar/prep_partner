# Instagram Auto-Posting — One-Time Setup (Instagram-only, no Facebook Page)

Goal: end up with **three values** the local poster needs — `IG_USER_ID`, a long-lived `IG_ACCESS_TOKEN`, and your App ID/Secret (for auto-refresh). Total time ~15–20 min.

This uses **"Instagram API with Instagram Login"** — the modern path that authenticates directly against the Instagram account. **No Facebook Page and no Facebook login required.** All API calls use `graph.instagram.com`.

> You still need a Meta developer *app* (the API is Meta's) — but nothing on the Facebook side. Keep the app in **Development mode**; posting to your own account needs no App Review.

---

## Part A — Instagram account → Professional (Creator/Business) (3 min)

- [ ] A1. Create (or open) the Instagram account you'll post from.
- [ ] A2. Instagram app → **Settings and privacy → Account type and tools → Switch to professional account**.
- [ ] A3. Pick a category (e.g. "Education") → choose **Creator** (or Business) → finish.

*Result:* the account is API-eligible. Stays public, looks normal to followers.

---

## Part B — Meta developer app with the Instagram product (5 min)

- [ ] B1. Go to **https://developers.facebook.com** → log in → accept developer terms if prompted.
- [ ] B2. **My Apps → Create App**.
- [ ] B3. App name (e.g. "mpsc-meme-poster") → for use case, pick the one offering **Instagram** (or choose **Other → Business**) → create.
- [ ] B4. On the dashboard: **Add product → Instagram → Set up**, and choose **"API setup with Instagram login"** (NOT "with Facebook login").
- [ ] B5. From **App settings → Basic**, copy:
  - **App ID** → `META_APP_ID`  *(value #3a)*
  - **App Secret** (click *Show*) → `META_APP_SECRET`  *(value #3b)*

---

## Part C — Connect the Instagram account + get a token (7 min)

All of this is inside **Instagram → API setup with Instagram login** on your app dashboard.

- [ ] C1. Under **"1. Generate access tokens"** (or "Add account"), click **Add account** → an Instagram login opens → log into your professional account → **Authorize**.
- [ ] C2. When authorizing, make sure these scopes are granted:
  - `instagram_business_basic`
  - `instagram_business_content_publish`
- [ ] C3. Click **Generate token** for that account → copy it. This is a **short-lived** Instagram user token (~1 hour). Call it `SHORT_TOKEN`.

### C4. Get your Instagram user ID
- [ ] Open this URL in a browser (paste your `SHORT_TOKEN`):

```
https://graph.instagram.com/me?fields=user_id,username&access_token=SHORT_TOKEN
```

- [ ] The response has `"user_id": "17841400000000000"` → that's your **`IG_USER_ID`**. ✅ (value #1)

### C5. Exchange for a long-lived token (60 days)
- [ ] Open this URL (fill `META_APP_SECRET` and `SHORT_TOKEN`):

```
https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=META_APP_SECRET&access_token=SHORT_TOKEN
```

- [ ] The response has `"access_token": "IGAA..."` → that's your long-lived **`IG_ACCESS_TOKEN`**. ✅ (value #2)

*(Refreshing later is one call: `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=IG_ACCESS_TOKEN`. The poster does this automatically before day 60.)*

---

## Part D — Hand off the values (safely)

- [ ] Put them in `prep_partner/.env.local` (gitignored — never commit):

```
IG_USER_ID=17841400000000000
IG_ACCESS_TOKEN=IGAA...your-long-lived-token...
META_APP_ID=1234567890
META_APP_SECRET=abcd...
```

- [ ] Tell me it's ready — I'll wire the local poster and do one real test post.

> Security: the token can post as you. Keep it in `.env.local`, don't share publicly. If it leaks, regenerate (invalidates the old one).

---

## How the poster will publish (for reference)

Instagram content publishing is always **2 calls**, and the image must be at a **public URL** (Instagram fetches it — a local file path won't work):

```
1) POST https://graph.instagram.com/v21.0/{IG_USER_ID}/media
      ?image_url=<public-png-url>&caption=<text>&access_token=<token>
   -> returns { "id": "<creation_id>" }

2) POST https://graph.instagram.com/v21.0/{IG_USER_ID}/media_publish
      ?creation_id=<creation_id>&access_token=<token>
   -> returns the published media id
```

For the public URL in a local setup: push the approved PNG to a public GitHub repo (use its `raw.githubusercontent.com` link), or a free image host, or a quick tunnel. We'll pick one when wiring the poster.

---

## Quick reference — the 3 values

| Value | Source | Example |
|---|---|---|
| `IG_USER_ID` | Part C4 (`/me?fields=user_id`) | `17841400000000000` |
| `IG_ACCESS_TOKEN` | Part C5 (long-lived) | `IGAA...` |
| `META_APP_ID` + `META_APP_SECRET` | Part B5 | `1234567890` / `abcd...` |

## Common gotchas
- **Can't find "API setup with Instagram login"** → make sure you added the **Instagram** product (not "Facebook Login"); pick the Instagram-login option, not the Facebook-login one.
- **Token expired in an hour** → you kept the short-lived token; do the Part C5 exchange for the 60-day one.
- **Publish fails with a permission error** → `instagram_business_content_publish` wasn't granted in C2; remove and re-add the account, re-authorizing that scope.
- **Account not eligible** → it must be **Creator/Business** (Part A), not a plain personal account.
