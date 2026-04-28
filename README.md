# 🌿 EcoTrack Backend

Full Node.js/Express backend for the EcoTrack civic-tech platform.

## Project Structure

```
ecotrack-backend/
├── server.js                    # Entry point, Express + Socket.io setup + cron jobs
├── config/
│   ├── db.js                    # MongoDB connection
│   └── cloudinary.js            # Cloudinary + Multer setup
├── models/
│   ├── User.js                  # Users with roles, stats, notifications
│   ├── Ward.js                  # Ward with sustainability score + authority email
│   ├── Issue.js                 # Environmental complaints
│   ├── VoteVerification.js      # Upvotes + resident verifications
│   └── Event.js                 # Community events with funding
├── routes/
│   ├── auth.js                  # Register, login, profile
│   ├── issues.js                # CRUD, upvote, verify, escalate
│   ├── events.js                # CRUD, join, fund, updates
│   ├── wards.js                 # Ward data + sustainability scores
│   ├── leaderboard.js           # Global + ward leaderboards
│   ├── impactWall.js            # Before/after resolved issues
│   ├── profile.js               # User profile + history
│   └── notifications.js         # In-app notifications
├── controllers/
│   ├── authController.js        # Auth logic
│   └── issueController.js       # Issue logic (complex, separated)
├── services/
│   ├── aiService.js             # Anthropic: image triage + email generation
│   ├── urgencyService.js        # Urgency score formula + cron recalculator
│   ├── wardScoreService.js      # Ward sustainability score cron
│   ├── geocodingService.js      # Nominatim reverse geocoding → ward lookup
│   └── emailService.js          # Nodemailer: escalation + notification emails
├── middleware/
│   └── auth.js                  # JWT protect, optionalAuth, requireRole
├── sockets/
│   └── index.js                 # Socket.io room management
├── .env.example                 # All env vars documented
└── package.json
```

## Setup

### 1. Clone and install
```bash
cd ecotrack-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values in .env (see .env.example for instructions)
```

### 3. Run in development
```bash
npm run dev
```

### 4. Run in production
```bash
npm start
```

---

## Keys You Need

| Key | Where to get it | Free? |
|-----|----------------|-------|
| `MONGODB_URI` | [cloud.mongodb.com](https://cloud.mongodb.com) → Create cluster → Connect | ✅ M0 free |
| `ANTHROPIC_API_KEY` | [console.anthropic.com/keys](https://console.anthropic.com/keys) | Pay per use |
| `CLOUDINARY_*` | [cloudinary.com](https://cloudinary.com) Dashboard | ✅ Free tier |
| `SMTP_*` | Gmail → 2FA → App Passwords | ✅ Free |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` | N/A |

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register with optional lat/lng |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update name/avatar |

### Issues
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/issues` | optional | Feed (filter: category, status, ward, urgencyLevel, lat/lng) |
| POST | `/api/issues` | ✅ | Create issue with image → AI triage |
| GET | `/api/issues/:id` | optional | Single issue |
| POST | `/api/issues/:id/upvote` | ✅ | Toggle upvote |
| POST | `/api/issues/:id/verify` | ✅ resident | Verify or dispute |
| POST | `/api/issues/:id/after-image` | ✅ reporter | Upload after image |
| PUT | `/api/issues/:id/moderate` | ✅ mod | Resolve/reject/flag |
| POST | `/api/issues/:id/escalate` | ✅ mod | Send authority email |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | optional | List events with geo filter |
| POST | `/api/events` | ✅ | Create event |
| GET | `/api/events/:id` | optional | Single event |
| POST | `/api/events/:id/join` | ✅ | Join/leave |
| POST | `/api/events/:id/fund` | ✅ | Fund an event |
| POST | `/api/events/:id/update` | ✅ organizer | Post update |

### Other
| Endpoint | Description |
|----------|-------------|
| `GET /api/wards` | All wards with sustainability scores |
| `GET /api/leaderboard` | User + ward leaderboard |
| `GET /api/impact-wall` | Resolved issues with before/after |
| `GET /api/profile/:userId` | User profile + history |
| `GET /api/notifications` | My notifications |

---

## Socket.io Events

### Client → Server (join rooms)
```js
socket.emit('join:issue', issueId)
socket.emit('join:event', eventId)
socket.emit('join:ward', wardName)
socket.emit('join:user', userId)   // for personal notifications
socket.emit('join:ward:mods', wardName)
```

### Server → Client (emitted events)
```js
// Issues
'issue:new'        → { issueId, wardName }
'issue:upvote'     → { issueId, upvoteCount, urgencyScore, urgencyLevel }
'issue:verify'     → { issueId, verificationCount, disputeCount, urgencyScore }
'issue:escalated'  → { issueId, wardName }
'issue:resolved'   → { issueId, title, message }  // to reporter only

// Events
'event:new'        → { eventId, wardName }
'event:participants' → { eventId, participantCount }
'event:funding'    → { eventId, fundsRaised, fundingGoalReached }
'event:funded'     → { eventId, title, message }  // to organizer only

// Mod alerts
'mod:review-needed' → { issueId, reason }
```

---

## Urgency Score Formula

```
Urgency = (Upvotes × W1) + (Verifications × W2) + (AgeDays × W3)

Default weights: W1=1, W2=3, W3=0.5

Levels:
  0–20   → Low
  21–50  → Medium   (orange map marker)
  51–100 → High     (mod notified)
  100+   → Critical (auto-escalation prompt)
```

Recalculated every 3 hours via cron.

---

## Ward Sustainability Score

```
Raw = (Events × 10) + (IssuesFiled × 2) + (IssuesResolved × 15) + (FundsRaised ÷ 100)
Normalized to 0–100 across all wards.
```

Recalculated every 6 hours via cron. Powers the map color overlay.
