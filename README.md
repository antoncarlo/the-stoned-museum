# The Stoned Museum 🏛️

Un museo virtuale NFT ambientato nel Louvre, con meccaniche di gioco blockchain su Solana.

## 🎮 Descrizione

**The Stoned Museum** è un gioco blockchain che combina l'esplorazione 3D di un museo virtuale con meccaniche di farming passivo, staking e NFT. I giocatori possono collezionare opere NFT, esporle nella propria galleria personale, e guadagnare token $MUSEUM e $STONED.

### Caratteristiche Principali

- 🎨 **Galleria Personale 3D** - Esplora il tuo museo virtuale in stile low poly
- 🖼️ **Sistema NFT** - Colleziona opere con rarità (Common → Mythic) e GP
- ⛏️ **Mining Passivo** - Le opere farmano $MUSEUM 24/7
- 💰 **Dual-Token Economy** - $MUSEUM (utility) e $STONED (governance)
- 🔒 **Staking Pools** - 5 pool con APY 5-80% (Flexible, 30d, 90d, 180d, 365d)
- 🛒 **Marketplace** - Compra e vendi opere NFT
- 🎭 **Intro Cinematica** - Sequenza intro del cortile del Louvre di notte
- 🔐 **Wallet Solana** - Integrazione completa con Phantom, Solflare, etc.

### Sistema di Progressione

- **Livello 1-4**: Galleria piccola (10 cavalletti)
- **Livello 5**: Unlock galleria media (20 cavalletti)
- **Livello 10**: Unlock galleria grande (30+ cavalletti) + **Heist Mode**

### Heist Mode (Livello 10+)

Modalità cooperativa dove 2-4 giocatori possono fare "furti" al Louvre virtuale per rubare opere NFT rare.

## 🛠️ Stack Tecnologico

### Frontend
- **React 19** + **TypeScript**
- **Three.js** - Rendering 3D
- **Tailwind CSS 4** - Styling
- **Wouter** - Routing
- **shadcn/ui** - Componenti UI

### Backend
- **Express** + **tRPC**
- **Drizzle ORM** - Database ORM
- **MySQL** - Database

### Blockchain
- **Solana** - Blockchain
- **@solana/wallet-adapter** - Wallet integration
- **Honeycomb Protocol** (planned) - NFT, Resources, Missions, Staking

## 📦 Installazione

```bash
# Clone repository
git clone https://github.com/antoncarlo/the-stoned-museum.git
cd the-stoned-museum

# Installa dipendenze
pnpm install

# Setup database
pnpm db:push

# Avvia dev server
pnpm dev
```

## 🗄️ Database Schema

Il progetto include 10 tabelle:

- `users` - Utenti con wallet, Museum Pass, livello, XP, balance
- `artworks` - Opere NFT con rarità e GP
- `slots` - Sistema di slot del museo (3 iniziali, espandibili a 10)
- `miningRewards` - Tracking reward mining passivo
- `marketplaceListings` - Marketplace listings
- `clans` - Sistema clan con bonus mining
- `quests` - Quest giornaliere, settimanali e achievement
- `userQuests` - Progresso quest per ogni utente
- `conversions` - Log conversioni $MUSEUM → $STONED
- `transactions` - Log transazioni on-chain

## 🎯 Roadmap

### ✅ Completato
- [x] Database completo (10 tabelle)
- [x] Backend con autenticazione
- [x] Wallet Solana integration
- [x] Intro cinematica cortile Louvre
- [x] Galleria personale 3D con cavalletti
- [x] Sistema di progressione livelli
- [x] Controlli mobile e desktop
- [x] Dashboard base
- [x] Marketplace UI
- [x] Staking UI

### 🚧 In Sviluppo
- [ ] Polish: intro dettagliata, movimento fluido, effetti visivi
- [ ] Integrazione Honeycomb Protocol
- [ ] Sistema Heist Mode (livello 10+)
- [ ] Audio e musica di sottofondo
- [ ] Texture reali del Louvre (già preparate in `/client/public/models/`)

### 📋 Bug Conosciuti
- [ ] Mouse/cursore non ruota la camera (in fix)
- [ ] Controlli movimento dopo intro (in fix)

## 🎨 Ispirazione

Il progetto è ispirato a:
- **Addicted** (gioco su Solana con farming passivo)
- **BNB Cartel** (stile low poly e illuminazione cinematica)
- **Louvre Museum** (architettura e atmosfera)

## 📄 Licenza

MIT License - Vedi [LICENSE](LICENSE) per dettagli

## 🤝 Contributi

Contributi, issues e feature requests sono benvenuti!

## 📞 Contatti

- GitHub: [@antoncarlo](https://github.com/antoncarlo)
- Repository: [the-stoned-museum](https://github.com/antoncarlo/the-stoned-museum)

---

**Nota**: Questo è un progetto in sviluppo attivo. Alcune feature potrebbero non essere ancora completamente implementate.

