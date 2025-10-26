# The Stoned Museum - Admin Guide

## 📚 Guida Amministratore

Questa guida spiega come gestire le opere NFT e configurare il sistema per The Stoned Museum.

---

## 🎨 Inserimento Opere NFT

### Metodo 1: Script CLI Interattivo (Consigliato)

Utilizza lo script interattivo per inserire opere una alla volta:

```bash
cd /var/www/the-stoned-museum
pnpm tsx scripts/add-artwork.ts
```

Lo script chiederà interattivamente:
- Mint address Solana
- Nome dell'opera
- Rarità (Common, Rare, Epic, Legendary, Mythic)
- GP (Gallery Points)
- URL immagine (opzionale)
- Artista (opzionale)
- Descrizione (opzionale)
- Wallet proprietario (opzionale)

**Vantaggi:**
- Interfaccia user-friendly
- Validazione automatica dei dati
- Calcolo automatico mining rate
- Possibilità di inserire più opere in sequenza

### Metodo 2: Import Bulk da CSV

Per inserire molte opere contemporaneamente, usa l'import da CSV:

```bash
cd /var/www/the-stoned-museum
pnpm tsx scripts/import-artworks-csv.ts path/to/artworks.csv
```

**Formato CSV (con header):**
```csv
mint,name,rarity,gp,imageUrl,artist,description,ownerWallet
7xKXt...,Crypto Mona Lisa,Mythic,200,https://...,Artist,Description,
```

Un file template è disponibile in `scripts/artworks-template.csv`.

**Vantaggi:**
- Inserimento rapido di molte opere
- Facile da preparare in Excel/Google Sheets
- Report dettagliato di successi/errori

### Metodo 3: Tramite tRPC API

Le opere NFT possono essere inserite utilizzando la procedura `artworks.mint()` del router tRPC.

**Endpoint:** `POST /api/trpc/artworks.mint`

**Parametri richiesti:**
```typescript
{
  mint: string;          // Mint address Solana (univoco)
  name: string;          // Nome dell'opera
  rarity: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
  gp: number;            // Gallery Points (base mining power)
  imageUrl?: string;     // URL immagine (opzionale)
  artist?: string;       // Nome artista (opzionale)
  description?: string;  // Descrizione (opzionale)
  ownerWallet?: string;  // Wallet proprietario iniziale (opzionale)
}
```

**Esempio di chiamata:**
```typescript
// Da frontend admin panel
const result = await trpc.artworks.mint.mutate({
  mint: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  name: "Crypto Mona Lisa",
  rarity: "Mythic",
  gp: 200,
  imageUrl: "https://arweave.net/...",
  artist: "Digital Leonardo",
  description: "A masterpiece of crypto art"
});
```

### Metodo 2: Inserimento Diretto Database

Se preferisci inserire opere direttamente nel database:

```sql
INSERT INTO artworks (
  mint,
  name,
  rarity,
  gp,
  imageUrl,
  artist,
  description,
  ownerWallet,
  createdAt
) VALUES (
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'Crypto Mona Lisa',
  'Mythic',
  200,
  'https://arweave.net/...',
  'Digital Leonardo',
  'A masterpiece of crypto art',
  NULL,
  NOW()
);
```

---

## 💎 Sistema Rarità

### Rarità e Moltiplicatori Mining

| Rarità | Moltiplicatore | GP Consigliato | Mining Rate Esempio |
|--------|----------------|----------------|---------------------|
| Common | 1x | 10-20 | 10-20 $MUSEUM/h |
| Rare | 2x | 20-40 | 40-80 $MUSEUM/h |
| Epic | 4x | 40-80 | 160-320 $MUSEUM/h |
| Legendary | 8x | 80-150 | 640-1200 $MUSEUM/h |
| Mythic | 16x | 150-300 | 2400-4800 $MUSEUM/h |

**Formula Mining:**
```
hourlyRate = GP × rarityMultiplier × levelBonus
```

**Level Bonus:**
- +5% ogni 5 livelli
- Livello 5: +5%
- Livello 10: +10%
- Livello 15: +15%
- etc.

### Linee Guida Assegnazione Rarità

**Common (Comune):**
- Opere base, facilmente ottenibili
- Artisti emergenti
- Edizioni limitate grandi (>1000)

**Rare (Raro):**
- Opere di qualità media-alta
- Artisti conosciuti
- Edizioni limitate medie (100-1000)

**Epic (Epico):**
- Opere di alta qualità
- Artisti affermati
- Edizioni limitate piccole (10-100)

**Legendary (Leggendario):**
- Opere eccezionali
- Artisti famosi
- Edizioni molto limitate (1-10)

**Mythic (Mitico):**
- Opere uniche (1/1)
- Artisti leggendari
- Pezzi storici o iconici

---

## 🔧 Configurazione Sistema

### Variabili Ambiente

Assicurati che il file `.env` contenga:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/stoned_museum"

# Solana
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
MUSEUM_PASS_MINT="<mint_address_museum_pass>"

# Token
MUSEUM_TOKEN_MINT="<mint_address_museum_token>"
STONED_TOKEN_MINT="<mint_address_stoned_token>"

# Admin
ADMIN_WALLET="<your_admin_wallet_address>"
```

### Inizializzazione Database

```bash
# Applica schema database
pnpm db:push

# Verifica che tutte le tabelle siano create
pnpm db:studio
```

---

## 👥 Gestione Utenti

### Creazione Slot Iniziali

Ogni nuovo utente che acquista il Museum Pass riceve automaticamente **3 slot gratuiti**.

Gli slot aggiuntivi possono essere sbloccati:
- **Slot 4-10:** Disponibili per tutti (costo crescente in $MUSEUM)
- **Slot 11-20:** Richiedono Level 5+
- **Slot 21-30:** Richiedono Level 10+

### Costi Unlock Slot

I costi sono gestiti dalla funzione `getNextSlotCost()` nel backend:

```typescript
// Esempio costi progressivi
Slot 4:  1000 $MUSEUM
Slot 5:  2000 $MUSEUM
Slot 6:  3000 $MUSEUM
Slot 7:  5000 $MUSEUM
Slot 8:  8000 $MUSEUM
Slot 9:  13000 $MUSEUM
Slot 10: 21000 $MUSEUM
```

---

## 💰 Economia del Gioco

### Pool Staking

| Pool | APY | Lock Period | Early Penalty |
|------|-----|-------------|---------------|
| Flexible | 5% | 0 giorni | 0% |
| 30gg | 10% | 30 giorni | 10% |
| 90gg | 25% | 90 giorni | 25% |
| 180gg | 50% | 180 giorni | 40% |
| 365gg | 80% | 365 giorni | 50% |

### Conversione $MUSEUM → $STONED

Ratio di conversione consigliato:
- **1000 $MUSEUM = 1 $STONED**

Questo mantiene $MUSEUM come token interno di gioco e $STONED come token tradabile.

---

## 🛠️ Comandi Utili

### Database

```bash
# Apri Drizzle Studio (GUI database)
pnpm db:studio

# Push schema changes
pnpm db:push

# Generate migrations
pnpm db:generate
```

### Development

```bash
# Avvia server dev
pnpm dev

# Build per production
pnpm build

# Avvia production server
pnpm start
```

### Git

```bash
# Commit changes
git add -A
git commit -m "feat: add new artworks"
git push origin master

# Check status
git status
git log --oneline -10
```

---

## 📊 Monitoring

### Metriche da Monitorare

1. **TVL Staking:** Total Value Locked nei pool
2. **Active Users:** Utenti con Museum Pass attivo
3. **Marketplace Volume:** Volume trading opere
4. **Mining Rate:** Rate medio mining per utente
5. **Slot Utilization:** % slot occupati vs disponibili

### Query SQL Utili

```sql
-- Total users
SELECT COUNT(*) FROM users WHERE hasMuseumPass = true;

-- Total artworks
SELECT COUNT(*) FROM artworks;

-- Marketplace stats
SELECT 
  COUNT(*) as total_listings,
  SUM(price) as total_value,
  AVG(price) as avg_price
FROM marketplaceListings
WHERE active = true;

-- Staking stats
SELECT 
  pool,
  COUNT(*) as stakers,
  SUM(stakedAmount) as tvl
FROM users
WHERE stakingPool IS NOT NULL
GROUP BY pool;

-- Top miners
SELECT 
  u.walletAddress,
  COUNT(s.id) as slots_used,
  SUM(a.gp * CASE a.rarity
    WHEN 'Common' THEN 1
    WHEN 'Rare' THEN 2
    WHEN 'Epic' THEN 4
    WHEN 'Legendary' THEN 8
    WHEN 'Mythic' THEN 16
  END) as total_mining_power
FROM users u
JOIN slots s ON s.userId = u.id
JOIN artworks a ON a.mint = s.artworkMint
WHERE s.artworkMint IS NOT NULL
GROUP BY u.id
ORDER BY total_mining_power DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Problema: Opere non appaiono nel marketplace
**Soluzione:**
1. Verifica che `ownerWallet` sia NULL o corrisponda al venditore
2. Controlla che la listing sia `active = true`
3. Verifica `expiresAt` non sia passato

### Problema: Mining rewards non si accumulano
**Soluzione:**
1. Verifica che il cron job sia attivo
2. Controlla che le opere siano assegnate agli slot
3. Verifica formula mining nel router

### Problema: Staking rewards non calcolati
**Soluzione:**
1. Verifica che `stakedAt` sia impostato
2. Controlla che il pool sia valido
3. Verifica formula rewards nel router

---

## 📞 Supporto

Per problemi tecnici o domande:
- GitHub Issues: https://github.com/antoncarlo/the-stoned-museum/issues
- Email: support@thestonedmuseum.com

---

**Documento creato:** 26 Ottobre 2025  
**Versione:** 1.0  
**Ultima modifica:** 26 Ottobre 2025

