# The Stoned Museum - Cron Jobs Guide

## 📅 Guida ai Cron Jobs

Questa guida spiega come funzionano i cron jobs per il mining passivo e i rewards dello staking.

---

## 🕐 Cron Jobs Disponibili

### 1. Mining Rewards (`mining-rewards.ts`)

**Frequenza:** Ogni ora (0 * * * *)

**Funzione:** Calcola e distribuisce i rewards del mining passivo a tutti gli utenti con slot attivi.

**Processo:**
1. Recupera tutti gli utenti con Museum Pass attivo
2. Per ogni utente:
   - Calcola il mining rate basato su GP, rarità e level bonus
   - Aggiorna il balance $MUSEUM dell'utente
   - Registra il reward nella tabella `miningRewards`
3. Genera un report con statistiche

**Formula Mining Rate:**
```
hourlyRate = Σ(GP × rarityMultiplier) × levelBonus

Dove:
- rarityMultipliers: Common=1, Rare=2, Epic=4, Legendary=8, Mythic=16
- levelBonus = 1 + (floor(level / 5) × 0.05)
```

**Esempio:**
- User con 2 opere:
  - Epic (GP 50): 50 × 4 = 200
  - Rare (GP 25): 25 × 2 = 50
- Total mining power: 250
- Level 10 bonus: 1.10 (10%)
- **Hourly rate: 275 $MUSEUM/h**

### 2. Staking Rewards (`staking-rewards.ts`)

**Frequenza:** Ogni giorno a mezzanotte (0 0 * * *)

**Funzione:** Calcola e accredita i rewards dello staking per tutti gli utenti con stake attivo.

**Processo:**
1. Recupera tutti gli utenti con staking attivo
2. Per ogni utente:
   - Calcola i giorni di staking
   - Calcola i rewards giornalieri basati su APY
   - Aggiunge i rewards allo staked amount (compound interest)
3. Genera un report con statistiche

**Formula Staking Rewards:**
```
dailyRewards = floor(stakedAmount × APY / 365)

Pool APY:
- Flexible: 5%
- 30gg: 10%
- 90gg: 25%
- 180gg: 50%
- 365gg: 80%
```

**Esempio:**
- Staked amount: 10,000 $MUSEUM
- Pool: 90gg (APY 25%)
- **Daily rewards: 6.85 $MUSEUM**
- Dopo 30 giorni: ~205 $MUSEUM

---

## 🚀 Esecuzione

### In Produzione

I cron jobs vengono avviati automaticamente quando il server è in modalità produzione:

```bash
NODE_ENV=production pnpm start
```

Output:
```
Server running on http://localhost:3000/

🕐 Initializing Cron Jobs...

✅ Mining Rewards job scheduled (every hour)
✅ Staking Rewards job scheduled (daily at midnight)

✅ All cron jobs initialized successfully
```

### In Development

In modalità development, i cron jobs sono disabilitati per evitare modifiche accidentali al database.

Per testare manualmente:

```bash
# Test mining rewards
pnpm tsx server/cron/mining-rewards.ts

# Test staking rewards
pnpm tsx server/cron/staking-rewards.ts
```

### Test Manuale

Puoi eseguire tutti i cron jobs immediatamente per test:

```bash
# Create test script
cat > test-cron.ts << 'EOF'
import { runAllCronJobsNow } from "./server/cron/scheduler";

runAllCronJobsNow()
  .then(() => {
    console.log("✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
EOF

# Run test
pnpm tsx test-cron.ts
```

---

## 📊 Monitoring

### Log Output

Ogni cron job genera log dettagliati:

```
⛏️  Mining Rewards Cron Job Started
============================================================
Time: 2025-10-26T15:00:00.000Z

Found 150 users with Museum Pass

✅ User 1 (7xKXtg2C...): +275 $MUSEUM (rate: 275/h)
✅ User 2 (8yLYuh3D...): +420 $MUSEUM (rate: 420/h)
⚠️  User 3 (9zMZvi4E...): No active slots, skipped

============================================================

📊 Mining Rewards Summary:

  Total users processed: 148/150
  Total rewards distributed: 45,680 $MUSEUM
  Average reward per user: 308 $MUSEUM

============================================================

✅ Mining Rewards Cron Job Completed
```

### Database Queries

Monitora i rewards distribuiti:

```sql
-- Mining rewards oggi
SELECT 
  COUNT(*) as total_rewards,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  AVG(miningRate) as avg_rate
FROM miningRewards
WHERE DATE(claimedAt) = CURDATE();

-- Staking stats
SELECT 
  stakingPool,
  COUNT(*) as users,
  SUM(stakingAmount) as tvl,
  AVG(stakingAmount) as avg_stake
FROM users
WHERE stakingPool != 'none'
GROUP BY stakingPool;

-- Top miners
SELECT 
  u.walletAddress,
  COUNT(mr.id) as rewards_count,
  SUM(mr.amount) as total_earned,
  AVG(mr.miningRate) as avg_rate
FROM users u
JOIN miningRewards mr ON mr.userId = u.id
WHERE DATE(mr.claimedAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY u.id
ORDER BY total_earned DESC
LIMIT 10;
```

---

## 🔧 Configurazione

### Modifica Schedule

Per modificare la frequenza dei cron jobs, edita `server/cron/scheduler.ts`:

```typescript
// Mining Rewards - Ogni 30 minuti invece di ogni ora
cron.schedule("*/30 * * * *", async () => {
  await processMiningRewards();
});

// Staking Rewards - Ogni 12 ore invece di ogni giorno
cron.schedule("0 */12 * * *", async () => {
  await processStakingRewards();
});
```

**Formato Cron Expression:**
```
┌────────────── second (optional, 0-59)
│ ┌──────────── minute (0-59)
│ │ ┌────────── hour (0-23)
│ │ │ ┌──────── day of month (1-31)
│ │ │ │ ┌────── month (1-12)
│ │ │ │ │ ┌──── day of week (0-6, 0=Sunday)
│ │ │ │ │ │
│ │ │ │ │ │
* * * * * *
```

**Esempi:**
- `0 * * * *` - Ogni ora
- `0 0 * * *` - Ogni giorno a mezzanotte
- `*/15 * * * *` - Ogni 15 minuti
- `0 0 * * 0` - Ogni domenica a mezzanotte
- `0 12 * * 1-5` - Ogni giorno feriale a mezzogiorno

### Modifica Rewards

Per modificare i calcoli dei rewards, edita i file corrispondenti:

**Mining Rewards (`server/cron/mining-rewards.ts`):**
```typescript
// Modifica moltiplicatori rarità
const RARITY_MULTIPLIERS = {
  Common: 1,
  Rare: 3,      // Aumentato da 2 a 3
  Epic: 6,      // Aumentato da 4 a 6
  Legendary: 12, // Aumentato da 8 a 12
  Mythic: 24,   // Aumentato da 16 a 24
};

// Modifica level bonus
function calculateLevelBonus(level: number): number {
  const bonusLevels = Math.floor(level / 5);
  return 1 + bonusLevels * 0.10; // Aumentato da 0.05 a 0.10
}
```

**Staking Rewards (`server/cron/staking-rewards.ts`):**
```typescript
// Modifica APY dei pool
const STAKING_POOLS = {
  flexible: { apy: 0.08, lockDays: 0, penalty: 0 },      // 8% invece di 5%
  "30gg": { apy: 0.15, lockDays: 30, penalty: 0.1 },     // 15% invece di 10%
  "90gg": { apy: 0.35, lockDays: 90, penalty: 0.25 },    // 35% invece di 25%
  "180gg": { apy: 0.70, lockDays: 180, penalty: 0.4 },   // 70% invece di 50%
  "365gg": { apy: 1.20, lockDays: 365, penalty: 0.5 },   // 120% invece di 80%
};
```

---

## 🐛 Troubleshooting

### Problema: Cron jobs non si avviano

**Soluzione:**
```bash
# Verifica che NODE_ENV sia production
echo $NODE_ENV

# Verifica log del server
pm2 logs stoned-museum
# OR
sudo journalctl -u stoned-museum -f

# Verifica che node-cron sia installato
pnpm list node-cron
```

### Problema: Rewards non vengono distribuiti

**Soluzione:**
```bash
# Esegui manualmente per vedere errori
pnpm tsx server/cron/mining-rewards.ts

# Verifica database connection
mysql -u stoned_user -p -e "USE stoned_museum; SHOW TABLES;"

# Verifica che ci siano utenti con slot attivi
mysql -u stoned_user -p -e "
  SELECT COUNT(*) as users_with_slots
  FROM users u
  JOIN slots s ON s.userId = u.id
  WHERE u.hasMuseumPass = true
  AND s.artworkMint IS NOT NULL;
"
```

### Problema: Errori di calcolo rewards

**Soluzione:**
```bash
# Test calcolo mining rate per un utente specifico
mysql -u stoned_user -p -e "
  SELECT 
    u.id,
    u.level,
    s.artworkMint,
    a.name,
    a.rarity,
    a.gp
  FROM users u
  JOIN slots s ON s.userId = u.id
  JOIN artworks a ON a.mint = s.artworkMint
  WHERE u.id = 1;
"

# Calcola manualmente e confronta con il log del cron job
```

---

## 📝 Best Practices

1. **Backup Database:** Esegui backup regolari prima di modificare i cron jobs
2. **Test in Staging:** Testa sempre le modifiche in un ambiente di staging
3. **Monitor Logs:** Controlla regolarmente i log per errori
4. **Alert System:** Configura alert per fallimenti dei cron jobs
5. **Rate Limiting:** Evita di eseguire cron jobs troppo frequentemente
6. **Transaction Safety:** Usa transazioni database per operazioni critiche

---

**Documento creato:** 26 Ottobre 2025  
**Versione:** 1.0  
**Ultima modifica:** 26 Ottobre 2025

