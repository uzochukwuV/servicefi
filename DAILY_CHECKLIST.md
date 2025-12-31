# ServiceFi - Daily Checklist

Quick reference for daily execution. Check off as you complete each task.

---

## 📅 DAY 1: Foundation & Deployment

### Morning Session
- [ ] Fix Turbopack build errors in next.config.ts
- [ ] Verify `npm run dev` works
- [ ] Verify `npm run build` succeeds
- [ ] Get WalletConnect Project ID
- [ ] Create frontend/.env.local
- [ ] Create contracts/.env

### Afternoon Session
- [ ] Fund testnet wallet with Mantle Sepolia ETH
- [ ] Deploy contracts: `forge script scripts/Deploy.s.sol --rpc-url mantle_testnet --broadcast`
- [ ] Verify contracts on explorer
- [ ] Update frontend/lib/contracts/addresses.ts
- [ ] Test wallet connection

**End of Day Goal:** ✅ Working testnet deployment

---

## 📅 DAY 2: Core User Flows

### Morning Session
- [ ] Build business registration form
- [ ] Build service creation modal
- [ ] Test provider registration on testnet
- [ ] Create 2-3 test services

### Afternoon Session
- [ ] Build marketplace page with service grid
- [ ] Build purchase modal
- [ ] Test customer purchase flow
- [ ] Build LP deposit form
- [ ] Test LP flow

**End of Day Goal:** ✅ All 3 user roles functional

---

## 📅 DAY 3: Redemption System

### Morning Session
- [ ] Install qrcode package
- [ ] Build QR code generator component
- [ ] Add "Request Redemption" to My Credits

### Afternoon Session
- [ ] Build verifier dashboard page
- [ ] Add approve/reject buttons
- [ ] Implement event listening
- [ ] Test full redemption flow

**End of Day Goal:** ✅ Complete redemption flow

---

## 📅 DAY 4: Analytics & Polish

### Morning Session
- [ ] Build analytics charts (Recharts)
- [ ] Add TVL, services, redemption rate charts
- [ ] Build transaction history component
- [ ] Add to all dashboards

### Afternoon Session
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Form validation with Zod
- [ ] Mobile responsive fixes
- [ ] Network switching warnings

**End of Day Goal:** ✅ Polished UX

---

## 📅 DAY 5: Testing & Documentation

### Morning Session
- [ ] Create 3 test wallets
- [ ] Test provider flow end-to-end
- [ ] Test customer flow end-to-end
- [ ] Test LP flow end-to-end
- [ ] Fix critical bugs

### Afternoon Session
- [ ] Update README.md
- [ ] Create USER_GUIDE.md with screenshots
- [ ] Update PROJECT_SUMMARY.md
- [ ] Remove console.logs
- [ ] Run linter

**End of Day Goal:** ✅ Production-ready code

---

## 📅 DAY 6: Demo & Submission

### Morning Session
- [ ] Write demo script
- [ ] Record screen + voiceover (5 min)
- [ ] Edit video with captions
- [ ] Upload to YouTube/Loom

### Afternoon Session
- [ ] Create pitch deck (8-10 slides)
- [ ] Export as PDF
- [ ] Deploy to Vercel
- [ ] Submit to hackathon
- [ ] Tweet announcement

**End of Day Goal:** ✅ Submitted!

---

## Quick Commands Reference

### Contracts
```bash
cd E:\apps\servicefi\contracts

# Test
npx hardhat test

# Deploy to testnet
forge script scripts/Deploy.s.sol --rpc-url mantle_testnet --broadcast --verify

# Local test
npx hardhat node
```

### Frontend
```bash
cd E:\apps\servicefi\frontend

# Dev mode
npm run dev

# Build
npm run build

# Deploy to Vercel
vercel --prod
```

### Git
```bash
git add .
git commit -m "feat: [description]"
git push origin main
```

---

## Emergency Contacts

- **Mantle Faucet:** https://faucet.mantle.xyz
- **WalletConnect Cloud:** https://cloud.walletconnect.com
- **Mantle Explorer:** https://explorer.sepolia.mantle.xyz
- **Hackathon Support:** [Discord/Telegram]

---

## Daily Time Allocation

- **Morning:** 4 hours (9am - 1pm)
- **Afternoon:** 4 hours (2pm - 6pm)
- **Total:** 8 hours/day × 6 days = 48 hours

**Stay focused. Ship fast. Win hackathon!** 🚀
