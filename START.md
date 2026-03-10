# Quick start (fix "Cannot reach API" + duplicate key error)

## Run from project root
```bash
cd ~/Downloads/intellicare-resource-allocation-5
```

## 1. Start backend + frontend together
```bash
npm run dev:full
```
(This runs from the root folder – it starts both API and frontend.)

## 2. Or run in two terminals
**Terminal 1 – backend:**
```bash
cd ~/Downloads/intellicare-resource-allocation-5/server
npm run dev
```
Wait for "Server running on port 5001".

**Terminal 2 – frontend:**
```bash
cd ~/Downloads/intellicare-resource-allocation-5
npm run dev
```

## 3. First-time setup
```bash
cd ~/Downloads/intellicare-resource-allocation-5
cp server/.env.example server/.env
# Edit server/.env: set MONGO_URI and JWT_SECRET
cd server && npm install
cd .. && npm install
```

## If server crashed (duplicate key / app crashed)
Stop with Ctrl+C, then start again:
```bash
cd ~/Downloads/intellicare-resource-allocation-5/server
npm run dev
```
The startup script now fixes the email index so patient registration works.
