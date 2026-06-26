# Task 8: Profile Page — /profile

## What to build

Upgrade `src/app/(portal)/profile/page.tsx` from a read-only stub to a functional profile page with live user data, system summary, editable fields, and password change form.

## Design system
Same as previous tasks — dark OLED, glass cards, Unbounded font, Framer Motion, GlassCard, COLORS tokens.

## Data sourcing

```typescript
portalApi.getProfile()
// → { first_name, last_name, email, phone, subscription_plan, avatar_url }

portalApi.getSite(user.site_id)
// → { capacity_kw, inverter_capacity_kw, battery_kwh: 0 (nullable), install_date, site_name }

portalApi.updateProfile(data)
// PUT — body: { first_name, last_name, phone }
```

Auth: username/email from `useAuth().user`

## What to display

### 1. Account Card (GlassCard glow="green")
- **Avatar** — circular div with initials fallback: `first_name[0] + last_name[0]` in large Unbounded font, emerald background. If `avatar_url` is present, show as `<img>`.
- **Name:** `{first_name} {last_name}` (Unbounded h2)
- **Email:** `{email}` muted
- **Plan badge:** `{subscription_plan}` as StatusPill — "Pro Plan" → `status="active"`, others muted

### 2. System Summary (GlassCard — read-only)
Header: "Your System"
4 info rows:
- Solar Capacity: `{capacity_kw} kWp`
- Inverter: `{inverter_capacity_kw} kW`
- Battery: `{battery_kwh} kWh` (show "N/A" if 0 or null)
- Installed: formatted date from `install_date`

Each row: label (muted, small) + value (white, JetBrains Mono)

### 3. Edit Profile (GlassCard)
Header: "Edit Profile" + Save button (right-aligned, disabled until changed)

Editable fields:
- First Name (text input)
- Last Name (text input)
- Phone (text input, tel type)

On Save click: calls `portalApi.updateProfile({ first_name, last_name, phone })`, shows success state (brief "Saved ✓" message fades in, then fades out after 2s). Handle errors (show "Failed to save" in red).

Input styling: `bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50`

### 4. Change Password (GlassCard)
Header: "Change Password"

Fields:
- Current Password
- New Password
- Confirm New Password

On Submit: validate that New == Confirm, then POST to `/api/auth/change-password/` via `api` (direct axios call, not portalApi — this endpoint isn't in portalApi).

Show error if passwords don't match (client-side). Show success/failure from API.

Password input: same styling as edit fields above, `type="password"`.

## Mock data
```typescript
const MOCK_PROFILE = { first_name: "John", last_name: "Doe", email: "john@example.com", phone: "+91 98765 43210", subscription_plan: "Pro Plan", avatar_url: null };
const MOCK_SITE = { capacity_kw: 6.5, inverter_capacity_kw: 5.0, battery_kwh: 6.1, install_date: "2023-01-15", site_name: "Coimbatore Home" };
```

## Constraints
- Single file: `src/app/(portal)/profile/page.tsx` only
- No new components or dependencies
- `npm run build` must pass
- Edit form tracks dirty state (Save button disabled if no changes)
- Password change validates client-side (New == Confirm) before API call
