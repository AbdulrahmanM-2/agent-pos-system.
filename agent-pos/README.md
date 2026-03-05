# Agent POS System

A full-featured Point of Sale system for Tanzanian agents supporting:
- 📱 Airtime Recharge (Vodacom, Tigo, Airtel, Halotel)
- 💳 Mobile Money (M-Pesa, Tigo Pesa, Airtel Money)
- 🏦 Banking Services (Deposit / Withdraw)

## Deploy on Railway

1. Push this repo to GitHub
2. Create a new project on [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Railway auto-detects Vite — deploy happens automatically

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm run start   # preview production build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your API keys when integrating real payment providers.

## Tech Stack

- React 18 + Vite 5
- Context API for global state
- CSS-in-JS (inline styles) — zero extra dependencies
- DM Sans (Google Fonts)
