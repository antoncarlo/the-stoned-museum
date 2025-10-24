# Louvre NFT Museum 🎨

Un museo virtuale 3D interattivo ispirato al gioco "Addicted" su Solana, dove i visitatori possono esplorare gallerie d'arte NFT in un ambiente low poly con cel shading.

## 🌟 Caratteristiche Principali

### Grafica e Stile
- **Low Poly 3D**: Geometrie con basso numero di poligoni per un look stilizzato
- **Cel Shading**: Shader personalizzati per effetto cartoon/toon
- **Palette Colori**: Viola, magenta, rosa e blu neon (ispirata ad Addicted)
- **Illuminazione Dinamica**: Luci colorate con effetti spotlight sulle opere

### Gameplay
- **Movimento Libero**: Controlli WASD/Frecce per muoversi nel museo
- **Mouse Look**: Rotazione camera con movimento del mouse
- **Sistema di Collisioni**: Rilevamento collisioni con muri e pareti
- **Interazione NFT**: Pannelli informativi che appaiono avvicinandosi alle opere

### Architettura del Museo
Il museo è composto da 4 gallerie principali:

1. **North Gallery** - Arte Contemporanea Digitale
   - Crypto Dreams (Beeple)
   - Decentralized Vision (Pak)
   - Neon Genesis (XCOPY)

2. **East Gallery** - Arte Generativa
   - Algorithmic Beauty (Tyler Hobbs)
   - Chromatic Harmony (Dmitri Cherniak)

3. **South Gallery** - Arte 3D & Metaverse
   - Virtual Realm (Fewocious)
   - Metaverse Dreams (Mad Dog Jones)

4. **Central Atrium** - Artisti in Evidenza
   - Digital Renaissance (Refik Anadol)
   - Quantum Entanglement (Hackatao)

## 🎮 Come Giocare

1. **Avvia il gioco**: Clicca su "Inizia l'Esplorazione"
2. **Muoviti**: Usa WASD o le frecce direzionali
3. **Guarda intorno**: Muovi il mouse per ruotare la visuale
4. **Esplora**: Avvicinati alle opere NFT per vedere i dettagli
5. **Esci**: Premi ESC per sbloccare il puntatore

## 🛠️ Stack Tecnologico

### Frontend
- **React 19**: Framework UI
- **Three.js**: Libreria 3D WebGL
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Vite**: Build tool

### Grafica 3D
- **Custom Shaders**: GLSL per cel shading e effetti glow
- **Real-time Rendering**: 60 FPS target
- **Shadow Mapping**: Ombre dinamiche
- **Fog Effect**: Nebbia per profondità

## 📁 Struttura del Progetto

```
client/src/
├── components/
│   ├── LouvreGame.tsx      # Componente principale del gioco 3D
│   └── NFTInfo.tsx         # UI per informazioni opere NFT
├── hooks/
│   └── usePlayerControls.ts # Hook per controlli movimento
├── lib/
│   ├── shaders.ts          # Shader GLSL personalizzati
│   └── nftData.ts          # Database opere NFT
└── pages/
    └── Home.tsx            # Pagina principale
```

## 🎨 Shader Personalizzati

### Cel Shading
Effetto cartoon con bande di colore discrete invece di sfumature graduali:
- 4 livelli di intensità luminosa
- Rim lighting per effetto outline
- Illuminazione direzionale

### Glow Effect
Effetto bagliore pulsante per le opere NFT:
- Pulsazione temporale
- Colori personalizzati per galleria
- Emissione luminosa

## 🚀 Sviluppi Futuri

### Fase 2 - Integrazione Blockchain
- [ ] Connessione wallet Solana
- [ ] Visualizzazione NFT reali da blockchain
- [ ] Metadati on-chain
- [ ] Sistema di proprietà opere

### Fase 3 - Economia del Gioco
- [ ] Token $MUSEUM (ispirato a $WEED di Addicted)
- [ ] Sistema di "curatela" per creare mostre
- [ ] Marketplace per spazi espositivi
- [ ] Ricompense per visitatori

### Fase 4 - Social Features
- [ ] Multiplayer per visitare insieme
- [ ] Chat in-game
- [ ] Eventi speciali e vernissage
- [ ] Sistema di recensioni opere

### Fase 5 - Espansione Contenuti
- [ ] Più gallerie e stanze
- [ ] Mostre temporanee
- [ ] Artisti ospiti
- [ ] VR support

## 🎯 Ottimizzazioni

### Performance
- **Frustum Culling**: Renderizza solo oggetti visibili
- **Flat Shading**: Riduce calcoli di illuminazione
- **Low Poly Models**: Meno vertici = più FPS
- **Texture Atlasing**: Riduce draw calls

### Accessibilità
- Controlli alternativi (WASD + Frecce)
- UI leggibile con contrasti elevati
- Istruzioni chiare all'avvio
- ESC per uscire sempre disponibile

## 📝 Note di Sviluppo

### Ispirazione da Addicted
Il gioco si ispira a "Addicted" su Solana per:
- Estetica low poly con colori vibranti
- Illuminazione neon/cyberpunk
- Sistema economico basato su attività (farming → curatela)
- Meccaniche on-chain

### Differenze Concettuali
- Focus culturale/educativo invece che gameplay competitivo
- Mostre NFT invece di farming
- Esperienza contemplativa invece che frenetica
- Tema museale elegante invece che underground

## 🔗 Link Utili

- **Three.js Documentation**: https://threejs.org/docs/
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **Addicted GitBook**: https://pandemic-labs.gitbook.io/addicted/

## 📄 Licenza

Progetto educativo - Louvre NFT Museum v1.0

---

**Creato con ❤️ usando Three.js e React**

