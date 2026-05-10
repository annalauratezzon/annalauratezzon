# Museo del Delta del Po — Totem Interattivo

Single-file HTML app per totem museale (landscape, schermo fisso ~1920×1080).

## File

| File | Descrizione |
|------|-------------|
| `museo-delta-LATEST.html` | File principale con tutti i giochi — rinomina in `index.html` |
| `mappa-calibrata3.html` | Prototipo mappa Gioco 3 secondaria (standalone) |

## Stack tecnico

- Vanilla JS + CSS, zero framework
- Font: Fraunces (serif, titoli) + DM Sans (body) via Google Fonts CDN
- Audio: Web Audio API (zero dipendenze)
- Storage: localStorage per leaderboard secondaria

## Palette

```
--verde-scuro:   #2D5F5D
--acquamarina:   #5B9E9A
--sabbia:        #D4B896
--bianco-caldo:  #FAF7F2
```

## Architettura navigazione

```
Home
├── Scuola Primaria (6–10)
│   └── Lista giochi
│       ├── Gioco 1: Quiz del Delta
│       ├── Gioco 2: Metti al posto giusto
│       └── Gioco 3: Rimetti in ordine
└── Scuola Secondaria (11–14)
    ├── Schermata profilo (nickname + avatar)
    └── Lista giochi
        ├── Gioco 1: Quiz a Tempo
        ├── Gioco 2: Gestisci il Delta
        └── Gioco 3: In viaggio nel Delta ← DA COMPLETARE
```

## Giochi Primaria

### Gioco 1 — Quiz del Delta
- 10 domande a risposta multipla (2×2)
- Stepper a pallini
- Foto nelle opzioni per alcune domande
- Feedback con tick/faccina SVG animati
- Riepilogo con punteggio N/10 + coriandoli se ≥8

### Gioco 2 — Metti al posto giusto
- 16 tessere da abbinare a 4 categorie (Flora, Fauna, Attività, Ambienti)
- Tap tessera → highlight colonne → tap colonna
- Toast + suoni per feedback
- Coriandoli al completamento

### Gioco 3 — Rimetti in ordine
- 10 sequenze, 4 tessere ciascuna
- Immagini embedded base64 (sequenza 1 ha foto reali)
- Tap tessera → tap slot numerato
- Contatore sequenze completate nell'header
- Stato completata persistente in sessione

## Giochi Secondaria

### Sistema profilo + leaderboard
- Schermata profilo prima dei giochi: nickname + 10 avatar emoji del Delta
- Chip nome/avatar nell'header durante tutti i giochi secondaria
- localStorage key: `delta_leaderboard_sec`
- Top 10 per gioco, ordinamento: punti desc → data desc

### Gioco 1 — Quiz a Tempo
- 10 domande, timer circolare SVG
- Schermata velocità pre-gioco (slider 😌🎮⚡🚀)
- Moltiplicatori tempo: ×1.5 / ×1.0 / ×0.7 / ×0.5
- Moltiplicatori punteggio: ×0.75 / ×1.0 / ×1.3 / ×1.75
- 100 pt base + fino a 50 pt bonus velocità (proporzionale)
- Domande 2 e 6 hanno timer ridotto a 10s
- Bonus velocità NON si azzera su risposta sbagliata
- Suoni: tick negli ultimi 5s, fanfara tempo scaduto

### Gioco 2 — Gestisci il Delta
- 10 scenari, 3 scelte ciascuno
- 4 indicatori: Biodiversità, Economia, Qualità acqua, Consenso (start: 50)
- Feedback inline: alert colorato (verde/rosso/bianco) + chip delta inline
- Riepilogo: radar SVG 600px + testo colonna destra
- Badge: 🌿 Custode bio (bio≥80), 🤝 Mediatore (tutti≥60), 💼 Campione eco (eco≥80+bio≥50), ♻️ Sostenibile (tutti≥55), 💧 Guardiano acqua (acqua≥85), 🫧 Acque cristalline (acqua≥75+bio≥60), 🚨 Allarme rosso (bio<30 o acqua<30)
- Classifica con media indicatori come punteggio

### Gioco 3 — In viaggio nel Delta ← DA COMPLETARE
- Mappa illustrata PNG (base64 embedded) con tappe sovrapposte in CSS
- 8 tappe, max 10-12 turni
- Meccanica: corretto→+1, corretto veloce→+2, sbagliato→fermo, sbagliato difficile→-1
- Segnalino arancione animato (pin con faccia)
- 3 percorsi alternativi (una mappa per percorso)
- **Coordinate tappe mappa 1** (left%, top%):
  `(48.6,85.0) (28.5,66.1) (71.3,76.5) (63.0,49.9) (67.9,28.0) (37.9,24.6) (26.1,19.2) (45.1,12.0)`
- **In attesa di:** contenuti (domande, nomi tappe, 3 percorsi)

## Sistema audio (Web Audio API)

| Funzione | Quando |
|----------|--------|
| `suonaSeleziona()` | Click su card/opzione |
| `suonaCorretto()` | Risposta corretta |
| `suonaSbagliato()` | Risposta sbagliata |
| `suonaNeutro()` | Scelta mista (Gestisci) |
| `suonaVittoria()` | Fanfara fine gioco |
| `suonaTickTock()` | Ultimi 5s timer (Quiz Tempo) |
| `suonaTempoScaduto()` | Timer a zero |

## Note deployment

- Tutti i file di progetto sono contenuti in un singolo HTML — nessuna dipendenza esterna eccetto Google Fonts CDN
- Le immagini sono embedded in base64
- Per uso offline: sostituire i font Google con file locali
- Browser consigliato in modalità chiosco: Chrome `--kiosk`
- La leaderboard usa `localStorage` — persiste finché non si svuota la cache del browser

## Come aggiungere immagini

Le immagini vanno convertite in base64 e inserite nel JS:
```python
import base64
with open('immagine.jpg', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode()
# Usare come: `data:image/jpeg;base64,${b64}`
```


## Password db supabase
- Museodelta2026!
