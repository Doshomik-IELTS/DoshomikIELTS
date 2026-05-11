# Referral Program Specification

## Overview

This document defines the referral program architecture for the IELTS++ platform. It enables existing users to share a unique referral ID and invite new users. Referred users receive free mock tests or other services as onboarding rewards, while referrers earn benefits. All rewards are managed from the admin dashboard.

---

## 1. Program Concepts

### 1.1 Core Flow

```
Existing User → Generates Referral ID → Shares Link/ID
                                                      ↓
                                           New User Signs Up with Referral
                                                      ↓
                                     Reward Credited to Both Accounts
                                     (On New User's First Purchase or Milestone)
```

### 1.2 Program Roles

| Role | Description |
|------|-------------|
| **Referrer** | Existing user sharing their referral ID |
| **Referee** | New user signing up using a referral ID |
| **Admin** | Manages rewards, limits, and program rules |

### 1.3 Reward Model

Rewards are **credit-based** and managed by admins:

| Component | Description |
|-----------|-------------|
| **Credit** | Internal currency unit; 1 credit = 1 mock test (or configurable) |
| **Referrer Reward** | Credits awarded to referrer on successful referral |
| **Referee Reward** | Credits awarded to new user on signup or first purchase |
| **Credit Ledger** | Tracks credit balance per user account |
| **Redemption** | Credits consumed when user takes a mock test or accesses a paid service |

---

## 2. Database Models

### 2.1 Referral Model

```prisma
model Referral {
  id          String         @id @default(uuid())
  referrerId  String         @unique  // One active referral code per user
  code        String         @unique  // The shareable referral ID (e.g., ABC123XY)
  status      ReferralStatus @default(active)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  referrer      Profile        @relation(fields: [referrerId], references: [id])
  redemptions   ReferralRedemption[]
}
```

### 2.2 ReferralRedemption Model

Tracks when a referral code is successfully used.

```prisma
model ReferralRedemption {
  id              String            @id @default(uuid())
  referralId      String
  refereeId       String            // The new user who used the code
  referrerReward  Int               @default(0)  // Credits given to referrer
  refereeReward   Int               @default(0)  // Credits given to referee
  status          RedemptionStatus  @default(pending)
  processedAt     DateTime?
  createdAt       DateTime          @default(now())

  referral        Referral          @relation(fields: [referralId], references: [id])
  referee         Profile           @relation(fields: [refereeId], references: [id])
}
```

### 2.3 CreditLedger Model

Tracks all credit transactions.

```prisma
model CreditLedger {
  id          String          @id @default(uuid())
  profileId   String
  amount      Int             // Positive = credit, Negative = debit
  type        CreditTxType
  description String
  refId      String?          // e.g. ReferralRedemption id, MockTestPurchase id
  createdAt   DateTime        @default(now())

  profile     Profile         @relation(fields: [profileId], references: [id])

  @@index([profileId])
}

enum CreditTxType {
  referral_bonus    // Reward from referral program
  redemption        // Mock test or service consumed
  admin_grant       // Manual credit grant by admin
  admin_revoke      // Manual credit revocation by admin
  refund            // Refund for unused redemption
  promo             // Promotional credit grant
}
```

### 2.4 ReferralConfig Model

Global referral program configuration (singleton).

```prisma
model ReferralConfig {
  id                 String   @id @default("singleton")
  referrerReward     Int      @default(1)   // Credits to referrer per successful referral
  refereeReward      Int      @default(1)   // Credits to referee on signup
  minPurchaseForReward Int? // If set, reward only given after referee spends X credits
  maxRedemptions     Int?      // Max number of times one referral code can be used (null = unlimited)
  rewardTrigger      RewardTrigger @default(on_signup) // on_signup or on_first_purchase
  enabled            Boolean  @default(true)
  updatedAt          DateTime @updatedAt
}

enum RewardTrigger {
  on_signup          // Reward credited immediately when referee signs up
  on_first_purchase  // Reward credited only when referee makes first paid purchase
}

enum ReferralStatus {
  active
  suspended
  deactivated
}

enum RedemptionStatus {
  pending            // Referral code applied but reward not yet credited
  completed          // Reward successfully credited
  cancelled          // Reward revoked (e.g., referee refunded/abuse)
}
```

---

## 3. Admin Dashboard Specification

### 3.1 Referral Management (`/admin/referrals`)

**Referral List:**

| Column | Sortable | Description |
|--------|----------|-------------|
| Referral Code | Yes | The shareable code |
| Referrer | Yes | User who owns the code |
| Total Redemptions | Yes | Number of successful uses |
| Referrer Earnings | Yes | Total credits earned by referrer |
| Referee Earnings | Yes | Total credits given to referees |
| Status | Yes | active/suspended/deactivated |
| Created | Yes | When code was created |

**Actions:**
- View redemption history per code
- Suspend / reactivate a referral code
- View individual referrer/referee details

### 3.2 Referral Configuration (`/admin/referrals/config`)

**Program Settings:**

| Field | Type | Description |
|-------|------|-------------|
| Referrer Reward | number | Credits earned per successful referral |
| Referee Reward | number | Credits given to new user on signup |
| Reward Trigger | select | `on_signup` or `on_first_purchase` |
| Min Purchase for Reward | number | (optional) Minimum spend to trigger reward |
| Max Redemptions per Code | number | (optional) Cap on code usage |
| Enable / Disable | toggle | Global program on/off switch |

### 3.3 Credit Ledger View (`/admin/referrals/credits`)

- Search by user email/name
- Filter by transaction type
- Filter by date range
- Columns: User, Type, Amount, Description, Reference, Date
- Manual credit grant / revoke action

### 3.4 Referral Analytics (`/admin/referrals/analytics`)

| Metric | Description |
|--------|-------------|
| Total Referrals | Number of referral codes generated |
| Total Redemptions | Number of successful referral signups |
| Conversion Rate | Redemptions / Codes generated |
| Total Credits Issued | Sum of all referral bonus credits |
| Top Referrers | Users with most successful referrals |
| Referral Funnel | Signups with code → Purchases made → Rewards triggered |

---

## 4. API Endpoints

### 4.1 User APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/referrals/me` | Get current user's referral code and stats |
| POST | `/api/referrals/generate` | Generate a new referral code (if none exists) |
| GET | `/api/referrals/me/redemptions` | List redemptions for user's referral code |
| GET | `/api/referrals/me/credits` | Get user's credit balance and ledger |
| POST | `/api/referrals/apply` | Apply a referral code during signup |

### 4.2 Learner APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credits` | Get credit balance |
| GET | `/api/credits/ledger` | Get transaction history |

### 4.3 Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/referrals` | List all referral codes with filters |
| GET | `/api/admin/referrals/config` | Get referral program configuration |
| PATCH | `/api/admin/referrals/config` | Update referral program configuration |
| GET | `/api/admin/referrals/:code` | Get single referral with redemptions |
| PATCH | `/api/admin/referrals/:code/status` | Suspend or reactivate a referral code |
| GET | `/api/admin/referrals/credits` | Get credit ledger with filters |
| POST | `/api/admin/referrals/credits/grant` | Manually grant credits to a user |
| POST | `/api/admin/referrals/credits/revoke` | Manually revoke credits from a user |
| GET | `/api/admin/referrals/analytics` | Get referral program analytics |

---

## 5. Referral Code Generation

### 5.1 Code Format

- **Length:** 8 characters (alphanumeric, uppercase)
- **Alphabet:** 24 consonants to avoid confusing characters (e.g., excluding I, O, 0, 1)
- **Example:** `IELTS2025ABC123XY`
- **Uniqueness:** Enforced at database level with unique constraint
- **Collision handling:** Generate a new code if collision occurs (retry up to 3 times)

### 5.2 Share URL Format

```
https://ieltsplusplus.com/signup?ref=IELTS2025XY
```

- Referral code passed as `ref` query parameter
- Signup flow detects `ref` and pre-fills / validates the referral code
- Code can also be shared as plain text for manual entry during signup

---

## 6. Reward Crediting Flow

### 6.1 Reward Trigger: On Signup (`on_signup`)

```
1. Referee completes registration with a valid referral code
2. System creates ReferralRedemption record with status = pending
3. CreditLedger entry created for referee (refereeReward credits)
4. CreditLedger entry created for referrer (referrerReward credits)
5. ReferralRedemption status updated to completed
```

### 6.2 Reward Trigger: On First Purchase (`on_first_purchase`)

```
1. Referee completes registration with a valid referral code
2. System creates ReferralRedemption record with status = pending
3. Referee must make a paid purchase (credit purchase or mock test buy)
4. On successful purchase: credits awarded to both parties
5. ReferralRedemption status updated to completed
```

### 6.3 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Same user applies own referral code | Rejected — self-referral not allowed |
| Invalid / expired / suspended code | Rejected with error message |
| Code already maxed out | Rejected — "This referral code has reached its limit" |
| Referral disabled globally | Rejected — "Referral program is currently inactive" |
| Referee already has a referrer | Rejected — each account can only be referred once |
| Race condition on redemption | Atomic transaction with database lock |

---

## 7. Credit Redemption Flow (Mock Test)

### 7.1 Purchase Decision

When a user starts a mock test or purchases a paid service:

```
1. User has credits available → deduct from ledger, proceed with test
2. User has zero credits → prompt to purchase credits or subscribe
3. ReferralConfig.minPurchaseForReward > 0 → check referee purchase history
```

### 7.2 Credit Deduction

```prisma
// On mock test start:
async function redeemCredit(profileId: string, testId: string) {
  const config = await getReferralConfig();
  const ledger = await getCreditBalance(profileId);

  if (ledger.balance < 1) {
    throw new Error('Insufficient credits');
  }

  await prisma.$transaction([
    prisma.creditLedger.create({
      data: {
        profileId,
        amount: -1,
        type: 'redemption',
        description: 'Mock test redemption',
        refId: testId,
      }
    }),
    // ... update test purchase record
  ]);
}
```

---

## 8. Frontend Screens

### 8.1 Referral Dashboard (`/account/referrals`)

**Referrer View:**
- Referral code display (copy button)
- Share buttons: copy link, WhatsApp, Twitter, Email
- Referral stats: total referrals, credits earned, credits redeemed
- Redemption history table
- "How it works" explanation section

### 8.2 Referral Code Input (Signup)

- During registration, optional field for referral code
- Real-time validation on input
- Error messages for invalid / expired / self-referral codes
- Success confirmation when valid code is applied
- (Optional) If no code entered, show "Do you have a referral code?" expandable

### 8.3 Credit Display

- Credit balance shown in account menu / profile page
- Credit history page listing all transactions
- Balance shown on mock test start confirmation modal

---

## 9. Implementation Phases

### Phase 1: Core Referral System

**Goals:**
- Referral code generation per user
- Signup with referral code application
- Basic reward crediting on signup
- Credit ledger and balance

**Deliverables:**
- `GET /api/referrals/me` — return code and stats
- `POST /api/referrals/generate` — create code if not exists
- `POST /api/referrals/apply` — apply code during signup
- Credit ledger tracking
- Basic admin referral list and config page
- Referral dashboard for users

### Phase 2: Advanced Features

**Goals:**
- `on_first_purchase` reward trigger
- Referral analytics dashboard
- Manual credit grant/revoke by admin
- Max redemption cap per code
- Referral code suspension

**Deliverables:**
- Reward trigger configuration
- Analytics page
- Credit management tools
- Code lifecycle management

### Phase 3: Gamification & Expansion

**Goals:**
- Referral tiers (bronze, silver, gold referrer)
- Tiered rewards (more referrals = more credits)
- Referral leaderboard
- Push notification reminders to share

**Deliverables:**
- Tier system with benefit unlocks
- Leaderboard component
- Share nudge notifications

---

## 10. Integration Points

### 10.1 Auth / Signup Flow

- Referral code check happens during Supabase Auth callback or in custom signup API
- Valid code stored in session and applied to profile creation

### 10.2 Mock Test Flow

- Before starting a paid test, check credit balance
- If balance >= 1, auto-redeem one credit
- If balance == 0, redirect to credit purchase

### 10.3 Content Management

- Referral page (program terms, FAQ) managed as a `Resource` under category `referral`
- See [Content Management](./content_management.md) § 1.1

---

## 11. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Self-referral abuse | Block same-profile referral code application |
| Code enumeration | Use long random codes, no predictable generation |
| Credit fraud | Admin audit log for all credit grants/revokes |
| Referral spam | Rate-limit code generation per user |
| IDOR | All admin endpoints verify admin role |
| Referral code scraping | Rotate inactive codes, monitor usage patterns |

---

## 12. Acceptance Criteria

| Feature | Criteria |
|---------|----------|
| Referral Code Generation | Each user gets a unique, shareable referral code |
| Referral Signup | New user can sign up with a referral code |
| Reward Crediting | Both referrer and referee receive configured credits |
| Credit Ledger | All credit transactions visible and queryable |
| Admin Config | Referrer/referee reward amounts configurable from admin |
| Reward Trigger | Admin can choose `on_signup` or `on_first_purchase` |
| Credit Redemption | Mock tests consume 1 credit from user balance |
| Referral Suspension | Admin can suspend individual referral codes |
| Referral Analytics | Admin can view program metrics |
| Self-Referral Block | Users cannot apply their own referral code |
| Max Redemption Cap | Codes can be capped at N uses |

---

## 13. Related Documentation

- [Content Management](./content_management.md)
- [Data Model Backend](../development/backend/data-model.md)
- [Admin UI Specification](../development/frontend/admin-ui.md)
- [API Specification](../development/backend/api-spec.md)
- [Security and Compliance](../development/backend/security-and-compliance.md)
