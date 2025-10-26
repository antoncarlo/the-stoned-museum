# The Stoned Museum - Roadmap Completa

Documento dettagliato di tutte le feature da implementare e miglioramenti da apportare al progetto.

---

## 🐛 Bug da Fixare

### Critici
- [ ] **Controlli movimento non funzionano dopo l'intro** - Il passaggio da LouvreIntro a LouvreMuseum3DNew non trasferisce correttamente i controlli
- [ ] **Server dev errors** - Errori Vite "The service is no longer running" da investigare

### Minori
- [ ] Ottimizzare performance rendering 3D (FPS drop su mobile)
- [ ] Gestire disconnessione wallet durante il gioco
- [ ] Validazione input form marketplace/staking

---

## 🎨 Miglioramenti Qualità (Polish)

### Grafica e Visuals

#### Intro Cinematica
- [ ] **Modelli 3D più dettagliati** del cortile Louvre
  - Piramide con geometria più complessa (non solo 4 facce)
  - Palazzo con finestre, colonne, decorazioni
  - Fontane con acqua animata
  - Lampioni stile parigino
- [ ] **Texture realistiche** invece di colori flat
  - Vetro trasparente per piramide con riflessi
  - Pietra/marmo per palazzo
  - Pavimento con dettagli
- [ ] **Effetti particellari**
  - Stelle cadenti nel cielo
  - Nebbia/foschia atmosferica
  - Gocce d'acqua nelle fontane
- [ ] **Transizione fluida** intro → museo con fade/dissolve

#### Museo 3D
- [ ] **Integrare texture reali del Louvre** (già salvate in `/client/public/models/`)
  - Pavimento parquet texture PBR
  - Quadri reali sulle opere NFT
  - Texture muri e soffitto
- [ ] **Modello 3D completo del Louvre** (louvre-scene.zip)
  - Convertire OBJ → GLB ottimizzato
  - Ridurre poligoni per performance web
  - Integrare nel gioco
- [ ] **Illuminazione avanzata**
  - Post-processing (bloom, motion blur, SSAO)
  - Ombre dinamiche più realistiche
  - Color grading cinematico stile BNB Cartel
- [ ] **Dettagli architettonici**
  - Cornici decorative dorate
  - Modanature sul soffitto
  - Colonne classiche
  - Lucernari funzionanti
- [ ] **Personaggio Lupin 3D**
  - Modello low poly riconoscibile
  - Animazioni: idle, walk, run
  - Ombre del personaggio
  - Vista terza persona opzionale

### Movimento e Controlli
- [ ] **Movimento fluido con interpolazione**
  - Accelerazione/decelerazione invece di velocità costante
  - Smooth camera rotation (damping)
  - Bob camera mentre cammini
- [ ] **Migliorare controlli mobile**
  - Joystick virtuale più responsive
  - Gesture per zoom/pan
  - Haptic feedback
- [ ] **Opzioni controlli**
  - Sensibilità mouse regolabile
  - Inverti asse Y
  - FOV regolabile
  - Toggle corsa (shift)

### Audio
- [ ] **Musica di sottofondo**
  - Tema principale menu/dashboard
  - Musica ambiente museo (classica/lounge)
  - Tema heist mode (suspense)
- [ ] **Sound effects**
  - Passi del personaggio (diversi per superficie)
  - Ambient sounds museo (eco, voci lontane)
  - UI sounds (click, hover, notifiche)
  - Effetti opere NFT (glow, interazione)
- [ ] **Controlli audio**
  - Volume master, musica, SFX separati
  - Mute toggle
  - Spatial audio per 3D

### UI/UX
- [ ] **Loading screen professionale**
  - Progress bar con percentuale
  - Tips/lore del gioco
  - Animazioni smooth
- [ ] **Transizioni tra pagine**
  - Fade in/out
  - Slide animations
  - Skeleton loaders
- [ ] **Feedback visivo**
  - Hover states più evidenti
  - Click animations
  - Success/error toast notifications
  - Particle effects su azioni importanti
- [ ] **Tutorial/Onboarding**
  - Prima volta: guida interattiva
  - Tooltips contestuali
  - Help button sempre accessibile

---

## 🚀 Feature da Completare

### Backend e Database

#### Marketplace
- [ ] **Router tRPC marketplace** completo
  - Riscrivere con `await getDb()` async
  - `list` - Get all active listings con filtri
  - `myListings` - Get user's listings
  - `sell` - Create new listing
  - `buy` - Purchase artwork
  - `cancel` - Cancel listing
- [ ] **Validazione e sicurezza**
  - Check ownership prima di vendere
  - Prevent double-spending
  - Rate limiting
  - Input sanitization
- [ ] **Testing**
  - Unit tests per ogni procedure
  - Integration tests buy/sell flow
  - Edge cases (insufficient balance, expired listings)

#### Staking
- [ ] **Router tRPC staking** completo
  - `stake` - Stake $MUSEUM in pool
  - `unstake` - Unstake with penalties se early
  - `getRewards` - Calculate current rewards
  - `claimRewards` - Claim accumulated rewards
  - `getPoolStats` - Pool statistics (TVL, APY)
- [ ] **Calcolo rewards**
  - Formula: `rewards = stakedAmount * APY * timeElapsed / 365 days`
  - Bonus per pool lunghi (30gg: 10%, 90gg: 25%, etc.)
  - Penalty per early unstake (perdita 10-50% rewards)
- [ ] **Cron job rewards**
  - Calcolo automatico ogni ora
  - Update database miningRewards
  - Notifiche quando rewards > threshold

#### Artworks
- [ ] **Router tRPC artworks**
  - `list` - Get all artworks
  - `getById` - Get single artwork
  - `getUserArtworks` - Get user's collection
  - `mint` - Mint new artwork (admin/special events)
- [ ] **Metadata on-chain**
  - Sync con Solana blockchain
  - Fetch metadata da Metaplex
  - Cache in database

#### Mining Passivo
- [ ] **Calcolo mining rewards**
  - Formula: `hourlyRate = artwork.gp * rarityMultiplier * levelBonus * clanBonus`
  - Rarità multiplier: Common 1x, Rare 2x, Epic 4x, Legendary 8x, Mythic 16x
  - Level bonus: +5% ogni 5 livelli
  - Clan bonus: +10-30% in base a clan tier
- [ ] **Cron job mining**
  - Esegui ogni ora
  - Calcola rewards per ogni utente con opere in slot
  - Aggiungi a miningRewards table
  - Update user museumBalance

#### Clan System
- [ ] **Router tRPC clans**
  - `list` - Get all clans
  - `create` - Create new clan
  - `join` - Join clan
  - `leave` - Leave clan
  - `getMembers` - Get clan members
  - `getStats` - Clan statistics
- [ ] **Clan benefits**
  - Mining bonus condiviso
  - Clan wars/competitions
  - Shared treasury
  - Exclusive quests

#### Quest System
- [ ] **Router tRPC quests**
  - `getAvailable` - Get available quests for user
  - `start` - Start quest
  - `complete` - Complete quest
  - `claim` - Claim rewards
- [ ] **Quest types**
  - Daily: "Visita il museo", "Compra 1 opera", "Stake 100 $MUSEUM"
  - Weekly: "Vendi 5 opere", "Completa 10 daily quest"
  - Achievement: "Colleziona 50 opere", "Raggiungi livello 10"
- [ ] **Rewards**
  - $MUSEUM, $STONED, XP
  - Opere NFT rare (achievement)
  - Cosmetics (cornici speciali, effetti)

### Frontend UI

#### Marketplace Page
- [ ] **Connessione tRPC**
  - `trpc.marketplace.list.useQuery()` con filtri
  - `trpc.marketplace.buy.useMutation()`
  - `trpc.marketplace.sell.useMutation()`
- [ ] **Filtri funzionanti**
  - Rarità dropdown
  - Search bar
  - Sort by: price, GP, recency
  - Price range slider
- [ ] **Grid opere**
  - Card con immagine, nome, artista, rarità, GP, prezzo
  - Hover effects
  - Quick view modal
- [ ] **Sell modal**
  - Select artwork da inventory
  - Input prezzo
  - Expiration date picker
  - Preview listing
- [ ] **My listings**
  - Tab separato
  - Cancel listing button
  - Edit price (re-list)

#### Staking Page
- [ ] **Connessione tRPC**
  - `trpc.staking.getPoolStats.useQuery()`
  - `trpc.staking.stake.useMutation()`
  - `trpc.staking.unstake.useMutation()`
  - `trpc.staking.claimRewards.useMutation()`
- [ ] **Pool cards**
  - 5 pool: Flexible, 30gg, 90gg, 180gg, 365gg
  - Mostra APY, TVL, user staked amount
  - Lock period e penalty info
- [ ] **Stake modal**
  - Input amount $MUSEUM
  - Calcolo rewards preview
  - Confirm button
- [ ] **Rewards display**
  - Real-time countdown to next reward
  - Total accumulated rewards
  - Claim button (disabled se < minimum)
- [ ] **Unstake modal**
  - Warning se early unstake
  - Calcolo penalty
  - Confirm con checkbox "I understand"

#### Dashboard Improvements
- [ ] **Stats real-time**
  - Total mining rate/hour
  - Next level progress bar
  - Clan rank
- [ ] **Notifications center**
  - Quest completed
  - Rewards claimed
  - Marketplace sale
  - Level up
- [ ] **Quick actions**
  - Claim all rewards button
  - Auto-stake toggle
  - Inventory management

#### Inventory Page
- [ ] **Nuova pagina /inventory**
  - Grid tutte le opere dell'utente
  - Filter by rarità, GP, in slot/not in slot
  - Sort by acquisition date, GP, rarità
- [ ] **Slot management**
  - Drag & drop opere in slot
  - Swap opere tra slot
  - Remove da slot
  - Visual feedback mining rate change
- [ ] **Artwork details modal**
  - Full metadata
  - History (minted, bought, sold)
  - Actions: sell, stake in slot, send

### Blockchain Integration

#### Solana Wallet
- [ ] **Wallet persistence**
  - Save walletAddress in database on connect
  - Auto-reconnect on page load
  - Handle wallet change events
- [ ] **Transaction signing**
  - Sign message per auth
  - Sign transaction per buy/sell
  - Error handling (user rejected, insufficient SOL)

#### Museum Pass NFT
- [ ] **Mint Museum Pass**
  - Entry fee 0.8 SOL
  - Mint cNFT con Honeycomb/Metaplex
  - Save mint address in database
  - Unlock dashboard dopo mint
- [ ] **Verify ownership**
  - Check on-chain ogni login
  - Revoke access se transferred/burned
  - Grace period 24h

#### Opere NFT
- [ ] **Mint opere**
  - Admin panel per mint nuove opere
  - Random rarità con probabilità
  - Metadata Metaplex standard
  - Compressed NFT per ridurre costi
- [ ] **Transfer on-chain**
  - Marketplace buy → transfer NFT
  - Sync database ownerWallet
  - Handle failed transactions

#### Honeycomb Protocol Integration
- [ ] **Setup Hive Control**
  - Creare progetto su Hive Control
  - Configurare Character Manager (Museum Pass)
  - Configurare Resource Manager ($MUSEUM, $STONED)
  - Configurare Nectar Missions (mining passivo)
  - Configurare Nectar Staking (pools)
- [ ] **Sostituire simulazione con API reali**
  - `honeycombService.ts` → chiamate Edge Client
  - Mint Museum Pass via Honeycomb
  - Mint opere via Character Manager
  - Mining rewards via Nectar Missions
  - Staking via Nectar Staking
- [ ] **Testing on devnet**
  - Deploy su Solana devnet
  - Test completo flow
  - Fix bugs
  - Deploy su mainnet

### Progressione e Gameplay

#### Sistema Livelli
- [ ] **XP e Level up**
  - Guadagna XP da: quest, mining, trading
  - Formula: `xpForNextLevel = currentLevel * 100 + 500`
  - Level up → unlock slot, boost mining
- [ ] **Rewards level up**
  - Level 5: +5 slot, galleria media
  - Level 10: +10 slot, galleria grande, Heist Mode unlock
  - Level 15: +5 slot, clan creation unlock
  - Level 20: Guardie Elite unlock

#### Heist Mode (Level 10+)
- [ ] **Matchmaking**
  - Queue 2-4 giocatori stesso livello range
  - Lobby con chat
  - Ready check
- [ ] **Gameplay**
  - Mappa Louvre completa con guardie AI
  - Stealth mechanics (evita cono visione)
  - Obiettivo: rubare opere target
  - Timer limite
  - Allarme se scoperti
- [ ] **Rewards**
  - Opere NFT rubate divise tra team
  - Bonus XP e $MUSEUM
  - Leaderboard heist riusciti
- [ ] **Penalties**
  - Fallimento: perdita entry fee
  - Ban temporaneo se abbandoni

#### Guardie Elite
- [ ] **Unlock a livello 20**
  - Costo: 1000 $STONED
  - Benefit: +50% mining rate
  - Visual: guardie che pattugliano il tuo museo
- [ ] **Upgrade**
  - Tier 1-5 con costi crescenti
  - Ogni tier: +10% mining bonus
  - Cosmetic changes (uniformi diverse)

---

## 🎯 Ottimizzazioni Tecniche

### Performance
- [ ] **Code splitting**
  - Lazy load pagine (React.lazy)
  - Dynamic imports per Three.js
  - Ridurre bundle size
- [ ] **Asset optimization**
  - Compress texture (WebP, basis)
  - LOD per modelli 3D
  - Lazy load modelli fuori viewport
- [ ] **Database**
  - Indexing su colonne frequenti (walletAddress, mint)
  - Query optimization
  - Connection pooling
- [ ] **Caching**
  - Redis per session/rewards
  - CDN per static assets
  - Service worker per offline

### Security
- [ ] **Input validation**
  - Zod schemas per tutti gli input
  - Sanitize user content
  - Rate limiting API
- [ ] **Auth**
  - CSRF protection
  - Secure cookies (httpOnly, sameSite)
  - Session timeout
- [ ] **Smart contracts**
  - Audit security
  - Test coverage >90%
  - Bug bounty program

### DevOps
- [ ] **CI/CD**
  - GitHub Actions
  - Auto deploy su Vercel/Railway
  - Run tests on PR
- [ ] **Monitoring**
  - Sentry error tracking
  - Analytics (Plausible/Umami)
  - Performance monitoring
- [ ] **Documentation**
  - API docs (tRPC auto-gen)
  - Component storybook
  - Architecture diagrams

---

## 📱 Mobile App (Futuro)

- [ ] React Native version
- [ ] Push notifications
- [ ] Biometric auth
- [ ] Offline mode
- [ ] AR mode (view opere in real world)

---

## 🌐 Localizzazione

- [ ] i18n setup (react-i18next)
- [ ] Traduzioni: EN, IT, FR, ES, JP
- [ ] Currency formatting
- [ ] Date/time locale

---

## 🎮 Gamification Extra

- [ ] **Achievements system**
  - Badge collection
  - Showcase in profile
  - Rare achievements NFT
- [ ] **Leaderboards**
  - Top collectors
  - Top miners
  - Top heist players
  - Clan rankings
- [ ] **Events**
  - Limited time opere
  - Double XP weekends
  - Clan wars tournaments
- [ ] **Social**
  - Friend system
  - Gift opere
  - Visit friend's museum
  - Chat system

---

## 📊 Priorità Implementazione

### 🔴 Alta Priorità (MVP)
1. Fix bug controlli movimento
2. Marketplace UI + backend funzionante
3. Staking UI + backend funzionante
4. Mining passivo con cron job
5. Museum Pass NFT mint

### 🟡 Media Priorità (v1.0)
1. Movimento fluido e polish grafica
2. Audio e musica
3. Quest system
4. Clan system
5. Inventory management
6. Honeycomb Protocol integration

### 🟢 Bassa Priorità (v2.0+)
1. Heist Mode
2. Guardie Elite
3. Mobile app
4. Localizzazione
5. AR mode
6. Advanced gamification

---

## 📅 Timeline Stimata

- **Sprint 1 (1-2 settimane)**: Fix bug + Marketplace/Staking backend
- **Sprint 2 (1-2 settimane)**: Marketplace/Staking UI + Mining passivo
- **Sprint 3 (2-3 settimane)**: Museum Pass NFT + Honeycomb integration
- **Sprint 4 (2-3 settimane)**: Polish grafica + Audio + Tutorial
- **Sprint 5 (3-4 settimane)**: Quest + Clan + Inventory
- **Sprint 6 (4-6 settimane)**: Heist Mode + Testing + Launch

**Totale: ~3-4 mesi per v1.0 completo**

---

## 🤝 Contributori Necessari

- **1x Backend Developer** - tRPC, database, cron jobs
- **1x Frontend Developer** - React, Three.js, UI/UX
- **1x Blockchain Developer** - Solana, Honeycomb, smart contracts
- **1x 3D Artist** - Modelli Louvre, Lupin, opere
- **1x Game Designer** - Balancing, progression, economy
- **1x Sound Designer** - Musica, SFX

---

*Documento aggiornato: 26 Ottobre 2025*

