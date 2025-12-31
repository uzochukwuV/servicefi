# ServiceFi - 6-Day Implementation Plan

**Project:** ServiceFi - DeFi Protocol for Tokenized Prepaid Service Credits
**Hackathon:** Mantle RealFi Hackathon 2025
**Timeline:** 6 days remaining
**Last Updated:** December 25, 2024

---

## Current Status Analysis

### ✅ COMPLETED (100%)

#### Smart Contracts
- ✅ ServiceCreditToken.sol (ERC1155 multi-token)
- ✅ LiquidityPool.sol (LP positions, yield distribution)
- ✅ RedemptionOracle.sol (verification network)
- ✅ ServiceFactory.sol (one-click deployment)
- ✅ **15/15 tests passing** (256 fuzz runs per test)
- ✅ Gas optimized: 101k gas for minting (target <150k)
- ✅ Deploy script ready (Deploy.s.sol)

#### Frontend Structure
- ✅ Next.js 16 app with React 19
- ✅ Wagmi v3 + Viem Web3 integration
- ✅ 5 custom hooks implemented:
  - useServiceCredit.ts
  - useLiquidityPool.ts
  - useRedemptionOracle.ts
  - useBusinessRegistration.ts
  - useCustomer.ts
- ✅ Page structure created (business, customer, investor, marketplace)
- ✅ Shadcn UI components installed
- ⚠️ **Build errors** (Turbopack issues with thread-stream module)
- ⚠️ Testnet contracts deployed but addresses need verification

### ⏳ PENDING (Critical for Demo)

1. **Contract Deployment** (NOT on testnet yet, old addresses in code)
2. **Frontend Build Issues** (40 Turbopack errors)
3. **Missing Pages/Features:**
   - QR code scanner for redemptions
   - Transaction history
   - Analytics dashboard
   - Real-time event listening
   - Provider onboarding flow
   - Verifier dashboard
4. **Backend** (empty directory)
5. **Environment Configuration**
   - No .env files in frontend
   - WalletConnect Project ID needed
6. **Demo Materials**
   - Demo video
   - User flow documentation
   - Pitch deck

---

## 6-Day Sprint Plan

### **DAY 1: Foundation & Deployment** (Critical Priority)

**Goal:** Fix critical issues and deploy to testnet

#### Morning (4 hours)
- [ ] **Fix Frontend Build**
  - Resolve Turbopack errors (thread-stream issue)
  - Configure next.config.ts to exclude problematic modules
  - Verify `npm run dev` and `npm run build` both work
  - **Deliverable:** Clean build with no errors

- [ ] **Environment Setup**
  - Get WalletConnect Project ID from https://cloud.walletconnect.com
  - Create `frontend/.env.local` with:
    - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
    - `NEXT_PUBLIC_MANTLE_TESTNET_RPC`
  - Create `contracts/.env` with:
    - `PRIVATE_KEY` (testnet wallet)
    - `MANTLE_RPC_URL`
  - **Deliverable:** Working environment configuration

#### Afternoon (4 hours)
- [ ] **Smart Contract Deployment**
  - Fund testnet wallet with Mantle Sepolia ETH (faucet)
  - Run deployment script: `forge script scripts/Deploy.s.sol --rpc-url mantle_testnet --broadcast`
  - Save deployment addresses from `./deployments/mantle.env`
  - Verify contracts on Mantle Sepolia explorer
  - **Deliverable:** Live contracts on testnet with verified source code

- [ ] **Update Frontend Addresses**
  - Update `frontend/lib/contracts/addresses.ts` with new addresses
  - Test wallet connection in dev mode
  - Verify contract reads work (chain connection)
  - **Deliverable:** Frontend connected to deployed contracts

**End of Day 1:** Working testnet deployment + functional frontend dev environment

---

### **DAY 2: Core User Flows** (MVP Priority)

**Goal:** Implement and test the 3 core user flows end-to-end

#### Morning (4 hours)
- [ ] **Business Dashboard Flow**
  - Complete `app/business/page.tsx`:
    - Provider registration form
    - Service creation modal (price, expiry, max supply, type)
    - Active services list with stats
    - Revenue dashboard (total earned, active credits)
  - Test transactions:
    - Register as provider
    - Create 2-3 test services
  - **Deliverable:** Working business onboarding flow

#### Afternoon (4 hours)
- [ ] **Customer Marketplace Flow**
  - Complete `app/marketplace/page.tsx`:
    - Service discovery (filter by type, price)
    - Service detail cards (provider, price, expiry, supply)
    - Purchase modal with balance display
    - My credits page showing owned credits
  - Test transactions:
    - Purchase credits from marketplace
    - View balance
  - **Deliverable:** Working customer purchase flow

- [ ] **Investor LP Flow**
  - Complete `app/investor/page.tsx`:
    - LP deposit form (amount, lock period)
    - Active positions table
    - Yield calculation display
    - Withdraw button (after lock)
  - Test transactions:
    - Add liquidity (small amount)
    - View position
  - **Deliverable:** Working LP deposit flow

**End of Day 2:** All 3 core user roles can complete their primary actions

---

### **DAY 3: Redemption System** (Critical Feature)

**Goal:** Build the redemption flow (the unique value prop)

#### Morning (3 hours)
- [ ] **QR Code Generation**
  - Install `qrcode` package: `npm install qrcode @types/qrcode`
  - Create `components/redemption-qr.tsx`:
    - Generate QR with redemption data (tokenId, amount, requestId)
    - Display QR code modal for customers
    - Copy request ID button
  - Add "Request Redemption" button to My Credits page
  - **Deliverable:** Customers can generate redemption QR codes

#### Afternoon (5 hours)
- [ ] **Verifier Dashboard** (New Page)
  - Create `app/admin/verifier/page.tsx`:
    - Pending requests table (listen to `VerificationRequested` events)
    - Request details (service, customer, proof hash)
    - Approve/Reject buttons
    - Batch verify functionality
  - Hook up `useRedemptionOracle.verifyRedemption()`
  - **Deliverable:** Verifiers can approve/reject redemptions

- [ ] **Real-time Event Listening**
  - Add Wagmi event watchers in hooks:
    - `ServiceCreated` → update service list
    - `VerificationRequested` → update verifier dashboard
    - `ServiceRedeemed` → update customer credits
  - Add toast notifications for events
  - **Deliverable:** Real-time UI updates without refresh

**End of Day 3:** Complete redemption flow from customer → verifier → on-chain

---

### **DAY 4: Analytics & Polish** (UX Priority)

**Goal:** Add transparency and improve UX

#### Morning (4 hours)
- [ ] **Analytics Dashboard**
  - Create `components/analytics-charts.tsx` using Recharts:
    - Total Value Locked (TVL) over time
    - Services created by category (pie chart)
    - Redemption rate (redeemed vs active)
    - Provider rankings (top services)
  - Add to homepage and business dashboard
  - **Deliverable:** Visual insights for all users

- [ ] **Transaction History**
  - Create `components/transaction-history.tsx`:
    - Listen to contract events
    - Store in local state/React Query cache
    - Display in table (type, amount, status, time, tx hash)
    - Filter by transaction type
  - Add to all role-specific dashboards
  - **Deliverable:** Users can see their transaction history

#### Afternoon (4 hours)
- [ ] **UI/UX Polish**
  - Loading states for all transactions (skeleton screens)
  - Error handling with user-friendly messages
  - Form validation (Zod schemas)
  - Success confirmations with confetti/toast
  - Mobile responsive design fixes
  - **Deliverable:** Professional, polished UI

- [ ] **Network Switching**
  - Add network mismatch warning
  - Auto-prompt to switch to Mantle Sepolia
  - Display warning banner if on wrong network
  - **Deliverable:** Smooth network handling

**End of Day 4:** Feature-complete app with great UX

---

### **DAY 5: Testing & Documentation** (Quality Assurance)

**Goal:** Comprehensive testing and documentation

#### Morning (4 hours)
- [ ] **End-to-End Testing**
  - Create test wallets (3 accounts: provider, customer, LP)
  - Fund with testnet MNT
  - Complete full user journeys:
    1. Provider: Register → Create Service → Get Paid
    2. Customer: Browse → Purchase → Request Redemption
    3. Verifier: Review → Approve → Burn
    4. LP: Deposit → Wait (mock) → View Yield
  - Document any bugs in `TESTING_LOG.md`
  - Fix critical bugs
  - **Deliverable:** Bug-free user flows

#### Afternoon (4 hours)
- [ ] **Documentation**
  - Update `README.md` with:
    - Quick start guide
    - Environment setup
    - Contract addresses
    - Feature list
  - Create `USER_GUIDE.md`:
    - How to use as Business
    - How to use as Customer
    - How to use as LP
    - Screenshots of each flow
  - Update `PROJECT_SUMMARY.md` with final status
  - **Deliverable:** Complete documentation

- [ ] **Code Quality**
  - Remove console.logs
  - Add comments to complex functions
  - Run `npm run lint` and fix warnings
  - Check for hardcoded values → move to config
  - **Deliverable:** Clean, maintainable code

**End of Day 5:** Production-ready codebase with documentation

---

### **DAY 6: Demo & Submission** (Launch Day)

**Goal:** Create demo materials and submit

#### Morning (3 hours)
- [ ] **Demo Video Recording**
  - Script outline:
    1. Problem statement (0:30)
    2. Solution overview (0:30)
    3. Business flow demo (1:00)
    4. Customer flow demo (1:00)
    5. LP flow demo (0:30)
    6. Technical highlights (0:30)
    7. Roadmap (0:30)
  - Record screen + voiceover (5 min max)
  - Edit with captions
  - Export and upload (YouTube/Loom)
  - **Deliverable:** Professional demo video

#### Afternoon (3 hours)
- [ ] **Pitch Deck**
  - Create 8-10 slide deck:
    1. Title (ServiceFi logo, tagline)
    2. Problem (cash flow for service businesses)
    3. Solution (tokenized credits)
    4. How it Works (3 user flows)
    5. Technology (Mantle, gas optimization)
    6. Market Opportunity (TAM/SAM)
    7. Traction (testnet stats)
    8. Roadmap
  - Use Canva/Google Slides
  - Export as PDF
  - **Deliverable:** Investor-ready pitch deck

#### Evening (2 hours)
- [ ] **Final Submission**
  - Deploy frontend to Vercel:
    - `cd frontend && vercel --prod`
    - Set env vars in Vercel dashboard
  - Update GitHub repo:
    - Clean commit history
    - Update README with live demo link
    - Add LICENSE
  - Submit to hackathon:
    - Deployed app URL
    - Demo video link
    - GitHub repo
    - Contract addresses
  - **Deliverable:** Submitted project

- [ ] **Social Media**
  - Tweet demo video with #MantleRealFi
  - Post on LinkedIn
  - Share in Mantle Discord
  - **Deliverable:** Public launch

**End of Day 6:** Project submitted and live!

---

## Risk Mitigation

### Critical Risks
1. **Frontend Build Fails**
   - Mitigation: Day 1 priority, downgrade Next.js if needed
   - Fallback: Use Vite + React instead

2. **Testnet Deployment Issues**
   - Mitigation: Test on local Anvil first
   - Fallback: Use Hardhat node + fork Mantle

3. **Time Overruns**
   - Mitigation: Cut analytics dashboard if needed
   - Focus on core flows over polish

### Nice-to-Have (Cut if Time Runs Out)
- [ ] Advanced analytics
- [ ] Batch operations UI
- [ ] Mobile app
- [ ] Backend API

---

## Success Criteria (Minimum Viable Demo)

By end of Day 6, must have:

1. ✅ **Deployed Smart Contracts** (Mantle Sepolia Testnet)
2. ✅ **Live Frontend** (Vercel deployment)
3. ✅ **3 Core Flows Working:**
   - Provider can create services
   - Customer can purchase credits
   - LP can add liquidity
4. ✅ **Redemption System** (QR code + verifier approval)
5. ✅ **Demo Video** (5 min, shows all flows)
6. ✅ **Documentation** (README, user guide)

---

## Daily Standup Format

Each day, answer:
1. What did I complete yesterday?
2. What will I complete today?
3. Any blockers?

Log progress in `PROGRESS_LOG.md`

---

## Resources Needed

### External Services
- [ ] WalletConnect Project ID (free, 5 min signup)
- [ ] Mantle Sepolia Testnet faucet
- [ ] Vercel account (free tier)
- [ ] YouTube/Loom for video hosting

### Tools
- Metamask with Mantle Sepolia testnet added
- Foundry (for contract deployment)
- Screen recording software (OBS/Loom)
- Slide deck tool (Canva/Google Slides)

---

## Post-Hackathon Roadmap

### Short Term (Week 1-2)
- External security audit
- Bug bounty program
- Mainnet deployment

### Medium Term (Month 1-3)
- Mobile app (React Native)
- Backend API for verifiers
- Multi-chain expansion

### Long Term (Month 6+)
- Governance token launch
- DAO structure
- zkProof redemptions for privacy

---

## Contact & Support

- **Project Lead:** [Your Name]
- **GitHub:** https://github.com/[username]/servicefi
- **Discord:** [Your Discord]
- **Email:** [Your Email]

---

**Last Updated:** December 25, 2024
**Status:** Ready to Execute
**Confidence Level:** High (contracts done, clear path to MVP)
