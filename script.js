
/* ══════════════════════════════════════
   PASSWORD
══════════════════════════════════════ */
(function() {
  if (sessionStorage.getItem('museo_auth') === '1') {
    const el = document.getElementById('screen-password');
    if (el) { el.style.display = 'none'; }
  }
})();

function verificaPassword() {
  const input = document.getElementById('password-input');
  const errore = document.getElementById('password-errore');
  if (input.value === '!?MuseoDelta2026!?') {
    sessionStorage.setItem('museo_auth', '1');
    const overlay = document.getElementById('screen-password');
    overlay.classList.add('nascosta');
    input.classList.remove('errore');
    errore.classList.remove('visibile');
    setTimeout(() => { overlay.style.display = 'none'; }, 400);
  } else {
    input.classList.add('errore');
    errore.classList.add('visibile');
    input.value = '';
    input.focus();
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById('password-input');
  const eyeShow = document.getElementById('pw-eye-show');
  const eyeHide = document.getElementById('pw-eye-hide');
  if (input.type === 'password') {
    input.type = 'text';
    eyeShow.style.display = 'none';
    eyeHide.style.display = '';
  } else {
    input.type = 'password';
    eyeShow.style.display = '';
    eyeHide.style.display = 'none';
  }
}

/* ══════════════════════════════════════
   SUPABASE
══════════════════════════════════════ */
const FB_DB_URL = 'https://classifica-museo-default-rtdb.europe-west1.firebasedatabase.app';

async function fbSalva(gioco, nome, avatar, punti) {
  const res = await fetch(`${FB_DB_URL}/leaderboard/${gioco}.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, avatar, punti, created_at: new Date().toISOString() })
  });
  if (!res.ok) throw new Error(`Firebase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fbLeggi(gioco) {
  const res = await fetch(`${FB_DB_URL}/leaderboard/${gioco}.json`);
  if (!res.ok) throw new Error(`Firebase ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data) return [];
  return Object.values(data)
    .sort((a, b) => b.punti - a.punti || new Date(b.created_at) - new Date(a.created_at));
}

/* ══════════════════════════════════════
   GIOCO 2 — ABBINAMENTO
══════════════════════════════════════ */
const ABBINAMENTO_DATI = [
  { testo: 'Canna palustre',          categoria: 'Flora',               img: 'img/primaria_2/canna-palustre.png' },
  { testo: 'Ninfea',                  categoria: 'Flora',               img: 'img/primaria_2/ninfea.png' },
  { testo: 'Tamerice',                categoria: 'Flora',               img: 'img/primaria_2/tamerice.png' },
  { testo: 'Salicornia',              categoria: 'Flora',               img: 'img/primaria_2/salicornia.png' },
  { testo: 'Fenicottero',             categoria: 'Fauna',               img: 'img/primaria_2/fenicottero.png' },
  { testo: 'Airone',                  categoria: 'Fauna',               img: 'img/primaria_2/airone.png' },
  { testo: 'Cefalo',                  categoria: 'Fauna',               img: 'img/primaria_2/cefalo.png' },
  { testo: 'Volpoca',                 categoria: 'Fauna',               img: 'img/primaria_2/volpoca.png' },
  { testo: 'Pesca',                   categoria: "Attività dell'uomo",  img: 'img/primaria_2/pesca.png' },
  { testo: 'Allevamento delle cozze', categoria: "Attività dell'uomo",  img: 'img/primaria_2/allevamento-cozze.png' },
  { testo: 'Navigazione in barca',    categoria: "Attività dell'uomo",  img: 'img/primaria_2/navigazione.png' },
  { testo: 'Coltivazione del riso',   categoria: "Attività dell'uomo",  img: 'img/primaria_2/coltivazione-riso.png' },
  { testo: 'Laguna',                  categoria: 'Ambienti del Delta',  img: 'img/primaria_2/laguna.png' },
  { testo: 'Valle da pesca',          categoria: 'Ambienti del Delta',  img: 'img/primaria_2/valle-da-pesca.png' },
  { testo: 'Canneto',                 categoria: 'Ambienti del Delta',  img: 'img/primaria_2/canneto.png' },
  { testo: 'Barena',                  categoria: 'Ambienti del Delta',  img: 'img/primaria_2/barena.png' },
];

const ABBINAMENTO_CATEGORIE = ["Flora", "Fauna", "Attività dell'uomo", "Ambienti del Delta"];

let abbTesseraSelezionata = null;
let abbPiazzate = 0;
let abbErrori = 0;
let abbHintCount = 0;
const ABB_HINT = "Ora tocca il gruppo corretto dove spostare la foto";
let abbTessere = [];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setHeaderBack(label, fn) {
  const btn = document.querySelector('#screen-game .btn-back');
  if (!btn) return;
  btn.onclick = fn;
  for (const node of btn.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      node.textContent = `\n      ${label}\n    `;
      break;
    }
  }
}

function placeholderFoto(size, cls) {
  return `<div class="${cls}"><svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="var(--acquamarina)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;
}
function seqProssima() {
  let prossima = -1;
  for (let n = 0; n < SEQUENZE.length; n++) {
    if (!seqCompletate.has(n)) { prossima = n; break; }
  }
  return {
    prossima,
    btnLabel: prossima !== -1 ? 'Prossima sequenza →' : 'Torna alla lista →',
    btnAction: prossima !== -1 ? `avviaSequenza(${prossima})` : 'renderListaSequenze()'
  };
}
function seqContatoreHTML() {
  return `${seqCompletate.size} <span style="font-size:32px;opacity:.5">su ${SEQUENZE.length}</span>`;
}
const SEQ_SLOT_PH = `<div style="width:100%;aspect-ratio:1/1;background:var(--acquamarina);display:flex;align-items:center;justify-content:center"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" style="opacity:.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;

function initAbbinamento() {
  abbTesseraSelezionata = null;
  abbPiazzate = 0;
  abbErrori = 0;
  abbHintCount = 0;
  abbTessere = shuffleArray(ABBINAMENTO_DATI.map((d, i) => ({ ...d, id: i, usata: false })));
  renderAbbinamento();
}

function renderAbbinamento() {
  const ABB_PLACEHOLDER = placeholderFoto(28, 'abb-placeholder');

  const ABB_ICONS = { 'Flora': 'nature', 'Fauna': 'emoji_nature', "Attività dell'uomo": 'people', 'Ambienti del Delta': 'waves' };
  const colonneHTML = ABBINAMENTO_CATEGORIE.map((cat, ci) => `
    <div class="abbinamento-colonna" id="col-${cat.replace(/[^a-z]/gi,'_')}" data-catindex="${ci}" onclick="selezionaColonnaIdx(this.dataset.catindex)">
      <div class="abbinamento-colonna-label"><span class="material-symbols-outlined abb-cat-icon">${ABB_ICONS[cat] || 'category'}</span>${cat}</div>
      <div class="abbinamento-slots" id="slots-${cat.replace(/[^a-z]/gi,'_')}">
        <div class="abbinamento-slot" id="slot-${cat.replace(/[^a-z]/gi,'_')}-0"></div>
        <div class="abbinamento-slot" id="slot-${cat.replace(/[^a-z]/gi,'_')}-1"></div>
        <div class="abbinamento-slot" id="slot-${cat.replace(/[^a-z]/gi,'_')}-2"></div>
        <div class="abbinamento-slot" id="slot-${cat.replace(/[^a-z]/gi,'_')}-3"></div>
      </div>
    </div>`).join('');

  const tessereHTML = abbTessere.map(t => `
    <div class="abbinamento-tessera ${t.usata ? 'usata' : ''}" id="tessera-${t.id}" onclick="selezionaTessera(${t.id})">
      ${t.img ? `<div class="abb-placeholder"><img src="${t.img}" alt="${t.testo}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;"></div>` : ABB_PLACEHOLDER}
      <div class="abb-testo">${t.testo}</div>
    </div>`).join('');

  document.getElementById('game-area').innerHTML = `
    <div class="abbinamento-outer">
      <div class="abbinamento-tessere-area">
        <div class="abbinamento-tessere-grid">${tessereHTML}</div>
      </div>
      <div class="abbinamento-colonne">${colonneHTML}</div>
      <div class="abbinamento-bottom">
        <div class="abbinamento-stato" id="abb-stato"></div>
        <div class="abbinamento-progresso" id="abb-progresso">${abbPiazzate} / ${ABBINAMENTO_DATI.length} abbinati</div>
      </div>
    </div>`;
}


function selezionaTessera(id) {
  suonaSeleziona();
  // Deseleziona se già selezionata
  if (abbTesseraSelezionata === id) {
    abbTesseraSelezionata = null;
    document.querySelectorAll('.abbinamento-tessera').forEach(t => t.classList.remove('selezionata'));
    return;
  }
  abbTesseraSelezionata = id;
  document.querySelectorAll('.abbinamento-tessera').forEach(t => t.classList.remove('selezionata'));
  const el = document.getElementById('tessera-' + id);
  if (el) el.classList.add('selezionata');

  // Evidenzia le colonne come target
  document.querySelectorAll('.abbinamento-colonna').forEach(c => c.classList.add('highlight'));

  document.getElementById('abb-stato').textContent = 'Ora scegli la categoria giusta →';

  if (abbHintCount < 3) {
    mostraToast('info', ABB_HINT, true);
    abbHintCount++;
  }
}

function selezionaColonnaIdx(idx) {
  selezionaColonna(ABBINAMENTO_CATEGORIE[parseInt(idx)]);
}

function selezionaColonna(categoria) {
  if (abbTesseraSelezionata === null) return;

  const tessera = abbTessere.find(t => t.id === abbTesseraSelezionata);
  const colId = 'col-' + categoria.replace(/[^a-z]/gi, '_');
  const colEl = document.getElementById(colId);

  document.querySelectorAll('.abbinamento-colonna').forEach(c => c.classList.remove('highlight'));

  if (tessera.categoria === categoria) {
    // Corretta
    tessera.usata = true;
    abbPiazzate++;

    // Trova il primo slot libero nella colonna
    const colKey = categoria.replace(/[^a-z]/gi, '_');
    let slotEl = null;
    for (let s = 0; s < 4; s++) {
      const candidate = document.getElementById(`slot-${colKey}-${s}`);
      if (candidate && !candidate.classList.contains('occupato')) { slotEl = candidate; break; }
    }
    if (slotEl) {
      slotEl.classList.add('occupato');
      const ABB_PH = tessera.img
        ? `<div class="abb-placeholder"><img src="${tessera.img}" alt="${tessera.testo}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;"></div>`
        : placeholderFoto(28, 'abb-placeholder');
      slotEl.innerHTML = `<div class="abbinamento-card-placed">${ABB_PH}<div class="abb-testo">${tessera.testo}</div></div>`;
    }

    mostraToast('ok');
    suonaCorretto();
    const tesseraEl = document.getElementById('tessera-' + tessera.id);
    if (tesseraEl) tesseraEl.classList.add('usata');

    // Controlla se categoria completa
    const inCategoria = ABBINAMENTO_DATI.filter(d => d.categoria === categoria).length;
    const occupati = colEl.querySelectorAll('.abbinamento-slot.occupato').length;
    if (occupati === inCategoria) colEl.classList.add('completa');

    if (abbPiazzate === ABBINAMENTO_DATI.length) {
      colEl.classList.add('completa');
      setTimeout(mostraRiepilogoAbbinamento, 500);
    }

    document.getElementById('abb-progresso').textContent = `${abbPiazzate} / ${ABBINAMENTO_DATI.length} abbinati`;
    document.getElementById('abb-stato').textContent = abbPiazzate === ABBINAMENTO_DATI.length ? '' : 'Ottimo! Continua così.';
    if (abbPiazzate === ABBINAMENTO_DATI.length) lancia_coriandoli_abb();

  } else {
    // Sbagliata — shake ma rimane selezionata
    const tesseraEl = document.getElementById('tessera-' + tessera.id);
    if (tesseraEl) {
      tesseraEl.classList.add('errore');
      setTimeout(() => tesseraEl.classList.remove('errore'), 500);
      // rimane selezionata e le colonne restano highlight
      document.querySelectorAll('.abbinamento-colonna').forEach(c => c.classList.add('highlight'));
    }
    abbErrori++;
    mostraToast('no');
    suonaSbagliato();
    document.getElementById('abb-stato').textContent = 'Non è quella giusta, riprova!';
    return; // non resetta abbTesseraSelezionata
  }

  abbTesseraSelezionata = null;
}

function lancia_coriandoli_abb() {
  setTimeout(esplodiCoriandoli, 200);
}

let toastTimer = null;
function mostraToast(tipo, testoCustom, silenzioso = false) {
  const old = document.querySelector('.abb-toast');
  if (old) old.remove();
  if (toastTimer) clearTimeout(toastTimer);

  if (testoCustom && !silenzioso) suonaSbagliato();

  const el = document.createElement('div');
  el.className = 'abb-toast ' + (tipo === 'ok' ? 'toast-ok' : tipo === 'info' ? 'toast-info' : 'toast-no');
  const durata = testoCustom ? 2500 : 1500;

  if (testoCustom) {
    const iconColor = tipo === 'info' ? 'var(--acquamarina)' : '#C0513A';
    el.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" style="flex-shrink:0" fill="none">
        <circle cx="12" cy="12" r="10" stroke="${iconColor}" stroke-width="2"/>
        <path d="M12 7v5" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="12" cy="16.5" r="1.2" fill="${iconColor}"/>
      </svg>
      ${testoCustom}`;
  } else if (tipo === 'ok') {
    el.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 52 52" style="flex-shrink:0">
        <circle class="tick-circle" cx="26" cy="26" r="23" fill="none" stroke="#3A8C5C" stroke-width="2.5" stroke-dasharray="145" stroke-dashoffset="145" stroke-linecap="round" style="animation:tickCircle .4s ease forwards"/>
        <path class="tick-check" d="M14 26 l8 8 l16 -16" fill="none" stroke="#3A8C5C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="36" stroke-dashoffset="36" style="animation:tickCheck .35s ease .35s forwards"/>
      </svg>
      Ottimo!`;
  } else {
    el.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 52 52" style="flex-shrink:0">
        <circle cx="26" cy="26" r="23" fill="none" stroke="#C0513A" stroke-width="2.5" stroke-dasharray="145" stroke-dashoffset="145" stroke-linecap="round" style="animation:tickCircle .4s ease forwards"/>
        <circle cx="18" cy="22" r="2.5" fill="#C0513A" opacity="0" style="animation:sadEyes .2s ease .6s forwards"/>
        <circle cx="34" cy="22" r="2.5" fill="#C0513A" opacity="0" style="animation:sadEyes .2s ease .6s forwards"/>
        <path d="M17 34 Q26 26 35 34" fill="none" stroke="#C0513A" stroke-width="3" stroke-linecap="round" stroke-dasharray="20" stroke-dashoffset="20" style="animation:tickCheck .35s ease .35s forwards"/>
      </svg>
      Ops, riprova!`;
  }

  document.body.appendChild(el);
  toastTimer = setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 300);
  }, durata);
}

function mostraRiepilogoAbbinamento() {
  let messaggio, emoji;
  if (abbErrori === 0)       { messaggio = "Perfetto! Sei un vero esperto del Delta!"; emoji = 'img/ic_feedback/feedback-1-risultato-perfetto.png'; }
  else if (abbErrori <= 2)   { messaggio = "Ottimo! Conosci benissimo il Delta del Po."; emoji = 'img/ic_feedback/feedback-2-ottimo.png'; }
  else if (abbErrori <= 4)   { messaggio = "Bene! Hai ancora qualcosa da scoprire."; emoji = 'img/ic_feedback/feedback-3-buon-risultato.png'; }
  else if (abbErrori <= 6)   { messaggio = "Ci siamo quasi! Puoi riprova per imparare di più."; emoji = 'img/ic_feedback/feedback-4-ci-siamo-quasi.png'; }
  else if (abbErrori <= 10)  { messaggio = "Il Delta ha ancora tanti segreti per te!"; emoji = 'img/ic_feedback/feedback-5-continua-ad-esplorare.png'; }
  else                        { messaggio = "Inizia da capo, il Delta ti aspetta!"; emoji = 'img/ic_feedback/feedback-6-riparti-dall-inizio.png'; }

  const erroriTesto = abbErrori === 0
    ? "Wow, Nessun errore!"
    : abbErrori === 1
      ? "Hai fatto 1 solo errore."
      : `Hai fatto ${abbErrori} errori.`;

  document.getElementById('game-area').innerHTML = `
    <div class="riepilogo-wrap">
      <div class="riepilogo-emoji"><img src="${emoji}" alt=""></div>
      <div class="riepilogo-titolo">Tutte le tessere al loro posto!</div>
      <div class="riepilogo-sottotitolo">${erroriTesto} ${messaggio}</div>
      <div class="riepilogo-azioni">
        <button class="btn-secondary" onclick="initAbbinamento()">Rigioca</button>
        <button class="btn-primary" onclick="backToSelect()">Scegli un altro gioco</button>
      </div>
    </div>`;
  if (abbErrori <= 2) setTimeout(esplodiCoriandoli, 300);
  setTimeout(suonaVittoria, 100);
}


/* ══════════════════════════════════════
   GIOCO 3 — SEQUENZE
══════════════════════════════════════ */
const SEQUENZE = [
  {
    titolo: "Dal fiume al mare",
    copertina: "img/primaria_3/A1.png",
    tessere: [
      "Il fiume Po scorre verso il mare",
      "L'acqua si divide in tanti rami",
      "Nasce il Delta",
      "L'acqua arriva nel Mare Adriatico"
    ],
    foto: ["img/primaria_3/A1.png", "img/primaria_3/A2.png", "img/primaria_3/A3.png", "img/primaria_3/A4.png"]
  },
  {
    titolo: "La giornata del pescatore",
    copertina: "img/primaria_3/B1.png",
    tessere: [
      "Il pescatore prepara la barca",
      "Raggiunge la zona di pesca",
      "Cala le reti",
      "Raccoglie il pescato"
    ],
    foto: ["img/primaria_3/B1.png", "img/primaria_3/B2.png", "img/primaria_3/B3.png", "img/primaria_3/B4.png"]
  },
  {
    titolo: "La vita di una canna palustre",
    copertina: "img/primaria_3/C1.png",
    tessere: [
      "Il seme cade nel fango",
      "Spunta una piccola pianta",
      "La canna cresce alta",
      "Tra le canne trovano rifugio gli animali"
    ],
    foto: ["img/primaria_3/C1.png", "img/primaria_3/C2.png", "img/primaria_3/C3.png", "img/primaria_3/C4.png"]
  },
  {
    titolo: "La pesca in laguna",
    copertina: "img/primaria_3/D1.png",
    tessere: [
      "Il pescatore arriva nella zona di pesca",
      "Raccoglie i molluschi con la rasca",
      "Confeziona i molluschi in sacchetti",
      "Continua la preparazione dei molluschi nel capanno"
    ],
    foto: ["img/primaria_3/D1.png", "img/primaria_3/D2.png", "img/primaria_3/D3.png", "img/primaria_3/D4.png"]
  },
  {
    titolo: "Dalla laguna alla tavola",
    copertina: "img/primaria_3/E1.png",
    tessere: [
      "Le cozze crescono nell'acqua",
      "I pescatori le raccolgono",
      "Le cozze vengono portate al mercato",
      "Le persone le cucinano"
    ],
    foto: ["img/primaria_3/E1.png", "img/primaria_3/E2.png", "img/primaria_3/E3.png", "img/primaria_3/E4.png"]
  },
  {
    titolo: "Il viaggio dell'anguilla",
    copertina: "img/primaria_3/F1.png",
    tessere: [
      "L'anguilla vive nelle acque del Delta",
      "Cresce tra canali e lagune",
      "Nuota verso il mare",
      "Inizia un lungo viaggio nell'oceano"
    ],
    foto: ["img/primaria_3/F1.png", "img/primaria_3/F2.png", "img/primaria_3/F3.png", "img/primaria_3/F4.png"]
  },
  {
    titolo: "La pesca in mare",
    copertina: "img/primaria_3/G1.png",
    tessere: [
      "Il pescatore porta la barca in mare",
      "Raccoglie il pesce con le reti",
      "Preparazione il pesce per la vendita",
      "Vende il pesce all'asta in porto"
    ],
    foto: ["img/primaria_3/G1.png", "img/primaria_3/G2.png", "img/primaria_3/G3.png", "img/primaria_3/G4.png"]
  },
  {
    titolo: "Una gita in barca nel Delta",
    copertina: "img/primaria_3/H1.png",
    tessere: [
      "I bambini salgono sulla barca",
      "La barca entra nei canali",
      "Osservano canneti e uccelli",
      "La barca ritorna al pontile"
    ],
    foto: ["img/primaria_3/H1.png", "img/primaria_3/H2.png", "img/primaria_3/H3.png", "img/primaria_3/H4.png"]
  },
  {
    titolo: "Depurazione e preparazione dei molluschi",
    copertina: "img/primaria_3/I1.png",
    tessere: [
      "I molluschi vengono lavati",
      "Vengono controllati",
      "Vengono confezionati in retine",
      "Vengono messi sottovuoto"
    ],
    foto: ["img/primaria_3/I1.png", "img/primaria_3/I2.png", "img/primaria_3/I3.png", "img/primaria_3/I4.png"]
  },
  {
    titolo: "Proteggere il Delta",
    copertina: "img/primaria_3/L1.png",
    tessere: [
      "I visitatori arrivano nel parco",
      "Camminano sui sentieri",
      "Osservano senza disturbare",
      "Portano via i rifiuti"
    ],
    foto: ["img/primaria_3/L1.png", "img/primaria_3/L3.png", "img/primaria_3/L4.png", "img/primaria_3/L2.png"]
  }
];

let seqCompletate = new Set();
let seqCorrente = null;
let seqTessereOrdinate = [];
let seqSelezionata = null;
let seqSlotCorrente = 0;

function initSequenze() {
  seqCompletate = new Set();
  renderListaSequenze();
}

function renderListaSequenze() {
  setHeaderBack('Torna ai giochi', backToSelect);
  const pl = document.getElementById('progress-label'); if (pl) pl.textContent = '';

  const cardsHTML = SEQUENZE.map((s, i) => {
    const fatta = seqCompletate.has(i);
    return `
      <div class="seq-card ${fatta ? 'completata' : ''}" onclick="avviaSequenza(${i})">
        <div class="seq-card-badge">✓</div>
        <div class="seq-card-num">Sequenza ${i + 1}</div>
        <div class="seq-card-titolo">${s.titolo}</div>
        <div class="seq-card-img-wrap">
          ${s.copertina
            ? `<img class="seq-card-img" src="${s.copertina}" alt="${s.titolo}">`
            : placeholderFoto(32, 'seq-card-placeholder')}
        </div>
        ${fatta ? `<div class="seq-card-stato fatta"><span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle">check_circle</span> Completata</div>` : ''}
      </div>`;
  }).join('');

  document.getElementById('game-area').innerHTML = `
    <div class="seq-outer">
      <div class="seq-lista">${cardsHTML}</div>
    </div>`;
}

function avviaSequenza(idx) {
  suonaSeleziona();
  seqCorrente = idx;
  seqSlotCorrente = 0;
  seqSelezionata = null;

  const originali = SEQUENZE[idx].tessere;
  const fotos = SEQUENZE[idx].foto || [];

  if (seqCompletate.has(idx)) {
    // Già completata — mostra direttamente il risultato corretto
    seqTessereOrdinate = originali.map((t, i) => ({ testo: t, ordineCorretto: i, id: i, usata: true, foto: fotos[i] || null }));
    renderGiocoSequenzaCompletata();
  } else {
    // Mescola le tessere
    seqTessereOrdinate = shuffleArray(originali.map((t, i) => ({ testo: t, ordineCorretto: i, id: i, usata: false, foto: fotos[i] || null })));
    renderGiocoSequenza();
  }
}

function renderGiocoSequenzaCompletata() {
  const seq = SEQUENZE[seqCorrente];

  const slotsHTML = seq.tessere.map((testo, i) => {
    const foto = (SEQUENZE[seqCorrente].foto || [])[i];
    const imgEl = foto
      ? `<img src="${foto}" alt="${testo}">`
      : SEQ_SLOT_PH;
    return `<div class="seq-slot occupato corretto" id="seq-slot-${i}">
      <div class="seq-card-placed">${imgEl}<div class="seq-card-played-testo seq-card-placed-testo">${testo}</div></div>
    </div>`;
  }).join('');

  const { btnLabel, btnAction } = seqProssima();
  setHeaderBack('Torna alle sequenze', renderListaSequenze);

  document.getElementById('game-area').innerHTML = `
    <div class="seq-gioco-outer">
      <div class="seq-header">
        <div class="seq-header-right">
          <div class="seq-gioco-titolo">${seq.titolo}</div>
          <div class="seq-istruzioni" style="color:#3A8C5C;font-weight:500">✓ Sequenza già completata!</div>
        </div>
        ${seqCompletate.size > 0 ? `
        <div class="seq-contatore-wrap">
          <div class="seq-contatore-num">${seqContatoreHTML()}</div>
          <div class="seq-contatore-label">sequenze completate</div>
        </div>` : '<div style="min-width:120px"></div>'}
      </div>
      <div class="seq-slots-area">
        <div class="seq-slots">${slotsHTML}</div>
      </div>
      <div class="seq-bottom">
        <button class="btn-primary" onclick="${btnAction}">${btnLabel}</button>
      </div>
    </div>`;
}

function renderGiocoSequenza() {
  const seq = SEQUENZE[seqCorrente];
  const slotsHTML = seq.tessere.map((_, i) => `
    <div class="seq-slot" id="seq-slot-${i}" onclick="selezionaSlot(${i})">
      <div class="seq-slot-num">${i + 1}</div>
    </div>`).join('');
  const tessereHTML = seqTessereOrdinate.map(t => {
    const fotoEl = t.foto
      ? `<img class="seq-tessera-img" src="${t.foto}" alt="${t.testo}">`
      : placeholderFoto(32, 'seq-tessera-placeholder');
    return `<div class="seq-tessera ${t.usata ? 'usata' : ''}" id="seq-tessera-${t.id}" onclick="selezionaTesseraSeq(${t.id})">
      ${fotoEl}
      <div class="seq-tessera-testo">${t.testo}</div>
    </div>`;
  }).join('');

  setHeaderBack('Torna alle sequenze', renderListaSequenze);

  document.getElementById('game-area').innerHTML = `
    <div class="seq-gioco-outer">
      <div class="seq-header">
        <div class="seq-header-right">
          <div class="seq-gioco-titolo">${seq.titolo}</div>
          <div class="seq-istruzioni">Tocca una tessera, poi tocca il numero giusto.</div>
        </div>
        ${seqCompletate.size > 0 ? `
        <div class="seq-contatore-wrap">
          <div class="seq-contatore-num">${seqContatoreHTML()}</div>
          <div class="seq-contatore-label">sequenze completate</div>
        </div>` : '<div style="min-width:120px"></div>'}
      </div>
      <div class="seq-slots-area">
        <div class="seq-slots">${slotsHTML}</div>
        <div class="seq-tessere">${tessereHTML}</div>
      </div>
      <div class="seq-bottom"></div>
    </div>`;
}

function selezionaTesseraSeq(id) {
  if (seqSelezionata === id) {
    seqSelezionata = null;
    document.querySelectorAll('.seq-tessera').forEach(t => t.classList.remove('selezionata'));
    document.querySelectorAll('.seq-slot').forEach(s => s.classList.remove('highlight'));
    return;
  }
  suonaSeleziona();
  seqSelezionata = id;
  document.querySelectorAll('.seq-tessera').forEach(t => t.classList.remove('selezionata'));
  document.getElementById('seq-tessera-' + id).classList.add('selezionata');
  document.querySelectorAll('.seq-slot:not(.occupato)').forEach(s => s.classList.add('highlight'));
}

function selezionaSlot(slotIdx) {
  if (seqSelezionata === null) return;

  const tessera = seqTessereOrdinate.find(t => t.id === seqSelezionata);
  const slotEl = document.getElementById('seq-slot-' + slotIdx);

  // Rimuovi highlight
  document.querySelectorAll('.seq-slot').forEach(s => s.classList.remove('highlight'));

  if (tessera.ordineCorretto === slotIdx) {
    // Corretta
    tessera.usata = true;
    suonaCorretto();

    slotEl.classList.add('occupato');
    const placedImgEl = tessera.foto
      ? `<img src="${tessera.foto}" alt="${tessera.testo}">`
      : SEQ_SLOT_PH;
    slotEl.innerHTML = `<div class="seq-card-placed">${placedImgEl}<div class="seq-card-placed-testo">${tessera.testo}</div></div>`;

    document.getElementById('seq-tessera-' + tessera.id).classList.add('usata');

    const piazzate = seqTessereOrdinate.filter(t => t.usata).length;

    if (piazzate === SEQUENZE[seqCorrente].tessere.length) {
      // Sequenza completata
      document.querySelectorAll('.seq-slot').forEach(s => s.classList.add('corretto'));
      seqCompletate.add(seqCorrente);
      suonaVittoria();
      // Aggiorna contatore nell'header
      const contatoreEl = document.querySelector('.seq-contatore-num');
      if (contatoreEl) contatoreEl.innerHTML = `${seqContatoreHTML()}`;
      const contatoreWrap = document.querySelector('.seq-contatore-wrap');
      if (!contatoreWrap) {
        const headerRight = document.querySelector('.seq-header-right');
        if (headerRight) {
          const wrap = document.createElement('div');
          wrap.className = 'seq-contatore-wrap';
          wrap.innerHTML = `<div class="seq-contatore-num">${seqContatoreHTML()}</div><div class="seq-contatore-label">sequenze completate</div>`;
          headerRight.parentElement.appendChild(wrap);
          // Remove placeholder div if present
          const placeholder = headerRight.nextElementSibling;
          if (placeholder && placeholder.tagName === 'DIV' && !placeholder.className) placeholder.remove();
        }
      }
      if (seqCompletate.size === SEQUENZE.length) {
        setTimeout(mostraRiepilogoSequenze, 600);
      } else {
        setTimeout(() => {
          esplodiCoriandoli();
          mostraToast('ok');
          const { btnLabel, btnAction } = seqProssima();
          const bottomEl = document.querySelector('.seq-bottom');
          if (bottomEl) {
            bottomEl.innerHTML = `<button class="btn-primary" onclick="${btnAction}">${btnLabel}</button>`;
          }
        }, 400);
      }
    } else {
      mostraToast('ok');
    }
  } else {
    // Sbagliata
    suonaSbagliato();
    slotEl.classList.add('sbagliato');
    setTimeout(() => slotEl.classList.remove('sbagliato'), 500);
    document.getElementById('seq-tessera-' + tessera.id).classList.remove('selezionata');
  }

  seqSelezionata = null;
}

function mostraRiepilogoSequenze() {
  document.getElementById('game-area').innerHTML = `
    <div class="riepilogo-wrap">
      <div class="riepilogo-emoji"><img src="img/ic_feedback/feedback-3-buon-risultato.png" alt=""></div>
      <div class="riepilogo-titolo">Tutte le sequenze completate!</div>
      <div class="riepilogo-sottotitolo">Conosci alla perfezione la vita del Delta del Po.</div>
      <div class="riepilogo-azioni">
        <button class="btn-secondary" onclick="initSequenze()">Rigioca</button>
        <button class="btn-primary" onclick="backToSelect()">Scegli un altro gioco</button>
      </div>
    </div>`;
  setTimeout(esplodiCoriandoli, 300);
  setTimeout(suonaVittoria, 100);
}


/* ══════════════════════════════════════
   GIOCO SEC 1 — QUIZ A TEMPO
══════════════════════════════════════ */
const QUIZ_SEC_TEMPO = 20; // secondi per domanda
const QUIZ_SEC_PUNTI_BASE = 100;
const QUIZ_SEC_PUNTI_BONUS = 50;

const QUIZ_SEC_DOMANDE = [
  {
    domanda: "Che cos'è il Delta del Po?",
    opzioni: [
      "Una pianura bonificata formata solo dall'intervento umano",
      "L'area in cui il Po si divide in rami e deposita sedimenti prima di sfociare nel mare",
      "Un tratto del fiume in cui l'acqua diventa completamente salata",
      "Una laguna separata dal fiume Po"
    ],
    corretta: 1
  },
  {
    domanda: "Quale mare riceve le acque del fiume Po?",
    opzioni: ["Mar Adriatico", "Mar Tirreno", "Mar Ligure", "Mar Ionio Settentrionale"],
    corretta: 0,
    tempo: 10
  },
  {
    domanda: "Perché il Delta del Po è importante per gli uccelli migratori?",
    opzioni: [
      "Perché offre zone umide adatte alla sosta, al nutrimento e alla nidificazione",
      "Perché ha acque profonde e fredde simili a quelle alpine",
      "Perché le correnti marine impediscono la presenza di predatori",
      "Perché la vegetazione è uniforme e facilita l'orientamento"
    ],
    corretta: 0
  },
  {
    domanda: "Quale tra questi animali è tipico delle zone umide del Delta del Po?",
    opzioni: ["Airone cenerino", "Picchio nero", "Marmotta delle Alpi", "Coturnice comune"],
    corretta: 0
  },
  {
    domanda: "Che cosa sono le 'valli da pesca'?",
    opzioni: [
      "Aree lagunari o salmastre delimitate e gestite per la pesca e l'allevamento ittico",
      "Antichi rami fluviali completamente prosciugati e coltivati a cereali",
      "Canali artificiali usati solo per il trasporto delle barche",
      "Tratti di mare aperto riservati alla pesca industriale"
    ],
    corretta: 0
  },
  {
    domanda: "Quale pianta è molto diffusa lungo canali, paludi e zone umide?",
    opzioni: ["Salicornia", "Canna di palude", "Pino mugo", "Ginestra odorosa"],
    corretta: 1,
    tempo: 10
  },
  {
    domanda: "Che cosa significa 'acqua salmastra'?",
    opzioni: [
      "Acqua dolce arricchita artificialmente con sali minerali",
      "Acqua marina diluita dalla pioggia ma non collegata ai fiumi",
      "Acqua con caratteristiche intermedie tra dolce e salata",
      "Acqua stagnante povera di ossigeno e ricca di alghe"
    ],
    corretta: 2
  },
  {
    domanda: "Quale attività economica tradizionale è legata al Delta del Po?",
    opzioni: [
      "Pesca, acquacoltura e raccolta di molluschi nelle lagune e nelle valli",
      "Coltivazione del riso nelle aree arginate più interne",
      "Turismo naturalistico lungo canali, argini e oasi",
      "Cantieristica e manutenzione delle imbarcazioni nei centri costieri"
    ],
    corretta: 0
  },
  {
    domanda: "Perché il Delta del Po è un ambiente fragile?",
    opzioni: [
      "Perché il paesaggio dipende dall'equilibrio tra sedimenti fluviali, maree, subsidenza e attività umane",
      "Perché la vegetazione naturale impedisce al fiume di depositare sedimenti",
      "Perché le acque salmastre eliminano quasi tutte le forme di vita",
      "Perché le dune costiere bloccano completamente l'erosione marina"
    ],
    corretta: 0
  },
  {
    domanda: "Quale comportamento è più corretto durante una visita naturalistica nel Delta?",
    opzioni: [
      "Restare sui percorsi indicati, osservare senza disturbare e non raccogliere organismi o reperti",
      "Avvicinarsi lentamente ai nidi per fotografarli senza usare il flash",
      "Raccogliere piccole quantità di piante comuni per riconoscerle meglio in classe",
      "Dare cibo agli animali solo se sembrano abituati alla presenza umana"
    ],
    corretta: 0
  }
];

let qsIndex = 0;
let qsPunteggio = 0;
let qsRisposte = [];
let qsStato = 'domanda';
let qsSbagliate = new Set();
let qsShuffled = [];
let qsTimerInterval = null;
let qsTempoRimasto = QUIZ_SEC_TEMPO;
let qsTempoMax = QUIZ_SEC_TEMPO;
let qsTempoRisposta = QUIZ_SEC_TEMPO;

function initQuizSec() {
  qsIndex = 0;
  qsPunteggio = 0;
  qsRisposte = [];
  qsStato = 'domanda';
  qsSbagliate = new Set();
  qsShuffled = QUIZ_SEC_DOMANDE.map(q => {
    const indices = q.opzioni.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return {
      ...q,
      opzioni: indices.map(i => q.opzioni[i]),
      corretta: indices.indexOf(q.corretta)
    };
  });
  renderQuizSec();
}

function buildStepperSec() {
  const total = QUIZ_SEC_DOMANDE.length;
  let html = '';
  for (let i = 0; i < total; i++) {
    const cls = i < qsIndex ? 'done' : i === qsIndex ? 'current' : 'todo';
    const label = i < qsIndex ? '✓' : (i + 1);
    html += `<div class="quiz-step ${cls}">${label}</div>`;
    if (i < total - 1) html += `<div class="quiz-step-line ${i < qsIndex ? 'done' : ''}"></div>`;
  }
  return html;
}

function renderQuizSec() {
  qsStopTimer();
  const q = qsShuffled[qsIndex];
  const lettere = ['A', 'B', 'C', 'D'];

  const qsTempoMax = q.tempo || QUIZ_SEC_TEMPO;

  document.getElementById('game-area').innerHTML = `
    <div class="quiz-outer">
      <div class="quiz-stepper">${buildStepperSec()}</div>
      <div class="qs-timer-inline">
        <div style="width:100px"></div>
        <div class="qs-timer-circle-wrap">
          <svg class="qs-timer-svg" viewBox="0 0 100 100">
            <circle class="qs-timer-track" cx="50" cy="50" r="40"/>
            <circle class="qs-timer-arc" id="qs-arc" cx="50" cy="50" r="40"/>
          </svg>
          <div class="qs-timer-text">
            <span class="qs-timer-num" id="qs-count">${qsTempoMax}</span>
            <span class="qs-timer-label">secondi</span>
          </div>
        </div>
        <div style="width:100px"></div>
      </div>
      <div class="quiz-wrap">
        <div class="quiz-top">
          <div class="quiz-domanda">${q.domanda}</div>
        </div>
        <div class="quiz-middle">
          <div class="quiz-opzioni" id="quiz-opzioni">
            ${q.opzioni.map((op, i) => `
              <button class="quiz-opzione" id="opzione-${i}" onclick="rispondiSec(${i})">
                <span class="quiz-lettera">${lettere[i]}</span>
                <span class="quiz-testo">${op}</span>
              </button>`).join('')}
          </div>
        </div>
        <div class="quiz-bottom" id="quiz-bottom"></div>
      </div>
    </div>`;

  qsAvviaTimer();
}


function qsAvviaTimer() {
  const q = qsShuffled[qsIndex];
  qsTempoMax = Math.round((q.tempo || QUIZ_SEC_TEMPO) * qsVelMultiplier);
  qsTempoRimasto = qsTempoMax;
  qsAggiornaBarra();
  qsTimerInterval = setInterval(() => {
    qsTempoRimasto -= 0.1;
    qsAggiornaBarra();
    if (qsTempoRimasto <= 0) {
      qsStopTimer();
      qsTempoScaduto();
    }
  }, 100);
}

function qsStopTimer() {
  if (qsTimerInterval) { clearInterval(qsTimerInterval); qsTimerInterval = null; }
}

function qsAggiornaBarra() {
  const pct = Math.max(0, (qsTempoRimasto / qsTempoMax) * 100);
  const warning = qsTempoRimasto <= 5;
  // Tick ogni secondo negli ultimi 5
  if (warning && Math.ceil(qsTempoRimasto) !== Math.ceil(qsTempoRimasto + 0.1)) {
    suonaTickTock();
  }

  // Header timer (se visibile)
  const bar = document.getElementById('qs-timer-bar');
  const label = document.getElementById('qs-timer-label');
  if (bar) { bar.style.width = pct + '%'; bar.className = 'quiz-timer-bar' + (warning ? ' warning' : ''); }
  if (label) { label.textContent = Math.ceil(qsTempoRimasto); label.className = 'quiz-timer-label' + (warning ? ' warning' : ''); }

  // Circular timer
  const arc = document.getElementById('qs-arc');
  const count = document.getElementById('qs-count');
  const circumference = 251.2;
  if (arc) {
    arc.style.strokeDashoffset = circumference * (1 - pct / 100);
    arc.className = 'qs-timer-arc' + (warning ? ' warning' : '');
  }
  if (count) {
    count.textContent = Math.ceil(qsTempoRimasto);
    count.className = 'qs-timer-num' + (warning ? ' warning' : '');
  }
}

function qsTempoScaduto() {
  if (qsStato === 'feedback') return;
  qsStato = 'feedback';
  suonaTempoScaduto();
  qsRisposte.push({ corretta: false, punti: 0 });
  qsSbagliate.add(qsIndex);

  document.querySelectorAll('.quiz-opzione').forEach((btn, i) => {
    btn.disabled = true;
    if (i === qsShuffled[qsIndex].corretta) btn.classList.add('corretta');
    else btn.classList.add('disabilitata');
  });

  suonaSbagliato();
  const bottom = document.getElementById('quiz-bottom');
  const isUltima = qsIndex === QUIZ_SEC_DOMANDE.length - 1;
  bottom.innerHTML = `
    <div class="quiz-feedback quiz-feedback-no">
      <div class="sad-wrap"><svg class="sad-svg" viewBox="0 0 52 52">
        <circle class="sad-circle" cx="26" cy="26" r="23"/>
        <circle class="sad-eye-l" cx="18" cy="22" r="2.5"/>
        <circle class="sad-eye-r" cx="34" cy="22" r="2.5"/>
        <path class="sad-mouth" d="M17 34 Q26 26 35 34"/>
      </svg></div>
      Tempo scaduto! La risposta corretta era: <strong>${['A','B','C','D'][qsShuffled[qsIndex].corretta]}. ${qsShuffled[qsIndex].opzioni[qsShuffled[qsIndex].corretta]}</strong>.
    </div>
    <div class="quiz-btn-wrap">
      <button class="btn-primary" onclick="${isUltima ? 'mostraRiepilogoSec()' : 'prossimaDomandaSec()'}">${isUltima ? 'Vedi il risultato →' : 'Prossima domanda →'}</button>
    </div>`;
}

function rispondiSec(idx) {
  if (qsStato === 'feedback') return;
  suonaSeleziona();

  const q = qsShuffled[qsIndex];
  const corretta = idx === q.corretta;
  const bottom = document.getElementById('quiz-bottom');

  if (corretta) {
    qsStopTimer();
    qsStato = 'feedback';

    // Calcola punteggio
    const bonusVelocita = Math.round((qsTempoRimasto / qsTempoMax) * QUIZ_SEC_PUNTI_BONUS * qsScoreMult);
    const puntiDomanda = Math.round(QUIZ_SEC_PUNTI_BASE * qsScoreMult) + bonusVelocita;
    qsPunteggio += puntiDomanda;
    qsRisposte.push({ corretta: true, punti: puntiDomanda });
    suonaCorretto();



    document.querySelectorAll('.quiz-opzione').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.corretta) btn.classList.add('corretta');
      else btn.classList.add('disabilitata');
    });

    const isUltima = qsIndex === QUIZ_SEC_DOMANDE.length - 1;
    bottom.innerHTML = `
      <div class="quiz-feedback quiz-feedback-ok">
        <div class="tick-wrap"><svg class="tick-svg" viewBox="0 0 52 52">
          <circle class="tick-circle" cx="26" cy="26" r="23"/>
          <path class="tick-check" d="M14 26 l8 8 l16 -16"/>
        </svg></div>
        Risposta esatta! Hai guadagnato ${QUIZ_SEC_PUNTI_BASE} punti + ${bonusVelocita} punti di velocità.
      </div>
      <div class="quiz-btn-wrap">
        <button class="btn-primary" onclick="${isUltima ? 'mostraRiepilogoSec()' : 'prossimaDomandaSec()'}">${isUltima ? 'Vedi il risultato →' : 'Prossima domanda →'}</button>
      </div>`;

  } else {
    qsStato = 'feedback';
    qsSbagliate.add(qsIndex);

    const btnSbagliato = document.getElementById('opzione-' + idx);
    btnSbagliato.classList.add('sbagliata');
    btnSbagliato.disabled = true;
    suonaSbagliato();

    bottom.innerHTML = `
      <div class="quiz-feedback quiz-feedback-no">
        <div class="sad-wrap"><svg class="sad-svg" viewBox="0 0 52 52">
          <circle class="sad-circle" cx="26" cy="26" r="23"/>
          <circle class="sad-eye-l" cx="18" cy="22" r="2.5"/>
          <circle class="sad-eye-r" cx="34" cy="22" r="2.5"/>
          <path class="sad-mouth" d="M17 34 Q26 26 35 34"/>
        </svg></div>
        Non è quella giusta. Riprova!
      </div>
      <div class="quiz-btn-wrap quiz-btn-wrap-sbagliata">
        <button class="btn-link-secondario" onclick="mostraRispostaCorretta_sec()">Mostra la risposta</button>
        <button class="btn-primary" onclick="riprovaSec()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Riprova
        </button>
      </div>`;
  }
}

function riprovaSec() {
  qsStato = 'domanda';
  document.querySelectorAll('.quiz-opzione').forEach(btn => {
    if (!btn.classList.contains('sbagliata')) btn.disabled = false;
  });
  const bottom = document.getElementById('quiz-bottom');
  if (bottom) bottom.innerHTML = '';
}

function mostraRispostaCorretta_sec() {
  qsStopTimer();
  const q = qsShuffled[qsIndex];
  qsRisposte.push({ corretta: false, punti: 0 });

  document.querySelectorAll('.quiz-opzione').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.corretta) btn.classList.add('corretta');
    else if (!btn.classList.contains('sbagliata')) btn.classList.add('disabilitata');
  });

  const bottom = document.getElementById('quiz-bottom');
  if (bottom) bottom.innerHTML = '';

  const isUltima = qsIndex === QUIZ_SEC_DOMANDE.length - 1;
  bottom.innerHTML = `
    <div class="quiz-feedback quiz-feedback-no">
      <div class="sad-wrap"><svg class="sad-svg" viewBox="0 0 52 52">
        <circle class="sad-circle" cx="26" cy="26" r="23"/>
        <circle class="sad-eye-l" cx="18" cy="22" r="2.5"/>
        <circle class="sad-eye-r" cx="34" cy="22" r="2.5"/>
        <path class="sad-mouth" d="M17 34 Q26 26 35 34"/>
      </svg></div>
      La risposta corretta era: <strong>${['A','B','C','D'][q.corretta]}. ${q.opzioni[q.corretta]}</strong>.
    </div>
    <div class="quiz-btn-wrap">
      <button class="btn-primary" onclick="${isUltima ? 'mostraRiepilogoSec()' : 'prossimaDomandaSec()'}">${isUltima ? 'Vedi il risultato →' : 'Prossima domanda →'}</button>
    </div>`;
}

function prossimaDomandaSec() {
  qsIndex++;
  qsStato = 'domanda';
  renderQuizSec();
}

async function mostraRiepilogoSec() {
  qsStopTimer();
  giochiCompletati.add('quiz-sec');
  const maxPunti = QUIZ_SEC_DOMANDE.length * Math.round((QUIZ_SEC_PUNTI_BASE + QUIZ_SEC_PUNTI_BONUS) * qsScoreMult);
  const pct = Math.round((qsPunteggio / maxPunti) * 100);

  let titolo, sottotitolo, emoji;
  if (pct === 100)     { titolo = "Punteggio perfetto!"; sottotitolo = "Sei un vero esperto del Delta — e velocissimo!"; emoji = 'img/ic_feedback/feedback-1-risultato-perfetto.png'; }
  else if (pct >= 80)  { titolo = "Ottimo risultato!"; sottotitolo = "Conosci benissimo il Delta del Po."; emoji = 'img/ic_feedback/feedback-2-ottimo.png'; }
  else if (pct >= 60)  { titolo = "Buon risultato!"; sottotitolo = "Hai ancora qualcosa da scoprire."; emoji = 'img/ic_feedback/feedback-3-buon-risultato.png'; }
  else if (pct >= 40)  { titolo = "Ci siamo quasi!"; sottotitolo = "Riprova e migliora il tuo punteggio."; emoji = 'img/ic_feedback/feedback-4-ci-siamo-quasi.png'; }
  else if (pct > 0)    { titolo = "Continua a esplorare!"; sottotitolo = "Il Delta ha ancora tanti segreti per te."; emoji = 'img/ic_feedback/feedback-5-continua-ad-esplorare.png'; }
  else                  { titolo = "Riparti dall'inizio!"; sottotitolo = "Il Delta del Po ti aspetta."; emoji = 'img/ic_feedback/feedback-6-riparti-dall-inizio.png'; }

  const badge = document.getElementById('fascia-badge');
  if (badge) { badge.textContent = 'Secondaria · 11–14 anni'; badge.style.display = ''; }

  document.getElementById('game-area').innerHTML = `
    <div class="riepilogo-wrap">
      <div class="riepilogo-emoji"><img src="${emoji}" alt=""></div>
      <div class="riepilogo-titolo">${titolo}</div>
      <div class="riepilogo-sottotitolo">${sottotitolo}</div>
      <div class="riepilogo-score-label">Il tuo punteggio è</div>
      <div class="riepilogo-punteggio">
        <span class="riepilogo-punti">${qsPunteggio}</span>
      </div>
      <div style="font-size:14px;color:var(--testo-medio);margin-top:-8px">su ${maxPunti} punti possibili</div>
      ${profiloCorrente.partecipa ? `<button class="btn-link-secondario" onclick="mostraLeaderboard('quiz-sec', ${qsPunteggio})">🏆 Guarda la classifica</button>` : ''}
      <div class="riepilogo-azioni">
        <button class="btn-secondary" onclick="initQuizSec()">Gioca di nuovo</button>
        <button class="btn-primary" onclick="backToSelect()">Scegli un altro gioco</button>
      </div>
    </div>`;

  if (pct >= 80) { setTimeout(esplodiCoriandoli, 300); setTimeout(suonaVittoria, 100); }

  salvaInClassifica('quiz-sec', qsPunteggio).catch(console.error);
}


/* ══════════════════════════════════════
   PROFILO & LEADERBOARD
══════════════════════════════════════ */
let currentFascia = 'primaria';
let profiloCorrente = { nome: null, avatar: null, partecipa: false };

function renderSelectBody() {
  const fasciaNome = currentFascia === 'primaria'
    ? 'Scuola Primaria · 6–10 anni'
    : 'Scuola Secondaria · 11–14 anni';
  const giochi = currentFascia === 'primaria' ? GIOCHI_PRIMARIA : GIOCHI_SECONDARIA;
  const body = document.getElementById('select-body');
  if (!body) return;
  const cardsHTML = giochi.map(g => {
    const lbKey = g.leaderboard;
    const lbLink = (lbKey && profiloCorrente.partecipa && giochiCompletati.has(lbKey))
      ? `<button class="btn-link-secondario" style="font-size:13px;padding:0" onclick="event.stopPropagation();mostraLeaderboardDaLista('${lbKey}')">🏆 Guarda la classifica</button>`
      : '';
    return `
      <div class="game-card" onclick="startGame('${g.tipo}')">
        ${g.img ? `<div class="game-card-img-wrap"><img src="${g.img}" alt="${g.titolo}"></div>` : `<div class="game-card-icon"><span class="material-symbols-outlined">${g.icon}</span></div>`}
        <div class="game-card-num">${g.num}</div>
        <div class="game-card-title">${g.titolo}</div>
        <div class="game-card-desc">${g.desc}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">
          <div class="card-cta">Inizia →</div>
          ${lbLink}
        </div>
      </div>`;
  }).join('');
  body.innerHTML = `
    <div class="select-intro">
      <div class="select-intro-titolo">I giochi del Delta</div>
      <div class="select-intro-sottotitolo">${fasciaNome}</div>
      <div class="select-intro-hint">Se hai visitato la mostra conosci già le risposte!</div>
    </div>
    <div class="select-cards-grid">${cardsHTML}</div>`;
}

function goToSelect(fascia) {
  currentFascia = fascia;
  const badge = document.getElementById('select-badge');
  if (badge) badge.textContent = fascia === 'primaria'
    ? 'Scuola Primaria · 6–10 anni'
    : 'Scuola Secondaria · 11–14 anni';
  renderSelectBody();
  const selectChip = document.getElementById('select-profilo-chip');
  const selectChipAv = document.getElementById('select-chip-avatar');
  const selectChipNm = document.getElementById('select-chip-nome');
  if (fascia === 'secondaria' && profiloCorrente.partecipa) {
    if (selectChip) selectChip.style.display = 'flex';
    if (selectChipAv) selectChipAv.innerHTML = `<img src="${profiloCorrente.avatar || 'img/avatar/teen_avatar_01.png'}" style="width:100%;height:100%;object-fit:cover;">`;
    if (selectChipNm) selectChipNm.textContent = profiloCorrente.nome;
  } else {
    if (selectChip) selectChip.style.display = 'none';
  }
  if (fascia === 'secondaria' && !profiloCorrente.nome && !profiloCorrente._saltato) {
    showScreen('screen-profilo');
  } else {
    showScreen('screen-select');
  }
}

function backToSelect() {
  qsStopTimer();
  renderSelectBody();
  showScreen('screen-select');
}

function profiloAggiorna() {
  // validation handled in entraInClassifica
}

function selezionaAvatar(avatar, el) {
  suonaSeleziona();
  document.querySelectorAll('.profilo-avatar').forEach(a => a.classList.remove('selezionato'));
  el.classList.add('selezionato');
  profiloCorrente.avatar = avatar;
}

function entraInClassifica() {
  const nome = document.getElementById('profilo-nome')?.value.trim();
  const avatarScelto = profiloCorrente.avatar;
  if (!nome && !avatarScelto) { mostraToast('no', 'Per entrare in classifica scegli nickname e avatar'); return; }
  if (!nome) { mostraToast('no', 'Per entrare in classifica scegli un nickname'); return; }
  if (!avatarScelto) { mostraToast('no', 'Per entrare in classifica scegli un avatar'); return; }
  profiloCorrente.nome = nome;
  profiloCorrente.partecipa = true;
  profiloCorrente._saltato = false;
  suonaSeleziona();
  // Aggiorna chip nella select screen
  const selectChip = document.getElementById('select-profilo-chip');
  const selectChipAv = document.getElementById('select-chip-avatar');
  const selectChipNm = document.getElementById('select-chip-nome');
  if (selectChip) selectChip.style.display = 'flex';
  if (selectChipAv) selectChipAv.innerHTML = `<img src="${profiloCorrente.avatar || 'img/avatar/teen_avatar_01.png'}" style="width:100%;height:100%;object-fit:cover;">`;
  if (selectChipNm) selectChipNm.textContent = profiloCorrente.nome;
  showScreen('screen-select');
}

function saltaClassifica() {
  profiloCorrente = { nome: null, avatar: null, partecipa: false, _saltato: true };
  showScreen('screen-select');
}

async function salvaInClassifica(gioco, punti) {
  if (!profiloCorrente.partecipa) return;
  await fbSalva(gioco, profiloCorrente.nome, profiloCorrente.avatar, punti);
}

function mostraLeaderboardDaLista(gioco) {
  showScreen('screen-game');
  const titles = { 'quiz-sec': 'Quiz a Tempo', 'gestisci': 'Gestisci il Delta', 'viaggio': 'In viaggio nel Delta' };
  document.getElementById('game-header-title').textContent = titles[gioco] || gioco;
  aggiornaFasciaBadge();
  mostraLeaderboard(gioco, null).catch(console.error);
}

function rigiocaGioco(gioco) {
  if (gioco === 'quiz-sec') { mostraSchermataVelocita(); }
  else if (gioco === 'gestisci') {
    document.getElementById('game-header-title').textContent = 'Gestisci il Delta';
    aggiornaFasciaBadge();
    initGestisci();
  }
}

async function mostraLeaderboard(gioco, puntiCorrente) {
  const titoloGioco = { 'quiz-sec': 'Quiz a Tempo', 'gestisci': 'Gestisci il Delta', 'viaggio': 'In viaggio nel Delta' }[gioco] || gioco;

  document.getElementById('game-area').innerHTML = `
    <div class="leaderboard-wrap">
      <div class="leaderboard-header">
        <div class="leaderboard-titolo">🏆 Classifica — ${titoloGioco}</div>
      </div>
      <div class="leaderboard-lista"><div class="lb-fuori-top">Caricamento…</div></div>
    </div>`;

  let lista;
  try {
    lista = await fbLeggi(gioco);
  } catch (e) {
    document.querySelector('.leaderboard-lista').innerHTML = '<div class="lb-fuori-top">Errore nel caricamento. Riprova.</div>';
    console.error(e);
    return;
  }

  // Trova posizione corrente: l'ultima entry aggiunta con stesso nome e punti
  let posizioneCorrente = -1;
  if (profiloCorrente.partecipa && puntiCorrente !== null) {
    let latestDate = null;
    for (let i = 0; i < lista.length; i++) {
      const r = lista[i];
      if (r.nome === profiloCorrente.nome && r.punti === puntiCorrente) {
        if (latestDate === null || new Date(r.created_at) > latestDate) {
          latestDate = new Date(r.created_at);
          posizioneCorrente = i;
        }
      }
    }
  }

  const top10 = lista.slice(0, 10);

  const righeHTML = top10.map((r, i) => {
    const isCorrente = profiloCorrente.partecipa && i === posizioneCorrente;
    return `<div class="lb-riga ${isCorrente ? 'lb-corrente' : ''}">
      <div class="lb-pos">${i + 1}</div>
      <div class="lb-avatar"><img src="${r.avatar || 'img/avatar/teen_avatar_01.png'}" style="width:100%;height:100%;object-fit:cover;"></div>
      <div class="lb-nome">${r.nome} ${isCorrente ? '<span class="lb-corrente-badge">Tu</span>' : ''}</div>
      <div style="text-align:right">
        <div class="lb-punti">${r.punti}</div>
        <div class="lb-punti-label">punti</div>
      </div>
    </div>`;
  }).join('');

  let fuoriTopHTML = '';
  if (profiloCorrente.partecipa && posizioneCorrente >= 10) {
    fuoriTopHTML = `<div class="lb-fuori-top">… sei al <strong>${posizioneCorrente + 1}° posto</strong> su ${lista.length} giocatori</div>`;
  }

  document.getElementById('game-area').innerHTML = `
    <div class="leaderboard-wrap">
      <div class="leaderboard-header">
        <div class="leaderboard-titolo">🏆 Classifica — ${titoloGioco}</div>
        <div class="leaderboard-sottotitolo">${lista.length} giocator${lista.length === 1 ? 'e' : 'i'} in totale</div>
      </div>
      <div class="leaderboard-lista">
        ${lista.length === 0 ? '<div class="lb-fuori-top">Nessun punteggio ancora. Sii il primo!</div>' : righeHTML}
        ${fuoriTopHTML}
      </div>
      <div class="leaderboard-azioni">
        ${puntiCorrente !== null ? `<button class="btn-secondary" onclick="rigiocaGioco('${gioco}')">Gioca di nuovo</button>` : ''}
        <button class="btn-primary" onclick="backToSelect()">Torna ai giochi</button>
      </div>
    </div>`;
}



/* ══════════════════════════════════════
   ISTRUZIONI
══════════════════════════════════════ */
let _currentGiocoType = 'quiz';

const ISTRUZIONI = {
  'quiz': {
    label: 'Quiz del Delta',
    steps: [
      'Leggi la domanda e osserva le immagini.',
      'Scegli la risposta giusta tra le quattro opzioni.',
      "Hai una sola possibilità per domanda — pensa bene prima di rispondere!",
      'Alla fine scopri quante ne hai azzeccate.'
    ]
  },
  'abbinamento': {
    label: 'Metti al posto giusto',
    steps: [
      'Seleziona una tessera tra le 16 figure in alto',
      "Scegli la categoria corretta tra Flora, Fauna, Attività dell'uomo e Ambienti del Delta.",
      "Se l'abbinamento è giusto, la tessera si sposta nella colonna!",
      'Abbina tutte e 16 le tessere per completare il gioco.'
    ]
  },
  'sequenze': {
    label: 'Rimetti in ordine',
    steps: [
      'Scegli una storia del Delta dalla lista.',
      "Osserva le 4 immagini mescolate — devi rimetterle nell'ordine corretto.",
      "Tocca un'immagine per selezionarla, poi tocca lo spazio numerato dove vuoi posizionarla.",
      'Completa tutte le sequenze per finire il gioco!'
    ]
  },
  'quiz-sec': {
    label: 'Quiz a Tempo',
    steps: [
      'Ogni domanda ha un conto alla rovescia — rispondi prima che scada il tempo!',
      'Più sei veloce, più punti guadagni. Una risposta lenta vale meno.',
      'Sbagliare costa punti: rifletti prima di toccare.',
      'Alla fine il tuo punteggio entra in classifica. Puoi batterti con gli altri?'
    ]
  },
  'gestisci': {
    label: 'Gestisci il Delta',
    steps: [
      'Ogni tentativo ti viene presentata una situazione reale del Delta del Po.',
      'Devi prendere una decisione che influenza natura, economia e comunità.',
      'Non esiste una scelta perfetta: ogni azione ha conseguenze!',
      "Cerca l'equilibrio tra i tre indicatori per tenere il Delta in salute."
    ]
  },
  'viaggio': {
    label: 'In viaggio nel Delta',
    steps: [
      'Scegli un percorso sulla mappa del Delta.',
      'Rispondi correttamente alle domande per avanzare di tappa.',
      'Se sbagli una volta, stai fermo. Se sbagli più volte, torni indietro. Quindi più sei preciso, più lontano arrivi!',
      "Raggiungi l'ultima tappa per completare il percorso."
    ]
  }
};

function mostraIstruzioni() {
  const overlay = document.getElementById('istruzioni-overlay');
  const label = document.getElementById('istruzioni-gioco-label');
  const steps = document.getElementById('istruzioni-steps');
  const data = ISTRUZIONI[_currentGiocoType] || ISTRUZIONI['quiz'];
  label.textContent = data.label;
  steps.innerHTML = data.steps.map((s, i) => `
    <div class="istruzioni-step">
      <div class="istruzioni-num">${i + 1}</div>
      <div class="istruzioni-testo">${s}</div>
    </div>`).join('');
  overlay.classList.add('aperta');
}

function chiudiIstruzioni(e) {
  if (e && e.target !== document.getElementById('istruzioni-overlay')) return;
  document.getElementById('istruzioni-overlay').classList.remove('aperta');
}

function apriCrediti() {
  document.getElementById('crediti-overlay').classList.add('aperta');
}
function chiudiCrediti(e) {
  if (e && e.target !== document.getElementById('crediti-overlay')) return;
  document.getElementById('crediti-overlay').classList.remove('aperta');
}

/* ══════════════════════════════════════
   SCHERMATA VELOCITÀ
══════════════════════════════════════ */
const VEL_LIVELLI = [
  { step: 0, emoji: 'img/ic_velocity_chill.png', label: 'Chill', desc: 'Gioca senza fretta', mult: 1.5, scoreMult: 0.75 },
  { step: 1, emoji: 'img/ic_velocity_standard.png', label: 'Standard', desc: 'Il ritmo equilibrato', mult: 1.0, scoreMult: 1.0 },
  { step: 2, emoji: 'img/ic_velocity_flash.png', label: 'Sprint', desc: 'Più ritmo, più adrenalina', mult: 0.7, scoreMult: 1.3 },
  { step: 3, emoji: 'img/ic_velocity_turbo.png', label: 'Turbo', desc: 'Massima velocità', mult: 0.5, scoreMult: 1.75 },
];
let velStep = 1; // default: Camminatore
let velDragging = false;
let qsVelMultiplier = 1.0;
let qsScoreMult = 1.0;

function mostraSchermataVelocita() {
  showScreen('screen-velocita');
  velStep = 1;
  velAggiorna();
}

function velAggiorna() {
  const pct = velStep / (VEL_LIVELLI.length - 1);
  const fill = document.getElementById('vel-fill');
  const thumb = document.getElementById('vel-thumb');
  const emoji = document.getElementById('vel-emoji');
  const label = document.getElementById('vel-label');
  const tempo = document.getElementById('vel-tempo');
  const lv = VEL_LIVELLI[velStep];

  if (fill) fill.style.width = (pct * 100) + '%';
  if (thumb) thumb.style.left = (pct * 100) + '%';
  if (emoji) { emoji.src = lv.emoji; emoji.style.animation = 'none'; requestAnimationFrame(() => emoji.style.animation = ''); }
  if (label) label.textContent = lv.label;
  if (tempo) tempo.textContent = lv.desc || '';
  const detail = document.getElementById('vel-detail');
  if (detail) {
    const baseS = Math.round(20 * lv.mult);
    const maxPts = Math.round((100 + 50) * lv.scoreMult);
    detail.textContent = `~${baseS} sec · fino a ${maxPts} punti a domanda`;
  }
}

function velClickTrack(e) {
  const track = document.getElementById('vel-track');
  const rect = track.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  velStep = Math.round(pct * (VEL_LIVELLI.length - 1));
  suonaSeleziona();
  velAggiorna();
}

function velStartDrag(e) {
  velDragging = true;
  e.preventDefault();
  document.addEventListener('pointermove', velOnDrag);
  document.addEventListener('pointerup', velStopDrag);
}

function velOnDrag(e) {
  if (!velDragging) return;
  const track = document.getElementById('vel-track');
  const rect = track.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const newStep = Math.round(pct * (VEL_LIVELLI.length - 1));
  if (newStep !== velStep) { velStep = newStep; suonaSeleziona(); velAggiorna(); }
}

function velStopDrag() {
  velDragging = false;
  document.removeEventListener('pointermove', velOnDrag);
  document.removeEventListener('pointerup', velStopDrag);
}

function avviaQuizConVelocita() {
  qsVelMultiplier = VEL_LIVELLI[velStep].mult;
  qsScoreMult = VEL_LIVELLI[velStep].scoreMult;
  showScreen('screen-game');
  const titles = { quiz: 'Quiz del Delta', abbinamento: 'Metti al posto giusto', sequenze: 'Rimetti in ordine', 'quiz-sec': 'Quiz a Tempo' };
  document.getElementById('game-header-title').textContent = titles['quiz-sec'];
  aggiornaFasciaBadge();
  initQuizSec();
}


/* ══════════════════════════════════════
   GIOCO SEC 2 — GESTISCI IL DELTA
══════════════════════════════════════ */
const GESTISCI_SCENARI = [
  {
    situazione: "In una valle da pesca alcune specie di uccelli nidificano <br> vicino alle zone usate dai pescatori.",
    scelte: [
      { label: "A", testo: "Limitare temporaneamente l'accesso durante la nidificazione", conseguenza: "Le zone di nidificazione vengono protette. Gli uccelli tornano a popolare la valle, ma i pescatori protestano per le restrizioni.", effetti: {biodiversita: +15, economia: -5, consenso: -5} },
      { label: "B", testo: "Lasciare l'accesso libero tutto l'anno", conseguenza: "I pescatori lavorano senza interruzioni. Ma i nidi vengono abbandonati e alcune specie spariscono dalla zona.", effetti: {economia: +5, consenso: +5, biodiversita: -15} },
      { label: "C", testo: "Creare zone alternate: alcune protette, altre accessibili", conseguenza: "Un compromesso intelligente: gli uccelli nidificano in pace e i pescatori continuano a lavorare nelle aree libere.", effetti: {biodiversita: +10, economia: +5, consenso: +10} }
    ]
  },
  {
    situazione: "Un'area umida è invasa da rifiuti portati dal fiume e dal mare.",
    scelte: [
      { label: "A", testo: "Organizzare una giornata di pulizia con scuole e associazioni", conseguenza: "Scuole e volontari ripuliscono l'area. L'acqua torna limpida e la comunità si sente parte del territorio.", effetti: {qualita_acqua: +10, biodiversita: +5, consenso: +15} },
      { label: "B", testo: "Rimuovere solo i rifiuti più visibili vicino ai percorsi turistici", conseguenza: "I percorsi turistici sembrano puliti, ma i fondali e le zone nascoste restano inquinati.", effetti: {consenso: +5, qualita_acqua: +3} },
      { label: "C", testo: "Rimandare l'intervento per mancanza di fondi", conseguenza: "I rifiuti si accumulano. La qualità dell'acqua peggiora e gli animali soffrono gli effetti dell'inquinamento.", effetti: {qualita_acqua: -10, biodiversita: -5, consenso: -10} }
    ]
  },
  {
    situazione: "Alcuni pescatori chiedono di pescare di più in una stagione favorevole.",
    aiuto: {
      prompt: "Non sai cosa sono le quote di pesca?",
      cta: "Scoprilo qui",
      titolo: "Le quote di pesca",
      testo: `Immagina un lago con 1000 pesci. Se ogni anno i pescatori ne catturano 200, il lago riesce a "ricrescere" — i pesci si riproducono e il numero rimane stabile. Ma se ne catturano 600, i pesci non fanno in tempo a riprodursi e col tempo il lago si svuota.\n\nLe quote di pesca sono proprio questo: un limite stabilito dalle autorità che dice ai pescatori quanti pesci possono catturare in un certo periodo. Non è un divieto di pescare — è una regola per fare in modo che ci sia ancora pesce da pescare l'anno prossimo, e quello dopo ancora.\n\nNel Delta del Po, dove la pesca è un'attività tradizionale da secoli, stabilire le quote giuste è una sfida: bisogna bilanciare il guadagno dei pescatori con la salute dell'ecosistema. Troppo pochi pesci catturati e il lavoro non rende. Troppi e si rischia di compromettere l'intero equilibrio del Delta.`
    },
    scelte: [
      { label: "A", testo: "Aumentare subito le quote di pesca", conseguenza: "Le reti si riempiono e i pescatori guadagnano di più. Ma alcune specie iniziano a scarseggiare.", effetti: {economia: +15, biodiversita: -10, consenso: +5} },
      { label: "B", testo: "Mantenere quote sostenibili anche se il guadagno è minore", conseguenza: "Il pesce cresce e si riproduce. Il guadagno è minore oggi, ma il futuro della pesca è garantito.", effetti: {biodiversita: +10, economia: -5, qualita_acqua: +5} },
      { label: "C", testo: "Aumentare le quote solo per specie abbondanti e monitorate", conseguenza: "Un approccio mirato: le specie abbondanti vengono pescate di più, le altre lasciate recuperare.", effetti: {economia: +10, biodiversita: +5, consenso: +10} }
    ]
  },
  {
    situazione: "Una zona di canneto ostacola la vista <br> da un punto panoramico molto visitato.",
    scelte: [
      { label: "A", testo: "Tagliare gran parte del canneto", conseguenza: "Il punto panoramico è aperto. Ma il canneto tagliato non farà più da rifugio e filtro per le acque.", effetti: {economia: +10, biodiversita: -15, qualita_acqua: -5} },
      { label: "B", testo: "Lasciare il canneto intatto", conseguenza: "Il canneto rimane intatto, gli uccelli restano. I turisti però si lamentano della scarsa visibilità.", effetti: {biodiversita: +10, qualita_acqua: +5, consenso: -5} },
      { label: "C", testo: "Creare una passerella sopraelevata e tagliare solo una piccola parte", conseguenza: "Una passerella sopraelevata permette di ammirare il paesaggio senza distruggere l'habitat.", effetti: {biodiversita: +5, economia: +10, consenso: +10} }
    ]
  },
  {
    situazione: "In estate aumenta il turismo in barca nelle lagune.",
    scelte: [
      { label: "A", testo: "Permettere il passaggio libero ovunque", conseguenza: "Le barche possono andare ovunque. I turisti sono felici, ma le zone di sosta degli uccelli vengono disturbate.", effetti: {economia: +15, biodiversita: -15, qualita_acqua: -5} },
      { label: "B", testo: "Vietare completamente le escursioni in barca", conseguenza: "Le lagune restano silenziose. La fauna respira, ma gli operatori turistici perdono entrate.", effetti: {biodiversita: +15, economia: -15, consenso: -10} },
      { label: "C", testo: "Stabilire percorsi obbligati e limiti di velocità", conseguenza: "Percorsi segnalati e velocità ridotte: il turismo continua senza compromettere gli habitat sensibili.", effetti: {economia: +10, biodiversita: +10, qualita_acqua: +5, consenso: +5} }
    ]
  },
  {
    situazione: "Un agricoltore vicino al delta <br> vuole usare più fertilizzanti per aumentare la produzione.",
    scelte: [
      { label: "A", testo: "Consentire l'uso senza nuove regole", conseguenza: "Il raccolto aumenta. Ma i fertilizzanti in eccesso raggiungono i canali e alterano l'equilibrio delle acque.", effetti: {economia: +10, qualita_acqua: -15, biodiversita: -10} },
      { label: "B", testo: "Vietare l'uso di fertilizzanti nell'area", conseguenza: "I canali restano puliti. Ma l'agricoltore riduce la produzione e il reddito cala.", effetti: {qualita_acqua: +15, economia: -10, consenso: -10} },
      { label: "C", testo: "Incentivare tecniche agricole a basso impatto", conseguenza: "Tecniche sostenibili garantiscono un buon raccolto senza inquinare le acque del Delta.", effetti: {qualita_acqua: +10, biodiversita: +5, economia: +5, consenso: +10} }
    ]
  },
  {
    situazione: "Alcune specie invasive stanno riducendo<br> lo spazio per piante e animali locali.",
    scelte: [
      { label: "A", testo: "Non intervenire: la natura si regolerà da sola", conseguenza: "Si decide di non fare nulla. Le specie invasive si espandono e soffocano flora e fauna locali.", effetti: {biodiversita: -15, consenso: -5} },
      { label: "B", testo: "Avviare un controllo mirato con esperti", conseguenza: "Gli esperti intervengono con precisione. Le specie locali riprendono spazio, l'ecosistema si stabilizza.", effetti: {biodiversita: +15, qualita_acqua: +5, economia: -5} },
      { label: "C", testo: "Eliminare rapidamente tutto ciò che sembra invasivo", conseguenza: "L'intervento è troppo aggressivo: vengono eliminate anche specie utili, creando nuovi squilibri.", effetti: {biodiversita: -5, qualita_acqua: -5, consenso: -10} }
    ]
  },
  {
    situazione: "Una scuola vuole organizzare visite nel Delta del Po.",
    scelte: [
      { label: "A", testo: "Creare percorsi educativi guidati", conseguenza: "Le guide accompagnano i ragazzi. Il Delta diventa un'aula all'aperto: rispettoso e coinvolgente.", effetti: {consenso: +15, biodiversita: +5, economia: +5} },
      { label: "B", testo: "Lasciare visite libere senza guida", conseguenza: "I ragazzi esplorano liberamente. Qualche danno involontario agli habitat non viene prevenuto.", effetti: {economia: +5, consenso: +5, biodiversita: -5} },
      { label: "C", testo: "Limitare le visite per evitare disturbo", conseguenza: "Le visite vengono ridotte al minimo. L'habitat è protetto, ma la comunità si sente esclusa.", effetti: {biodiversita: +10, consenso: -10, economia: -5} }
    ]
  },
  {
    situazione: "Una mareggiata danneggia dune e spiagge naturali.",
    scelte: [
      { label: "A", testo: "Ricostruire subito con cemento e barriere rigide", conseguenza: "Le barriere rigide proteggono subito la costa. Ma bloccano i processi naturali e danneggiano la fauna costiera.", effetti: {economia: +5, consenso: +5, biodiversita: -15} },
      { label: "B", testo: "Lasciare che l'ambiente si modifichi senza interventi", conseguenza: "La natura si adatta da sola, ma lentamente. Nel frattempo economia e sicurezza ne risentono.", effetti: {biodiversita: -5, economia: -10, consenso: -10} },
      { label: "C", testo: "Ripristinare dune naturali con sabbia e vegetazione autoctona", conseguenza: "Sabbia e piante autoctone ricostruiscono le dune. La costa torna naturale e resistente.", effetti: {biodiversita: +15, qualita_acqua: +5, economia: +5, consenso: +10} }
    ]
  },
  {
    situazione: "Una cooperativa propone un nuovo impianto per allevare molluschi.",
    scelte: [
      { label: "A", testo: "Approvare senza controlli per creare lavoro", conseguenza: "L'impianto parte subito. Nuovi posti di lavoro, ma le acque iniziano a mostrare segni di stress.", effetti: {economia: +15, qualita_acqua: -10, biodiversita: -5} },
      { label: "B", testo: "Bloccare completamente il progetto", conseguenza: "Il progetto viene bloccato. L'ambiente è salvo, ma la cooperativa e i lavoratori sono delusi.", effetti: {biodiversita: +5, economia: -10, consenso: -5} },
      { label: "C", testo: "Approvare con controlli su densità, acque e impatto ambientale", conseguenza: "L'impianto viene approvato con regole chiare. Lavoro, qualità dell'acqua e natura convivono.", effetti: {economia: +10, qualita_acqua: +10, biodiversita: +5, consenso: +10} }
    ]
  }
];

const GESTISCI_IND_LABELS = {
  biodiversita: 'Biodiversità',
  economia: 'Economia locale',
  qualita_acqua: "Qualità dell'acqua",
  consenso: 'Consenso sociale'
};

const GESTISCI_BADGES = [
  { id: 'custode',          img: 'img/badge/badge-biodiversita.png',        label: 'Custode della biodiversità',      check: s => s.biodiversita >= 80 },
  { id: 'mediatore',        img: 'img/badge/badge-mediatore.png',            label: 'Mediatore del Delta',             check: s => Object.values(s).every(v => v >= 70) },
  { id: 'campione',         img: 'img/badge/badge-economia.png',             label: "Campione dell'economia locale",  check: s => s.economia >= 80 && s.biodiversita >= 50 },
  { id: 'sostenibile',      img: 'img/badge/badge-gestore-sostenibile.png',  label: 'Gestore sostenibile',             check: s => Object.values(s).every(v => v >= 55) && Object.values(s).some(v => v < 70) },
  { id: 'guardiano_acqua',  img: 'img/badge/badge-guardiano-acqua.png',      label: "Guardiano dell'acqua",           check: s => s.qualita_acqua >= 85 },
  { id: 'acque_cristalline',img: 'img/badge/badge-acque cristalline.png',   label: 'Acque cristalline',               check: s => s.qualita_acqua >= 75 && s.biodiversita >= 60 },
  { id: 'allarme',          img: 'img/badge/badge-allarme-rosso.png',        label: 'Allarme rosso ambientale',        check: s => s.biodiversita < 30 || s.qualita_acqua < 30 },
];

let gestisciTurno = 0;
let gestisciIndicatori = { biodiversita: 50, economia: 50, qualita_acqua: 50, consenso: 50 };
let gestisciSceltaFatta = null;

function clampInd(v) { return Math.max(0, Math.min(100, v)); }

function initGestisci() {
  gestisciTurno = 0;
  gestisciIndicatori = { biodiversita: 50, economia: 50, qualita_acqua: 50, consenso: 50 };
  gestisciSceltaFatta = null;
  renderGestisciScenario();
}

function buildStepperGestisci() {
  const total = GESTISCI_SCENARI.length;
  let html = '';
  for (let i = 0; i < total; i++) {
    const cls = i < gestisciTurno ? 'done' : i === gestisciTurno ? 'current' : 'todo';
    const label = i < gestisciTurno ? '✓' : (i + 1);
    html += `<div class="quiz-step ${cls}">${label}</div>`;
    if (i < total - 1) html += `<div class="quiz-step-line ${i < gestisciTurno ? 'done' : ''}"></div>`;
  }
  return html;
}

function renderGestisciScenario() {
  const s = GESTISCI_SCENARI[gestisciTurno];
  document.getElementById('game-area').innerHTML = `
    <div class="gestisci-outer">
      <div class="quiz-stepper">${buildStepperGestisci()}</div>
      <div class="gestisci-wrap">
        <div class="gestisci-top">
          <div class="gestisci-problema-box">
            <div class="gestisci-problema-label">La situazione da affrontare:</div>
            <div class="gestisci-situazione">${s.situazione}</div>
          </div>
        </div>
        <div class="gestisci-middle">
          <div class="gestisci-sottotitolo">Quale pensi sia il comportamento più corretto?</div>
          <div class="gestisci-scelte">
            ${(() => {
              const indices = [0, 1, 2];
              for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
              }
              return indices.map((origIdx, displayPos) => {
                const sc = s.scelte[origIdx];
                const lettera = String.fromCharCode(65 + displayPos);
                return `
                <div class="gestisci-scelta" id="scelta-${origIdx}" onclick="gestisciFaiScelta(${origIdx})">
                  <div class="gestisci-scelta-label">Opzione ${lettera}</div>
                  <div class="gestisci-scelta-testo">${sc.testo}</div>
                </div>`;
              }).join('');
            })()}
          </div>
          ${s.aiuto ? `<div class="gestisci-aiuto-hint">${s.aiuto.prompt} <button class="gestisci-aiuto-link" onclick="mostraAiutoGestisci()">${s.aiuto.cta} →</button></div>` : ''}
        </div>
        <div class="gestisci-bottom" id="gestisci-bottom"></div>
      </div>
    </div>`;
}

function mostraAiutoGestisci() {
  const s = GESTISCI_SCENARI[gestisciTurno];
  if (!s.aiuto) return;
  document.getElementById('gestisci-aiuto-titolo').textContent = s.aiuto.titolo;
  document.getElementById('gestisci-aiuto-testo').innerHTML = s.aiuto.testo
    .split('\n\n').map(p => `<p>${p}</p>`).join('');
  document.getElementById('gestisci-aiuto-overlay').classList.add('visible');
}

function chiudiAiutoGestisci(e) {
  if (e && e.target !== document.getElementById('gestisci-aiuto-overlay')) return;
  document.getElementById('gestisci-aiuto-overlay').classList.remove('visible');
}

function renderIndicatoriHTML(delta) {
  return `<div class="gestisci-indicatori">
    ${Object.entries(gestisciIndicatori).map(([k, v]) => {
      const d = delta ? (delta[k] || 0) : 0;
      const fillClass = v < 30 ? 'low' : v < 55 ? 'mid' : '';
      return `<div class="gestisci-ind">
        <div class="gestisci-ind-label">${GESTISCI_IND_LABELS[k]}</div>
        <div class="gestisci-ind-val" id="ind-${k}">${v}${d !== 0 ? `<span style="font-size:14px;margin-left:4px;color:${d > 0 ? '#3A8C5C' : '#C0513A'}">${d > 0 ? '+' : ''}${d}</span>` : ''}</div>
        <div class="gestisci-ind-bar"><div class="gestisci-ind-fill ${fillClass}" style="width:${v}%"></div></div>
      </div>`;
    }).join('')}
  </div>`;
}

function gestisciFaiScelta(idx) {
  suonaSeleziona();
  const s = GESTISCI_SCENARI[gestisciTurno];
  const scelta = s.scelte[idx];
  const effetti = scelta.effetti;

  // Applica effetti
  Object.entries(effetti).forEach(([k, v]) => {
    gestisciIndicatori[k] = clampInd((gestisciIndicatori[k] || 50) + v);
  });

  const isUltimo = gestisciTurno === GESTISCI_SCENARI.length - 1;

  // Costruisci delta chips
  const deltaChips = Object.entries(effetti).map(([k, v]) => {
    const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero';
    const sign = v > 0 ? '+' : '';
    return `<div class="gestisci-delta ${cls}">${GESTISCI_IND_LABELS[k]} ${sign}${v}</div>`;
  }).join('');

  // Suono feedback
  const haPositivo = Object.values(effetti).some(v => v > 0);
  const haNegativo = Object.values(effetti).some(v => v < 0);
  if (haPositivo && !haNegativo) suonaCorretto();
  else if (haNegativo && !haPositivo) suonaSbagliato();
  else suonaNeutro();

  // Disabilita le scelte
  document.querySelectorAll('.gestisci-scelta').forEach((el, i) => {
    el.style.pointerEvents = 'none';
    el.style.opacity = i === idx ? '1' : '0.4';
    if (i === idx) el.style.borderColor = 'var(--acquamarina)';
  });

  // Determina tipo feedback per colori/icona
  const totPos = Object.values(effetti).filter(v => v > 0).length;
  const totNeg = Object.values(effetti).filter(v => v < 0).length;
  const feedbackType = totNeg === 0            ? 'pos-feedback'
                     : totPos === 0            ? 'neg-feedback'
                     : totNeg > totPos         ? 'warn-feedback'
                     :                          'mixed-feedback';

  const iconHTML = feedbackType === 'pos-feedback'
    ? `<div class="tick-wrap"><svg class="tick-svg" viewBox="0 0 52 52"><circle class="tick-circle" cx="26" cy="26" r="23"/><path class="tick-check" d="M14 26 l8 8 l16 -16"/></svg></div>`
    : feedbackType === 'neg-feedback'
    ? `<div class="sad-wrap"><svg class="sad-svg" viewBox="0 0 52 52"><circle class="sad-circle" cx="26" cy="26" r="23"/><circle class="sad-eye-l" cx="18" cy="22" r="2.5"/><circle class="sad-eye-r" cx="34" cy="22" r="2.5"/><path class="sad-mouth" d="M17 34 Q26 26 35 34"/></svg></div>`
    : feedbackType === 'warn-feedback'
    ? `<div class="warn-wrap"><svg class="warn-svg" viewBox="0 0 52 52"><path class="warn-triangle" d="M26 6 L47 44 H5 Z"/><line class="warn-excl" x1="26" y1="20" x2="26" y2="33"/><circle class="warn-dot" cx="26" cy="39" r="2"/></svg></div>`
    : `<div class="tick-wrap"><svg class="tick-svg" viewBox="0 0 52 52"><circle class="tick-circle" cx="26" cy="26" r="23"/><path class="tick-check" d="M14 26 l8 8 l16 -16"/></svg></div>`;

  const titolo = feedbackType === 'pos-feedback'  ? 'Ottima scelta!'
               : feedbackType === 'neg-feedback'  ? 'Scelta scorretta.'
               : feedbackType === 'warn-feedback'  ? 'Scelta rischiosa.'
               :                                    'Scelta equilibrata.';

  const bottom = document.getElementById('gestisci-bottom');
  if (bottom) {
    bottom.innerHTML = `
      <div class="gestisci-feedback-box ${feedbackType}">
        <div class="gestisci-feedback-icon">${iconHTML}</div>
        <div class="gestisci-feedback-content">
          <div class="gestisci-feedback-titolo">${titolo}</div>
          <div class="gestisci-conseguenza">${scelta.conseguenza}</div>
          <div class="gestisci-delta-inline"><span class="gestisci-punteggio-label">Ecco come è cambiato il tuo punteggio:</span> ${deltaChips}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end">
        <button class="btn-primary" onclick="${isUltimo ? 'mostraRiepilogoGestisci()' : 'gestisciProssimo()'}">
          ${isUltimo ? 'Vedi il risultato →' : 'Prossimo scenario →'}
        </button>
      </div>`;
  }
}

function gestisciProssimo() {
  gestisciTurno++;
  renderGestisciScenario();
}

async function mostraRiepilogoGestisci() {
  giochiCompletati.add('gestisci');
  const media = Math.round(Object.values(gestisciIndicatori).reduce((a,b) => a+b, 0) / 4);

  let esito, messaggio, emoji;
  if (media >= 80)      { esito = 'Delta in equilibrio'; messaggio = 'Hai trovato un ottimo equilibrio tra natura, lavoro e comunità. Il Delta è vivo e ben gestito.'; emoji = 'img/ic_feedback/feedback-1-risultato-perfetto.png'; }
  else if (media >= 60) { esito = 'Buona gestione, ma migliorabile'; messaggio = 'Il Delta resiste, ma alcune scelte hanno creato squilibri. Serve più attenzione.'; emoji = 'img/ic_feedback/feedback-3-buon-risultato.png'; }
  else if (media >= 40) { esito = 'Equilibrio fragile'; messaggio = 'Alcuni indicatori sono in difficoltà. Le attività umane e la natura non sono ancora bilanciate.'; emoji = 'img/ic_feedback/feedback-7-equilibrio-fragile.png'; }
  else if (media >= 20) { esito = 'Delta sotto pressione'; messaggio = "L'ambiente è degradato o l'economia locale è in crisi. Le decisioni non sono state sostenibili."; emoji = 'img/ic_feedback/feedback-8-delta-sotto-pressione.png'; }
  else                   { esito = 'Crisi del Delta'; messaggio = 'Le scelte hanno compromesso gravemente habitat, acqua, lavoro o consenso sociale.'; emoji = 'img/ic_feedback/feedback-9-crisi-del-delta.png'; }

  const attenzioneLabels = {
    biodiversita: { label: 'Biodiversità', msg: 'Flora e fauna del Delta sono in difficoltà. Serve più attenzione alla protezione degli habitat.' },
    economia: { label: 'Economia locale', msg: 'Pesca, turismo e lavoro stanno soffrendo. Le attività produttive hanno bisogno di più supporto.' },
    qualita_acqua: { label: "Qualità dell'acqua", msg: "Inquinamento e squilibri idrici stanno danneggiando l'ecosistema del Delta." },
    consenso: { label: 'Consenso sociale', msg: 'Cittadini, pescatori e operatori non si sentono ascoltati. Le decisioni creano tensioni.' }
  };
  const attenzioni = Object.entries(gestisciIndicatori)
    .filter(([k, v]) => v < 60)
    .map(([k]) => attenzioneLabels[k]);

  const badges = GESTISCI_BADGES.filter(b => b.check(gestisciIndicatori));

  const badgesHTML = badges.length > 0 ? `
    <div class="gestisci-riepilogo-sezione">
      <div class="gestisci-riepilogo-sezione-titolo">Che tipo di gestore sei?</div>
      <div class="gestisci-badges">${badges.map(b => `<div class="gestisci-badge"><img src="${b.img}" alt="${b.label}"></div>`).join('')}</div>
    </div>` : '';

  const attenzioneHTML = attenzioni.length > 0 ? `
    <div class="gestisci-riepilogo-sezione">
      <div class="gestisci-riepilogo-sezione-titolo">In cosa puoi migliorare?</div>
      ${attenzioni.map(a => `<p class="gestisci-riepilogo-attenzione-msg"><strong>${a.label}:</strong> ${a.msg}</p>`).join('')}
    </div>` : '';

  const radarHTML = buildRadarChart(gestisciIndicatori);

  document.getElementById('game-area').innerHTML = `
    <div class="gestisci-riepilogo-layout">

      <div class="gestisci-riepilogo-radar">
        ${radarHTML}
      </div>

      <div class="gestisci-riepilogo-colonna">
        <div class="gestisci-riepilogo-esito">
          <div class="riepilogo-emoji gestisci-riepilogo-emoji"><img src="${emoji}" alt=""></div>
          <div class="gestisci-riepilogo-titolo">${esito}</div>
          <div class="gestisci-riepilogo-messaggio">${messaggio}</div>
        </div>

        ${badgesHTML}
        ${attenzioneHTML}

        <div class="gestisci-riepilogo-cta">
          ${profiloCorrente.partecipa ? `<button class="btn-link-secondario gestisci-riepilogo-lb-btn" onclick="mostraLeaderboard('gestisci', ${media})">🏆 Guarda la classifica</button>` : ''}
          <div class="riepilogo-azioni gestisci-riepilogo-azioni">
            <button class="btn-secondary" onclick="initGestisci()">Gioca di nuovo</button>
            <button class="btn-primary" onclick="backToSelect()">Scegli un altro gioco</button>
          </div>
        </div>
      </div>

    </div>`;

  salvaInClassifica('gestisci', media).catch(console.error);
  if (media >= 60) { setTimeout(esplodiCoriandoli, 300); setTimeout(suonaVittoria, 100); }
}


function buildRadarChart(ind) {
  const vals = [ind.biodiversita, ind.economia, ind.qualita_acqua, ind.consenso];
  const labels = ['Biodiversità', 'Economia locale', "Qualità dell'acqua", 'Consenso sociale'];
  const N = vals.length;
  const cx = 240, cy = 240, r = 160;
  const angles = vals.map((_, i) => (Math.PI * 2 * i / N) - Math.PI / 2);

  function ptXY(val, i) {
    const a = angles[i];
    const rr = r * Math.max(0, Math.min(100, val)) / 100;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  }

  // Grid rings — no labels on scale
  const rings = [20,40,60,80,100].map(v => {
    const pts = angles.map(a => {
      const rr = r * v / 100;
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
    }).join(' ');
    const isAlert = v === 60;
    return `<polygon points="${pts}" fill="none" stroke="${isAlert ? '#E8C97A' : 'var(--sabbia)'}" stroke-width="${isAlert ? 2 : 1}" stroke-dasharray="${isAlert ? '5,4' : 'none'}"/>`;
  }).join('');

  // Axes
  const axes = angles.map(a =>
    `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="var(--sabbia)" stroke-width="1.5"/>`
  ).join('');

  // Data polygon
  const dataPts = vals.map((v, i) => ptXY(v, i).join(',')).join(' ');

  // Labels with tspan for multiline
  const labelLines = [
    ['Biodiversità'],
    ['Economia', 'locale'],
    ["Qualità", "dell'acqua"],
    ['Consenso', 'sociale']
  ];
  const labelsHTML = labelLines.map((lines, i) => {
    const a = angles[i];
    const lx = cx + (r + 40) * Math.cos(a);
    const ly = cy + (r + 40) * Math.sin(a);
    const anchor = Math.cos(a) < -0.3 ? 'end' : Math.cos(a) > 0.3 ? 'start' : 'middle';
    const totalH = lines.length * 20;
    const startY = Math.sin(a) < -0.3 ? ly - totalH + 4 : Math.sin(a) > 0.3 ? ly : ly - totalH/2 + 10;
    return lines.map((ln, li) =>
      `<text x="${lx}" y="${startY + li * 20}" text-anchor="${anchor}" font-size="16" font-weight="500" font-family="DM Sans,sans-serif" fill="var(--testo-scuro)">${ln}</text>`
    ).join('');
  }).join('');

  // Value dots + value labels (only the actual values, no scale)
  const dots = vals.map((v, i) => {
    const [x, y] = ptXY(v, i);
    const a = angles[i];
    // When at (or near) 100% the dot sits on the outer ring and an outward
    // offset would collide with the axis label — flip inward instead.
    const atEdge = v >= 98;
    const offset = atEdge ? -22 : 18;
    const tx = x + offset * Math.cos(a);
    const ty = y + offset * Math.sin(a);
    // Inward offset reverses the natural text-anchor direction.
    const anchor = atEdge
      ? (Math.cos(a) < -0.1 ? 'start' : Math.cos(a) > 0.1 ? 'end' : 'middle')
      : (Math.cos(a) < -0.1 ? 'end'   : Math.cos(a) > 0.1 ? 'start' : 'middle');
    const color = v < 40 ? '#C0513A' : v < 60 ? '#E8A020' : 'var(--verde-scuro)';
    return `<circle cx="${x}" cy="${y}" r="6" fill="${color}"/>
      <text x="${tx}" y="${ty}" dy="5" text-anchor="${anchor}" font-size="16" font-weight="700" font-family="Fraunces,serif" fill="${color}">${v}</text>`;
  }).join('');

  return `<svg width="600" height="480" viewBox="0 0 480 480">
    ${rings}${axes}
    <polygon points="${dataPts}" fill="rgba(91,158,154,.2)" stroke="var(--acquamarina)" stroke-width="3" stroke-linejoin="round"/>
    ${dots}${labelsHTML}
  </svg>`;
}



/* ══════════════════════════════════════
   GIOCO SEC 3 — IN VIAGGIO NEL DELTA
══════════════════════════════════════ */
// Costante rimossa — le mappe sono ora nelle proprietà dei percorsi

const VIAGGIO_PERCORSI = [
  {
    id: 'percorso1',
    nome: "Il percorso dell'acqua dal fiume al mare",
    desc: "Segui il grande fiume dalle sorgenti fino all'Adriatico.",
    icon: "waves",
    mappa: "img/mappe/mappa_percorso_1.png",
    mappaGioco: "img/mappe/mappa_percorso_1m.jpg",
    tappe: [
      { nome: "Grande fiume",      coords: [26.32, 25.12] },
      { nome: "Argine",            coords: [48.64, 16.75] },
      { nome: "Canneto",           coords: [84.93, 23.92] },
      { nome: "Zona salmastra",    coords: [78.55, 44.66] },
      { nome: "Laguna",            coords: [67.78, 67.38] },
      { nome: "Valle da pesca",    coords: [24.72, 68.58] },
      { nome: "Scanno sabbioso",   coords: [44.66, 94.50] },
      { nome: "Mare Adriatico",    coords: [90.51, 97.69] },
    ],
    domande: [
      { testo: "Che cosa succede al Po quando arriva nel delta?", opzioni: ["Si divide in più rami e deposita sedimenti","Scende velocemente verso il mare in un unico canale","Si trasforma in un lago prima di sfociare","Diventa completamente salato per l'influsso del mare"], corretta: 0, difficile: false, suggerimento: "Pensa a cosa fa un fiume quando rallenta e incontra il mare…" },
      { testo: "A cosa servono gli argini?", opzioni: ["A contenere e regolare le acque","A creare canali per la navigazione delle barche","A separare le zone agricole dalle zone turistiche","A raccogliere l'acqua piovana per l'irrigazione"], corretta: 0, difficile: false, suggerimento: "Gli argini sono strutture costruite lungo le sponde — cosa impediscono?" },
      { testo: "Quale pianta forma fitte barriere lungo canali e paludi?", opzioni: ["Canna di palude","Salicornia","Ginestra odorosa","Pino marittimo"], corretta: 0, difficile: false, suggerimento: "È la pianta più comune delle zone umide italiane, alta e con fusto cavo" },
      { testo: "Che cos'è l'acqua salmastra?", opzioni: ["Miscela di acqua dolce e salata","Acqua marina purificata dalla pioggia","Acqua dolce arricchita di minerali","Acqua stagnante povera di ossigeno"], corretta: 0, difficile: true, suggerimento: "Il prefisso 'sal-' ti dà un indizio sulla composizione dell'acqua" },
      { testo: "Perché le lagune sono importanti?", opzioni: ["Offrono habitat a pesci, uccelli e piante","Servono principalmente come riserve d'acqua potabile","Proteggono le coste dalle maree impedendo ogni scambio con il mare","Sono usate solo per l'allevamento industriale dei molluschi"], corretta: 0, difficile: false, suggerimento: "Pensa agli animali che vivono in ambienti d'acqua poco profonda" },
      { testo: "Che attività tradizionale si svolge nelle valli da pesca?", opzioni: ["Pesca e allevamento ittico","Coltivazione del riso in zone allagate","Estrazione di sale marino","Navigazione commerciale lungo i canali"], corretta: 0, difficile: false, suggerimento: "Le 'valli' nel Delta non sono montagne — sono specchi d'acqua recintati" },
      { testo: "Che cosa sono gli scanni?", opzioni: ["Lingue o banchi sabbiosi costieri","Canali artificiali scavati per drenare le acque","Zone di canneto protette dalla caccia","Piccole isole abitate dai pescatori"], corretta: 0, difficile: true, suggerimento: "Pensa alla sabbia trasportata dal fiume — cosa forma quando si deposita?" },
      { testo: "Quale equilibrio è fondamentale nel delta?", opzioni: ["Equilibrio tra fiume, mare, sedimenti e attività umane","Equilibrio tra turismo, agricoltura e industria","Equilibrio tra le maree e le precipitazioni stagionali","Equilibrio tra la flora acquatica e quella terrestre"], corretta: 0, difficile: true, suggerimento: "Il delta è un sistema complesso — non dipende da una sola forza ma da molte insieme" },
      { testo: "Che ruolo ha il Po nel modellare il territorio del Delta?", opzioni: ["Deposita sedimenti creando nuove terre emerse","Scava canyon sottomarini all'arrivo nel mare","Trasporta principalmente sabbia verso le montagne","Si allarga progressivamente assorbendo i fiumi minori"], corretta: 0, difficile: false, suggerimento: "Il Po trasporta ogni anno milioni di tonnellate di materiale — dove le lascia quando rallenta?" },
      { testo: "Perché il Delta del Po è in continua evoluzione?", opzioni: ["Per i depositi del fiume, le maree e l'intervento umano","Perché le maree lo erodono completamente ogni anno","Per le forti piogge invernali che modificano i canali","Per l'attività vulcanica sottomarina nell'Adriatico"], corretta: 0, difficile: true, suggerimento: "Il delta è un sistema vivo — quali forze naturali e umane lo trasformano ogni giorno?" },
      { testo: "Qual è una delle principali minacce al Delta del Po oggi?", opzioni: ["La subsidenza e l'innalzamento del livello del mare","L'eccessivo turismo nelle zone umide","La crescita incontrollata dei canneti","La costruzione di nuovi porti commerciali"], corretta: 0, difficile: true, suggerimento: "Il territorio si sta abbassando mentre il mare si alza — quali conseguenze porta questo squilibrio?" }
    ]
  },
  {
    id: 'percorso2',
    nome: "La rotta degli uccelli migratori",
    desc: "Naviga tra lagune, valli e canneti alla scoperta della fauna del Delta.",
    icon: "rowing",
    mappa: "img/mappe/mappa_percorso_2.png",
    mappaGioco: "img/mappe/mappa_percorso_2m.jpg",
    tappe: [
      { nome: "Porto",                  coords: [21.93, 20.33] },
      { nome: "Canale",                 coords: [58.21, 35.48] },
      { nome: "Valle da pesca",         coords: [83.36, 19.54] },
      { nome: "Zona di riproduzione",   coords: [23.92, 42.26] },
      { nome: "Laguna",                 coords: [80.54, 43.06] },
      { nome: "Area molluschi",         coords: [21.13, 64.20] },
      { nome: "Mercato locale",         coords: [88.92, 64.20] },
      { nome: "Area protetta",          coords: [57.42, 65.39] },
      { nome: "Centro visite",          coords: [23.13, 94.89] },
      { nome: "Mercato finale",         coords: [73.37, 96.89] },
    ],
    domande: [
      { testo: "Perché molti uccelli migratori scelgono il Delta del Po?", opzioni: ["Per riposare, nutrirsi e nidificare","Perché il clima è sempre caldo tutto l'anno","Per evitare i predatori marini durante la traversata","Perché trovano facilmente materiale per costruire i nidi"], corretta: 0, difficile: false, suggerimento: "Il Delta è una tappa fondamentale lungo le rotte migratorie europee — cosa offre agli uccelli in transito?" },
      { testo: "Quale ambiente è più adatto agli uccelli acquatici?", opzioni: ["Paludi, lagune e valli d'acqua bassa","Foreste costiere con alberi ad alto fusto","Spiagge sabbiose esposte al vento","Canali artificiali con sponde in cemento"], corretta: 0, difficile: false, suggerimento: "Gli uccelli acquatici hanno zampe e becchi adatti a un ambiente specifico — quale?" },
      { testo: "Perché il canneto è utile?", opzioni: ["Offre riparo e siti di nidificazione","Purifica l'acqua eliminando tutti i batteri","Serve principalmente come combustibile per le comunità locali","Attira i pesci grandi nelle zone di pesca"], corretta: 0, difficile: false, suggerimento: "Pensa a cosa cercano gli uccelli quando devono costruire un nido — discrezione o visibilità?" },
      { testo: "Che cosa possono trovare gli uccelli nei fondali bassi?", opzioni: ["Piccoli pesci, insetti, molluschi e crostacei","Alghe e piante acquatiche ricche di fibre","Acqua dolce filtrata dai sedimenti","Sabbia fine utile per la pulizia del piumaggio"], corretta: 0, difficile: true, suggerimento: "I fondali bassi e fangosi nascondono un'enorme quantità di cibo — quale tipo?" },
      { testo: "Quale comportamento umano crea disturbo?", opzioni: ["Avvicinarsi ai nidi o fare rumore","Fotografare gli uccelli da oltre 100 metri","Camminare sui sentieri segnalati","Osservare con il binocolo in silenzio"], corretta: 0, difficile: false, suggerimento: "Gli uccelli in cova sono molto sensibili — cosa li spaventa e li fa abbandonare il nido?" },
      { testo: "Qual è il modo corretto di osservare gli uccelli?", opzioni: ["Da lontano, in silenzio, senza disturbare","Avvicinandosi lentamente per vedere meglio i dettagli","Usando richiami sonori per attirare le specie rare","Portando cibo per abituarli alla presenza umana"], corretta: 0, difficile: false, suggerimento: "La torre di birdwatching esiste proprio per un motivo — quale vantaggio offre all'osservatore?" },
      { testo: "Perché pesca e natura devono essere bilanciate?", opzioni: ["Per proteggere habitat e lavoro locale","Perché la pesca eccessiva migliora la qualità dell'acqua","Per aumentare il numero di specie invasive","Perché gli uccelli competono con i pescatori per il pesce"], corretta: 0, difficile: true, suggerimento: "Cosa succede se si pesca troppo o si distrugge l'habitat — chi ci rimette oltre ai pesci?" },
      { testo: "Che cosa protegge un parco naturale?", opzioni: ["Habitat, specie e paesaggi","Solo le specie in pericolo di estinzione","Principalmente le attività turistiche e ricettive","Le risorse idriche destinate all'agricoltura"], corretta: 0, difficile: false, suggerimento: "Un parco naturale non tutela una sola cosa — pensa a tutto ciò che contiene" },
      { testo: "Quale scelta aiuta la nidificazione?", opzioni: ["Limitare l'accesso in periodi delicati","Installare telecamere per monitorare i nidi da vicino","Pulire la vegetazione intorno ai nidi per facilitare l'accesso","Segnalare la presenza dei nidi ai visitatori per valorizzarli"], corretta: 0, difficile: true, suggerimento: "Il periodo della cova è il momento più delicato — cosa serve sopra ogni cosa?" },
      { testo: "Qual è il rischio di perdere le zone umide?", opzioni: ["Gli uccelli trovano meno cibo e riparo","Le rotte migratorie si accorciano automaticamente","Gli uccelli si adattano rapidamente a nuovi habitat","Aumenta la disponibilità di zone di nidificazione alternative"], corretta: 0, difficile: true, suggerimento: "Le zone umide sono come stazioni di servizio per i migratori — cosa succede se chiudono?" },
      { testo: "Come si chiama il fenomeno per cui gli uccelli si spostano stagionalmente tra zone diverse?", opzioni: ["Migrazione","Ibernazione","Territorialità","Dispersione"], corretta: 0, difficile: false, suggerimento: "Milioni di uccelli percorrono ogni anno migliaia di chilometri — come si chiama questo viaggio?" },
      { testo: "Cosa mangia principalmente l'airone cenerino?", opzioni: ["Pesci, rane e piccoli roditori","Semi e bacche di piante acquatiche","Insetti e larve nei fanghi","Alghe e piante sommerse"], corretta: 0, difficile: false, suggerimento: "L'airone resta immobile per ore ai bordi dell'acqua — cosa sta aspettando?" },
      { testo: "Che cos'è una rotta migratoria?", opzioni: ["Un percorso regolare tra zone di svernamento e riproduzione","Una zona marina vietata alla navigazione per proteggere gli uccelli","Un'area di sosta temporanea lungo le coste adriatiche","Un corridoio artificiale creato dalle riserve naturali"], corretta: 0, difficile: true, suggerimento: "Gli uccelli non volano a caso — seguono percorsi precisi tramandati di generazione in generazione" }
    ]
  },
  {
    id: 'percorso3',
    nome: "La sfida della pesca sostenibile",
    desc: "Osserva flora, fauna e habitat naturali lungo i sentieri del Parco.",
    icon: "nature",
    mappa: "img/mappe/mappa_percorso_3.png",
    mappaGioco: "img/mappe/mappa_percorso_3m.jpg",
    tappe: [
      { nome: "Tappa 1", coords: [48.6, 85.0] },
      { nome: "Tappa 2", coords: [28.5, 66.1] },
      { nome: "Tappa 3", coords: [71.3, 76.5] },
      { nome: "Tappa 4", coords: [63.0, 49.9] },
      { nome: "Tappa 5", coords: [67.9, 28.0] },
      { nome: "Tappa 6", coords: [37.9, 24.6] },
      { nome: "Tappa 7", coords: [26.1, 19.2] },
      { nome: "Tappa 8", coords: [45.1, 12.0] },
    ],
    domande: [
      { testo: "Qual è una scelta sostenibile prima di uscire in barca?", opzioni: ["Controllare regole, periodi e attrezzature","Portare più reti possibile per massimizzare il pescato","Scegliere le zone più ricche indipendentemente dai divieti","Uscire solo nelle ore notturne per evitare i controlli"], corretta: 0, difficile: false, suggerimento: "Prima di pescare, un pescatore responsabile fa alcune verifiche — quali?" },
      { testo: "Perché non bisogna pescare ovunque?", opzioni: ["Alcune aree sono delicate o protette","La pesca è vietata in tutti i canali del Delta","Il pesce si sposta continuamente e non vale la pena","Le correnti rendono pericolosa la pesca in certe zone"], corretta: 0, difficile: false, suggerimento: "Alcune zone del Delta ospitano habitat o specie che richiedono protezione — cosa succede se le disturbiamo?" },
      { testo: "Che cosa sono le valli da pesca?", opzioni: ["Ambienti d'acqua salmastra gestiti per pesca e allevamento","Tratti di fiume in cui è vietata qualsiasi attività umana","Zone di mare aperto riservate alla pesca industriale","Canali artificiali scavati per l'irrigazione agricola"], corretta: 0, difficile: true, suggerimento: "Le 'valli' nel Delta non sono montagne — sono specchi d'acqua recintati con una funzione precisa" },
      { testo: "Cosa conviene fare se i pesci sono in riproduzione?", opzioni: ["Limitare o sospendere la pesca","Intensificare la pesca prima che finisca la stagione","Pescare solo i pesci adulti e lasciare i piccoli","Cambiare zona ma continuare a pescare normalmente"], corretta: 0, difficile: false, suggerimento: "Il periodo riproduttivo è fondamentale per la sopravvivenza della specie — cosa fa un pescatore responsabile?" },
      { testo: "Quale rischio crea una pesca eccessiva?", opzioni: ["Riduce le popolazioni e danneggia l'equilibrio","Migliora la qualità dell'acqua riducendo i pesci","Aumenta la biodiversità favorendo specie più resistenti","Non crea rischi se si usano reti a maglie larghe"], corretta: 0, difficile: false, suggerimento: "Cosa succede a una specie se viene pescata più velocemente di quanto riesce a riprodursi?" },
      { testo: "Che cosa serve per allevare molluschi in modo responsabile?", opzioni: ["Controlli sulla qualità dell'acqua e sulla densità","Grandi impianti industriali con filtraggio artificiale","Acque completamente dolci e lontane dal mare","Assenza totale di altre specie nelle zone di allevamento"], corretta: 0, difficile: true, suggerimento: "I molluschi filtrano l'acqua — cosa bisogna monitorare per garantire qualità e sostenibilità?" },
      { testo: "Perché valorizzare il pescato locale?", opzioni: ["Sostiene lavoro, territorio e filiere corte","Perché il pesce locale costa sempre meno di quello importato","Perché evita completamente l'uso di imballaggi plastici","Perché il pesce locale è sempre più fresco di quello di mare aperto"], corretta: 0, difficile: false, suggerimento: "Comprare locale significa scegliere vicino a casa — quali effetti ha sulla comunità e sull'ambiente?" },
      { testo: "Perché alcune zone devono restare tranquille?", opzioni: ["Per proteggere specie, nidi e habitat","Per riservare le zone migliori ai pescatori professionisti","Perché il rumore delle barche spaventa i turisti","Per mantenere l'acqua pulita destinata all'uso potabile"], corretta: 0, difficile: false, suggerimento: "In alcune zone del Delta vivono o nidificano specie molto sensibili — di cosa hanno bisogno?" },
      { testo: "Come può la pesca collaborare con il turismo?", opzioni: ["Raccontando tradizioni, regole e ambiente","Vietando ai turisti l'accesso alle zone di pesca","Organizzando gare di pesca sportiva nelle aree protette","Vendendo direttamente il pescato agli hotel della costa"], corretta: 0, difficile: false, suggerimento: "I pescatori conoscono il Delta meglio di chiunque — cosa possono condividere con i visitatori?" },
      { testo: "Qual è la strategia migliore nel lungo periodo?", opzioni: ["Pescare rispettando tempi, quantità e habitat","Investire in tecnologie per pescare sempre di più","Limitare la pesca solo alle specie più abbondanti","Affidarsi alle leggi europee senza ulteriori controlli locali"], corretta: 0, difficile: true, suggerimento: "La sostenibilità significa pensare al futuro — cosa garantisce che ci sia ancora pesce tra 20 anni?" },
      { testo: "Qual è il ruolo dei pescatori nella tutela del Delta?", opzioni: ["Sono custodi del territorio e collaborano al monitoraggio ambientale","Non hanno responsabilità ambientali, solo produttive","Devono ridurre al minimo la loro presenza nelle zone umide","Sono i principali responsabili del degrado delle acque"], corretta: 0, difficile: false, suggerimento: "I pescatori vivono e lavorano nel Delta da generazioni — che conoscenza hanno dell'ecosistema?" }
    ]
  }
];

const VIAGGIO_MAX_TURNI = 12;
let viaggioPercorsoIdx = 0;
let viaggioPosTappa = 0;
let viaggioTurnoCorrente = 0;
let viaggioAiutoUsato = false;
let viaggioStato = 'domanda';
let viaggioShuffledOpts = [];
let viaggioPathOffsets = [0, 14.3, 28.6, 42.9, 57.1, 71.4, 85.7, 100];
let viaggioErroriTappa = {}; // { tappaIdx: contatore errori } — persiste per tutta la partita
let viaggioCompletati = new Set(); // percorsiIdx completati — persiste per tutta la sessione
let giochiCompletati = new Set(); // tipi gioco completati ('quiz-sec','gestisci','viaggio') — per mostrare link classifica
let viaggioDomandaIdx = 0;  // avanza sempre di 1, indipendente dalla posizione sulla mappa
let _vpOffsetCache = {};    // cache { "percorsoIdx_w_h": offsets[] } — evita ricalcolo ad ogni render
let _vpEl = null;   // SVG path element persistente per getPointAtLength
let _vpTotal = 0;   // lunghezza totale del path
let _vpW = 0;       // larghezza container in px
let _vpH = 0;       // altezza container in px
let _vpRaf = null;  // handle requestAnimationFrame corrente


function _catmullRomPath(pts) {
  const ext = [
    [2*pts[0][0]-pts[1][0], 2*pts[0][1]-pts[1][1]],
    ...pts,
    [2*pts[pts.length-1][0]-pts[pts.length-2][0], 2*pts[pts.length-1][1]-pts[pts.length-2][1]]
  ];
  let d = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0x,p0y]=ext[i], [p1x,p1y]=ext[i+1], [p2x,p2y]=ext[i+2], [p3x,p3y]=ext[i+3];
    d += ` C ${(p1x+(p2x-p0x)/6).toFixed(2)},${(p1y+(p2y-p0y)/6).toFixed(2)} `
       + `${(p2x-(p3x-p1x)/6).toFixed(2)},${(p2y-(p3y-p1y)/6).toFixed(2)} `
       + `${p2x.toFixed(2)},${p2y.toFixed(2)}`;
  }
  return d;
}

function _vpSetPos(pct) {
  const seg = document.getElementById('viaggio-seg');
  if (!seg || !_vpEl || !_vpTotal || !_vpW || !_vpH) return;
  const p = _vpEl.getPointAtLength(Math.max(0, Math.min(pct / 100 * _vpTotal, _vpTotal)));
  seg.style.left = (p.x / _vpW * 100).toFixed(3) + '%';
  seg.style.top  = (p.y / _vpH * 100).toFixed(3) + '%';
}

function animateSegnalinoAlongPath(fromPct, toPct) {
  if (_vpRaf) { cancelAnimationFrame(_vpRaf); _vpRaf = null; }
  const seg = document.getElementById('viaggio-seg');
  if (!seg) return;
  if (!_vpEl || !_vpTotal) {
    // fallback diretto
    const pt = VIAGGIO_PERCORSI[viaggioPercorsoIdx].tappe[viaggioPosTappa].coords;
    seg.style.left = pt[0] + '%'; seg.style.top = pt[1] + '%';
    return;
  }
  seg.style.transition = 'none';
  const dur = 700, t0 = performance.now();
  function frame(now) {
    let t = Math.min((now - t0) / dur, 1);
    const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(2 - 2*t, 3) / 2;
    _vpSetPos(fromPct + (toPct - fromPct) * e);
    if (t < 1) { _vpRaf = requestAnimationFrame(frame); }
    else { _vpRaf = null; seg.style.transition = ''; }
  }
  _vpRaf = requestAnimationFrame(frame);
}

function initViaggioPath() {
  if (_vpRaf) { cancelAnimationFrame(_vpRaf); _vpRaf = null; }
  const col = document.querySelector('.viaggio-mappa-col');
  if (!col) return;
  const w = col.offsetWidth, h = col.offsetHeight;
  if (!w || !h) return;
  _vpW = w; _vpH = h;

  const coords = VIAGGIO_PERCORSI[viaggioPercorsoIdx].tappe.map(t => t.coords);
  const pxPts = coords.map(([x, y]) => [x * w / 100, y * h / 100]);
  const pathD = _catmullRomPath(pxPts);

  // Path visivo sull'SVG overlay
  const svgEl = document.getElementById('viaggio-percorso-svg');
  if (svgEl) svgEl.innerHTML =
    `<path d="${pathD}" fill="none" stroke="rgba(255,255,255,0.4)"
      stroke-width="2.5" stroke-dasharray="6 5" stroke-linecap="round"/>`;

  // Path element persistente per queries di posizione
  if (_vpEl && _vpEl.ownerSVGElement) document.body.removeChild(_vpEl.ownerSVGElement);
  const ns = 'http://www.w3.org/2000/svg';
  const tmpSvg = document.createElementNS(ns, 'svg');
  tmpSvg.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden';
  _vpEl = document.createElementNS(ns, 'path');
  _vpEl.setAttribute('d', pathD);
  tmpSvg.appendChild(_vpEl);
  document.body.appendChild(tmpSvg);
  _vpTotal = _vpEl.getTotalLength();
  if (!_vpTotal) return;

  // Arc-length offset % per ogni tappa — usa cache per evitare 16k chiamate getPointAtLength ad ogni render
  const cacheKey = `${viaggioPercorsoIdx}_${w}_${h}`;
  if (_vpOffsetCache[cacheKey]) {
    viaggioPathOffsets = _vpOffsetCache[cacheKey];
  } else {
    viaggioPathOffsets = pxPts.map(([tx, ty], i) => {
      if (i === 0) return 0;
      if (i === pxPts.length - 1) return 100;
      let minD = Infinity, best = 0;
      for (let s = 0; s <= 2000; s++) {
        const l = s / 2000 * _vpTotal;
        const p = _vpEl.getPointAtLength(l);
        const d = Math.hypot(p.x - tx, p.y - ty);
        if (d < minD) { minD = d; best = l; }
      }
      return (best / _vpTotal) * 100;
    });
    _vpOffsetCache[cacheKey] = viaggioPathOffsets;
  }

  // Posiziona il segnalino immediatamente (senza transizione CSS)
  const seg = document.getElementById('viaggio-seg');
  if (seg) {
    seg.style.transition = 'none';
    _vpSetPos(viaggioPathOffsets[viaggioPosTappa]);
    requestAnimationFrame(() => { if (seg) seg.style.transition = ''; });
  }
}

function initViaggio() {
  // Mostra lista percorsi
  renderViaggioLista();
}

function renderViaggioLista() {
  const cardsHTML = VIAGGIO_PERCORSI.map((p, i) => {
    const completata = viaggioCompletati.has(i);
    return `
    <div class="percorso-card${completata ? ' completata' : ''}" onclick="avviaPercorso(${i})">
      <div class="percorso-card-img-wrap"><img src="${p.mappa}" alt="${p.nome}">
        ${completata ? '<div class="percorso-card-completata-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Completato</div>' : ''}
      </div>
      <div class="percorso-card-body">
        <div class="percorso-card-num">${completata ? '<span class="percorso-card-num-completata">Completato</span>' : `Percorso ${i + 1}`}</div>
        <div class="percorso-card-title">${p.nome}</div>
        <div class="percorso-card-desc">${p.desc}</div>
        <div class="card-cta">${completata ? 'Rigioca →' : 'Inizia →'}</div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('game-area').innerHTML = `
    <div class="percorso-lista-wrapper">
      <div class="percorso-lista-titolo">Scegli il tuo percorso</div>
      <div class="percorso-lista-grid">${cardsHTML}</div>
    </div>`;
}

function avviaPercorso(idx) {
  suonaSeleziona();
  viaggioPercorsoIdx = idx;
  viaggioPosTappa = 0;
  viaggioTurnoCorrente = 0;
  viaggioDomandaIdx = 0;
  viaggioAiutoUsato = false;
  viaggioStato = 'domanda';
  viaggioErroriTappa = {};
  renderViaggioGioco();
}

function renderViaggioGioco() {
  const percorso = VIAGGIO_PERCORSI[viaggioPercorsoIdx];
  const domanda = percorso.domande[viaggioDomandaIdx];
  const lettere = ['A', 'B', 'C', 'D'];
  const turniRimasti = percorso.domande.length - viaggioDomandaIdx;

  const idxs = [0,1,2,3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  viaggioShuffledOpts = idxs.map(i => ({ testo: domanda.opzioni[i], originale: i }));
  const correttaShuffled = viaggioShuffledOpts.findIndex(o => o.originale === domanda.corretta);

  const tappeHTML = percorso.tappe.map((t, i) => {
    const isArrivo = i === percorso.tappe.length - 1;
    let cls = '';
    if (i < viaggioPosTappa) cls = 'completata';
    else if (i === viaggioPosTappa) cls = 'corrente';
    const label = isArrivo ? '★' : (i + 1);
    return `<div class="viaggio-tappa ${isArrivo ? 'arrivo' : ''} ${cls}" style="left:${t.coords[0]}%;top:${t.coords[1]}%">${label}</div>`;
  }).join('');

  const pos = percorso.tappe[viaggioPosTappa];

  const opzioniHTML = viaggioShuffledOpts.map((o, i) => `
    <button class="viaggio-opzione" id="vopt-${i}" onclick="viaggioRispondi(${i}, ${correttaShuffled})">
      <span class="viaggio-lettera">${lettere[i]}</span>
      ${o.testo}
    </button>`).join('');

  document.getElementById('game-area').innerHTML = `
    <div class="viaggio-outer">
      <div class="viaggio-mappa-col">
        <img class="viaggio-mappa-img" src="${percorso.mappaGioco}" alt="Mappa Delta">
        <svg id="viaggio-percorso-svg" class="viaggio-percorso-svg" xmlns="http://www.w3.org/2000/svg"></svg>
        ${tappeHTML}
        <div class="viaggio-segnalino" id="viaggio-seg" style="left:${pos.coords[0]}%;top:${pos.coords[1]}%">
          <svg width="52" height="68" viewBox="0 0 48 64">
            <ellipse cx="24" cy="62" rx="12" ry="4" fill="rgba(0,0,0,0.25)"/>
            <path d="M24 56 C16 44 8 36 8 24 C8 12 15 4 24 4 C33 4 40 12 40 24 C40 36 32 44 24 56Z" fill="#E86C3A" stroke="white" stroke-width="2.5"/>
            <circle cx="24" cy="24" r="10" fill="white"/>
            <circle cx="24" cy="24" r="7" fill="#E86C3A"/>
            <circle cx="21" cy="22" r="1.5" fill="white"/>
            <circle cx="27" cy="22" r="1.5" fill="white"/>
            <path d="M20 27 Q24 30 28 27" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="viaggio-turni-badge">
          <span class="viaggio-turni-num">${turniRimasti}</span>
          tentativi rimasti
        </div>
      </div>
      <div class="viaggio-domanda-col">
        <div>
          <div class="viaggio-tappa-label">Tappa ${viaggioPosTappa + 1} di ${percorso.tappe.length} · ${percorso.nome}</div>
          <div class="viaggio-tappa-nome">${percorso.tappe[viaggioPosTappa].nome}</div>
        </div>
        <div class="viaggio-domanda">${domanda.testo}</div>
        <div class="viaggio-opzioni" id="viaggio-opzioni">${opzioniHTML}</div>
        <div id="viaggio-feedback-area"></div>
        <div class="viaggio-azioni">
          <button class="viaggio-aiuto-btn" id="viaggio-aiuto-btn" onclick="viaggioMostraAiuto()">💡 Chiedi aiuto</button>
          <div id="viaggio-avanti"></div>
        </div>
        <div id="viaggio-suggerimento-area"></div>
      </div>
    </div>`;
  initViaggioPath();
}

function viaggioMostraAiuto() {
  const domanda = VIAGGIO_PERCORSI[viaggioPercorsoIdx].domande[viaggioDomandaIdx];
  viaggioAiutoUsato = true;
  suonaSeleziona();
  document.getElementById('viaggio-aiuto-btn').disabled = true;
  document.getElementById('viaggio-suggerimento-area').innerHTML =
    `<div class="viaggio-suggerimento">💡 ${domanda.suggerimento}</div>`;
}

function viaggioRispondi(idx, correttaIdx) {
  if (viaggioStato === 'feedback') return;
  viaggioStato = 'feedback';
  viaggioTurnoCorrente++;
  viaggioDomandaIdx++;

  const percorso = VIAGGIO_PERCORSI[viaggioPercorsoIdx];
  const domanda = percorso.domande[viaggioDomandaIdx - 1]; // -1 perché è già stato incrementato
  const corretta = idx === correttaIdx;
  const lettere = ['A','B','C','D'];

  document.querySelectorAll('.viaggio-opzione').forEach((btn, i) => {
    btn.disabled = true;
    if (i === correttaIdx) btn.classList.add('corretta');
    else if (i === idx && !corretta) btn.classList.add('sbagliata');
    else btn.classList.add('disabilitata');
  });

  let avanza = 0;
  let feedbackTitolo, feedbackTesto, feedbackCls;
  const correttaTesto = domanda.opzioni[domanda.corretta];

  if (corretta) {
    suonaCorretto();
    avanza = 1;
    const ultimaTappa = (viaggioPosTappa + 1) >= percorso.tappe.length - 1;
    feedbackTitolo = ultimaTappa ? 'Risposta esatta! Hai completato il percorso!' : 'Risposta esatta! Avanzi di una casella.';
    feedbackTesto = '';
    feedbackCls = 'pos';
  } else {
    suonaSbagliato();
    const errori = (viaggioErroriTappa[viaggioPosTappa] || 0) + 1;
    viaggioErroriTappa[viaggioPosTappa] = errori;
    avanza = -(errori - 1);
    if (avanza === 0) {
      feedbackTitolo = 'Risposta sbagliata. Resti fermo.';
    } else {
      const tappe = Math.abs(avanza);
      feedbackTitolo = `Risposta sbagliata. Torni indietro di ${tappe} ${tappe === 1 ? 'tappa' : 'tappe'}.`;
    }
    feedbackTesto = '';
    feedbackCls = 'neg';
  }

  const nuovaPosizione = Math.max(0, Math.min(percorso.tappe.length - 1, viaggioPosTappa + avanza));
  const arrivatoAllArrivo = corretta && nuovaPosizione === percorso.tappe.length - 1;
  const finitiTurni = !arrivatoAllArrivo && viaggioDomandaIdx >= percorso.domande.length;

  // Aggiorna subito il contatore tentativi senza aspettare "Continua"
  const turniNumEl = document.querySelector('.viaggio-turni-num');
  if (turniNumEl) turniNumEl.textContent = percorso.domande.length - viaggioDomandaIdx;

  const feedbackIcon = corretta
    ? `<div class="tick-wrap"><svg class="tick-svg" viewBox="0 0 52 52"><circle class="tick-circle" cx="26" cy="26" r="23"/><path class="tick-check" d="M14 26 l8 8 l16 -16"/></svg></div>`
    : `<div class="sad-wrap"><svg class="sad-svg" viewBox="0 0 52 52"><circle class="sad-circle" cx="26" cy="26" r="23"/><circle class="sad-eye-l" cx="18" cy="22" r="2.5"/><circle class="sad-eye-r" cx="34" cy="22" r="2.5"/><path class="sad-mouth" d="M17 34 Q26 26 35 34"/></svg></div>`;

  const fbArea = document.getElementById('viaggio-feedback-area');
  if (fbArea) fbArea.innerHTML = `
    <div class="viaggio-feedback ${feedbackCls}">
      <div class="viaggio-feedback-icon">${feedbackIcon}</div>
      <div class="viaggio-feedback-testo">
        <strong class="viaggio-feedback-titolo">${feedbackTitolo}</strong>
      </div>
    </div>`;

  const avantiEl = document.getElementById('viaggio-avanti');
  if (arrivatoAllArrivo) {
    suonaVittoria();
    setTimeout(esplodiCoriandoli, 300);
    avantiEl.innerHTML = `<button class="btn-primary" onclick="mostraRiepilogoViaggio(true, ${viaggioTurnoCorrente}, ${nuovaPosizione})">Guarda il risultato →</button>`;
  } else if (finitiTurni) {
    avantiEl.innerHTML = `<button class="btn-primary" onclick="mostraRiepilogoViaggio(false, ${viaggioTurnoCorrente}, ${nuovaPosizione})">Fine del percorso →</button>`;
  } else {
    avantiEl.innerHTML = `<button class="btn-primary" onclick="viaggioProssimo(${nuovaPosizione})">Continua →</button>`;
  }

  // Move segnalino lungo il percorso curvo
  const prevTappa = viaggioPosTappa;
  viaggioPosTappa = nuovaPosizione;
  if (avanza !== 0) {
    setTimeout(() => animateSegnalinoAlongPath(
      viaggioPathOffsets[prevTappa],
      viaggioPathOffsets[nuovaPosizione]
    ), 200);
  }

  const aiutoBtn = document.getElementById('viaggio-aiuto-btn');
  if (aiutoBtn) aiutoBtn.disabled = true;
}

function viaggioProssimo(nuovaPosizione) {
  viaggioPosTappa = nuovaPosizione;
  viaggioAiutoUsato = false;
  viaggioStato = 'domanda';
  renderViaggioGioco();
}

async function mostraRiepilogoViaggio(completato, turniUsati, tappeIdx) {
  if (completato) viaggioCompletati.add(viaggioPercorsoIdx);
  giochiCompletati.add('viaggio');
  const percorso = VIAGGIO_PERCORSI[viaggioPercorsoIdx];
  const tappeRaggiunte = tappeIdx + 1;
  const punteggio = Math.round((tappeRaggiunte / percorso.tappe.length) * 100);

  let emoji, titolo, desc;
  if (completato) { emoji = 'img/ic_feedback/feedback-1-risultato-perfetto.png'; titolo = 'Percorso completato!'; desc = `Hai attraversato tutto il Delta in ${turniUsati} turni. Ottimo esploratore!`; }
  else if (tappeRaggiunte >= 6) { emoji = 'img/ic_feedback/feedback-3-buon-risultato.png'; titolo = 'Quasi in fondo!'; desc = `Hai raggiunto la tappa ${tappeRaggiunte} di ${percorso.tappe.length}. Ci sei quasi!`; }
  else if (tappeRaggiunte >= 3) { emoji = 'img/ic_feedback/feedback-10-buon viaggio.png'; titolo = 'Buon viaggio!'; desc = `Hai raggiunto la tappa ${tappeRaggiunte} di ${percorso.tappe.length}. Continua a esplorare!`; }
  else { emoji = 'img/ic_feedback/feedback-6-riparti-dall-inizio.png'; titolo = 'Il Delta ti aspetta ancora!'; desc = `Hai raggiunto la tappa ${tappeRaggiunte} di ${percorso.tappe.length}. Riprova!`; }

  salvaInClassifica('viaggio', punteggio).catch(console.error);

  document.getElementById('game-area').innerHTML = `
    <div class="viaggio-riepilogo">
      <div class="riepilogo-emoji"><img src="${emoji}" alt=""></div>
      <div style="font-family:'Fraunces',serif;font-size:32px;font-weight:700;color:var(--verde-scuro)">${titolo}</div>
      <div style="font-size:18px;color:var(--testo-medio)">${desc}</div>
      <div style="font-family:'Fraunces',serif;font-size:64px;font-weight:700;color:var(--verde-scuro);line-height:1">${tappeRaggiunte}<span style="font-size:24px;color:var(--testo-medio)"> / ${percorso.tappe.length} tappe</span></div>
      ${profiloCorrente.partecipa ? `<button class="btn-link-secondario" onclick="mostraLeaderboard('viaggio', ${punteggio})">🏆 Guarda la classifica</button>` : ''}
      <div class="riepilogo-azioni">
        <button class="btn-secondary" onclick="renderViaggioLista()">Scegli un altro percorso</button>
        <button class="btn-primary" onclick="backToSelect()">Scegli un altro gioco</button>
      </div>
    </div>`;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() { showScreen('screen-home'); }

const GIOCHI_PRIMARIA = [
  { tipo: 'quiz', icon: 'quiz', img: 'img/ic_giochi/ic_primaria_gioco_1.png', num: 'Gioco 1', titolo: 'Quiz del Delta', desc: 'Rispondi a 10 domande sul Delta del Po. Scegli la risposta giusta tra quattro opzioni.' },
  { tipo: 'abbinamento', icon: 'join', img: 'img/ic_giochi/ic_primaria_gioco_2.png', num: 'Gioco 2', titolo: 'Metti al posto giusto', desc: 'Abbina ogni elemento alla categoria giusta: flora, fauna, attività umane o ambienti del Delta.' },
  { tipo: "sequenze", icon: "reorder", img: "img/ic_giochi/ic_primaria_gioco_3.png", num: "Gioco 3", titolo: "Rimetti in ordine", desc: "Scegli una storia del Delta e rimetti le tessere nell'ordine giusto." },
];

const GIOCHI_SECONDARIA = [
  { tipo: 'quiz-sec', icon: 'timer', img: 'img/ic_giochi/ic_secondaria_gioco_1.png', num: 'Gioco 1', titolo: 'Quiz a Tempo', desc: 'Rispondi a 10 domande in 20 secondi ciascuna. Più sei veloce, più punti guadagni!', leaderboard: 'quiz-sec' },
  { tipo: 'viaggio', icon: 'explore', img: 'img/ic_giochi/ic_secondaria_gioco_2.png', num: 'Gioco 2', titolo: 'In viaggio nel Delta', desc: 'Avanza lungo il Delta rispondendo alle domande. Più sei preciso, più lontano arrivi!', leaderboard: 'viaggio' },
  { tipo: 'gestisci', icon: 'eco', img: 'img/ic_giochi/ic_secondaria_gioco_3.png', num: 'Gioco 3', titolo: 'Gestisci il Delta', desc: 'Prendi decisioni difficili e scopri come le tue scelte influenzano natura, economia e comunità.', leaderboard: 'gestisci' },
];





function aggiornaFasciaBadge() {
  const badge = document.getElementById('fascia-badge');
  const chip = document.getElementById('profilo-chip');
  const av = document.getElementById('chip-avatar');
  const nm = document.getElementById('chip-nome');

  // Badge sempre visibile
  if (badge) {
    badge.style.display = '';
    badge.textContent = currentFascia === 'primaria' ? 'Primaria · 6–10 anni' : 'Secondaria · 11–14 anni';
  }

  // Chip accanto al badge solo se secondaria e partecipa
  if (currentFascia === 'secondaria' && profiloCorrente.partecipa) {
    if (chip) chip.style.display = 'flex';
    if (av) av.innerHTML = `<img src="${profiloCorrente.avatar || 'img/avatar/teen_avatar_01.png'}" style="width:100%;height:100%;object-fit:cover;">`;
    if (nm) nm.textContent = profiloCorrente.nome;
  } else {
    if (chip) chip.style.display = 'none';
  }
}

function startGame(tipo) {
  _currentGiocoType = tipo;
  showScreen('screen-game');
  const titles = { quiz: 'Quiz del Delta', abbinamento: 'Metti al posto giusto', sequenze: 'Rimetti in ordine', 'quiz-sec': 'Quiz a Tempo' };
  document.getElementById('game-header-title').textContent = titles[tipo];
  aggiornaFasciaBadge();
  if (tipo === 'quiz') initQuiz();
  else if (tipo === 'abbinamento') initAbbinamento();
  else if (tipo === 'quiz-sec') { _currentGiocoType = 'quiz-sec'; mostraSchermataVelocita(); return; }
  else if (tipo === 'viaggio') {
    document.getElementById('game-header-title').textContent = 'In viaggio nel Delta';
    aggiornaFasciaBadge();
    initViaggio();
  }
  else if (tipo === 'gestisci') {
    document.getElementById('game-header-title').textContent = 'Gestisci il Delta';
    aggiornaFasciaBadge();
    initGestisci();
  }
  else if (tipo === 'sequenze') initSequenze();
  else {
    document.getElementById('game-area').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px;color:var(--testo-medio);">
        <div style="font-family:'Fraunces',serif;font-size:28px;color:var(--verde-scuro);">In costruzione</div>
        <div style="font-size:15px;">Il gioco <strong>${titles[tipo]}</strong> sarà disponibile a breve.</div>
      </div>`;
  }
}

/* ══════════════════════════════════════
   GIOCO 1 — QUIZ
══════════════════════════════════════ */
const QUIZ_DOMANDE = [
  {
    domanda: "Quale grande fiume forma il Delta del Po?",
    opzioni: ["Po", "Adige", "Reno", "Brenta"],
    corretta: 0,
    foto: "img/primaria_1/1_01_fiume_po.png",
    fotoCaption: "Il fiume Po attraversa la città di Torino"
  },
  {
    domanda: "Quale uccello rosa si può vedere nelle zone umide del Delta?",
    opzioni: ["Airone rosso", "Fenicottero", "Spatola", "Gabbiano roseo"],
    opzioniFoto: ["img/primaria_1/2-Airone-rosso.png","img/primaria_1/2-Fenicottero.png","img/primaria_1/2-Spatola.png","img/primaria_1/2-Gabbiano-rosa.png"],
    layoutFoto: '2x2',
    corretta: 1,
    foto: "img/primaria_1/1_02_fenicottero.png",
    fotoCaption: "Il fenicottero rosa"
  },
  {
    domanda: "Che cosa sono le valli da pesca?",
    opzioni: [
      "Zone d'acqua controllate dall'uomo per allevare pesci",
      "Piccoli fiumi che scorrono tra gli argini",
      "Campi bassi che si allagano dopo la pioggia",
      "Laghetti naturali circondati da canneti"
    ],
    corretta: 0,
    foto: "img/primaria_1/1_03_valli_da_pesca.png",
    fotoCaption: "Una valle da pesca nel Delta"
  },
  {
    domanda: "Quale pianta cresce spesso vicino all'acqua nel Delta?",
    opzioni: ["Salicornia", "Canna palustre", "Tamerice", "Giunco marino"],
    opzioniFoto: ["img/primaria_1/4-Salicomia.png","img/primaria_1/4-Canna-palustre.png","img/primaria_1/4-Tamerice.png","img/primaria_1/4-Giunco-marino.png"],
    layoutFoto: '2x2',
    corretta: 1,
    foto: "img/primaria_1/1_04_canna_palustre.png",
    fotoCaption: "La canna palustre"
  },
  {
    domanda: "Quale animale vive nelle acque del Delta?",
    opzioni: ["Luccio", "Polpo", "Spigola", "Tinca"],
    opzioniFoto: ["img/primaria_1/5-Luccio.png","img/primaria_1/5-Polpo.png","img/primaria_1/5-Spigola.png","img/primaria_1/5-Tinca.png"],
    layoutFoto: '2x2',
    corretta: 2,
    foto: "img/primaria_1/1_05_spigola.png",
    fotoCaption: "La spigola"
  },
  {
    domanda: "Il Delta del Po è importante perché ospita molti…",
    opzioni: [
      "Ambienti diversi, piante e animali",
      "Grandi boschi",
      "Campi coltivati solo a riso",
      "Laghi profondi"
    ],
    corretta: 0,
    foto: "img/primaria_1/1_06_biodiversita.png",
    fotoCaption: "La biodiversità del Delta del Po"
  },
  {
    domanda: "Quale attività tradizionale si pratica nel Delta?",
    opzioni: [
      "Coltivazione della vite",
      "Pesca nelle lagune e nei canali",
      "Allevamento delle pecore",
      "Taglio del legname nei pioppeti"
    ],
    opzioniFoto: ["img/primaria_1/7-Vigneto.png","img/primaria_1/7-Pesca.png","img/primaria_1/7-Pecore.png","img/primaria_1/7-Pioppeto.png"],
    layoutFoto: '2x2',
    corretta: 1,
    foto: "img/primaria_1/1_07_pesca.png",
    fotoCaption: "La pesca tradizionale nel Delta"
  },
  {
    domanda: "Quale mezzo si usa spesso per muoversi nei canali?",
    opzioni: ["Barca a fondo piatto", "Bicicletta d'acqua", "Piccolo traghetto", "Moto d'acqua"],
    opzioniFoto: ["img/primaria_1/8-Barca.png","img/primaria_1/8-Bicicletta-acqua.png","img/primaria_1/8-Traghetto.png","img/primaria_1/8-Moto-acqua.png"],
    layoutFoto: '2x2',
    corretta: 0,
    foto: "img/primaria_1/1_08_barca_fondo_piatto.png",
    fotoCaption: "Una barca a fondo piatto"
  },
  {
    domanda: "Dove vivono molti uccelli del Delta del Po?",
    opzioni: [
      "Nei campanili dei paesi",
      "Tra canneti, lagune e zone umide",
      "Nei boschi di pioppeti",
      "Sulle scogliere"
    ],
    opzioniFoto: ["img/primaria_1/9-Campanile.png","img/primaria_1/9-Laguna.png","img/primaria_1/9-Bosco-pioppi.png","img/primaria_1/9-Scogliera.png"],
    layoutFoto: '2x2',
    corretta: 1,
    foto: "img/primaria_1/1_09_canneti.png",
    fotoCaption: "Uccelli nel loro habitat composto da zone umide"
  },
  {
    domanda: "Quale mollusco viene allevato nelle lagune del Delta?",
    opzioni: ["Cozze", "Patella", "Tellina", "Chiocciola di mare"],
    opzioniFoto: ["img/primaria_1/10-Ostrica.png","img/primaria_1/10-Patella.png","img/primaria_1/10-Tellina.png","img/primaria_1/10-Chiocciola.png"],
    layoutFoto: '2x2',
    corretta: 0,
    foto: "img/primaria_1/1_10_cozza.png",
    fotoCaption: "Le cozze allevate nelle lagune"
  }
];

let quizIndex = 0;
let quizPunteggio = 0;
let quizRisposte = []; // {corretta: bool}
let quizStato = 'domanda'; // 'domanda' | 'feedback'
let quizSbagliate = new Set(); // indici domande sbagliate almeno una volta

function shuffleOpzioni(q) {
  const indices = q.opzioni.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    ...q,
    opzioni: indices.map(i => q.opzioni[i]),
    opzioniFoto: q.opzioniFoto ? indices.map(i => q.opzioniFoto[i]) : null,
    corretta: indices.indexOf(q.corretta)
  };
}

let QUIZ_SHUFFLED = [];

function initQuiz() {
  quizIndex = 0;
  quizPunteggio = 0;
  quizRisposte = [];
  quizStato = 'domanda';
  quizSbagliate = new Set();
  QUIZ_SHUFFLED = QUIZ_DOMANDE.map(shuffleOpzioni);
  renderQuiz();
}

function buildStepper() {
  const total = QUIZ_DOMANDE.length;
  let html = '';
  for (let i = 0; i < total; i++) {
    const cls = i < quizIndex ? 'done' : i === quizIndex ? 'current' : 'todo';
    const label = i < quizIndex ? '✓' : (i + 1);
    html += `<div class="quiz-step ${cls}">${label}</div>`;
    if (i < total - 1) html += `<div class="quiz-step-line ${i < quizIndex ? 'done' : ''}"></div>`;
  }
  return html;
}

function renderQuiz() {
  const pl = document.getElementById('progress-label'); if (pl) pl.textContent = '';
  const q = QUIZ_SHUFFLED[quizIndex];
  const lettere = ['A', 'B', 'C', 'D'];

  const opzioniHTML = q.opzioniFoto
    ? `<div class="quiz-opzioni-foto${q.layoutFoto === '2x2' ? ' layout-2x2' : ''}" id="quiz-opzioni">
        ${q.opzioni.map((op, i) => {
          const url = q.opzioniFoto[i];
          const fotoEl = url
            ? `<img src="${url}" alt="${op}" onerror="this.style.display='none'">`
            : placeholderFoto(40, 'quiz-foto-placeholder');
          return `<button class="quiz-opzione-foto" id="opzione-${i}" onclick="rispondi(${i})">
            ${fotoEl}
            <div class="quiz-opzione-foto-label">
              <span class="quiz-lettera">${lettere[i]}</span>
              <span class="quiz-testo">${op}</span>
            </div>
          </button>`;
        }).join('')}
      </div>`
    : `<div class="quiz-opzioni" id="quiz-opzioni">
        ${q.opzioni.map((op, i) => `
          <button class="quiz-opzione" id="opzione-${i}" onclick="rispondi(${i})">
            <span class="quiz-lettera">${lettere[i]}</span>
            <span class="quiz-testo">${op}</span>
          </button>
        `).join('')}
      </div>`;

  document.getElementById('game-area').innerHTML = `
    <div class="quiz-outer">
      <div class="quiz-stepper">${buildStepper()}</div>
      <div class="quiz-wrap">
        <div class="quiz-top">
          <div class="quiz-domanda">${q.domanda}</div>
        </div>
        <div class="quiz-middle">
          ${opzioniHTML}
        </div>
        <div class="quiz-bottom" id="quiz-bottom"></div>
      </div>
    </div>`;
}

function rispondi(idx) {
  if (quizStato === 'feedback') return;
  suonaSeleziona();

  const q = QUIZ_SHUFFLED[quizIndex];
  const corretta = idx === q.corretta;
  const wrap = document.querySelector('.quiz-wrap');

  const bottom = document.getElementById('quiz-bottom');
  const middle = document.querySelector('.quiz-middle');

  if (corretta) {
    quizStato = 'feedback';
    const giasbagliata = quizSbagliate.has(quizIndex);
    if (!giasbagliata) quizPunteggio++;
    quizRisposte.push({ corretta: !giasbagliata });
    suonaCorretto();

    // Sostituisci opzioni con foto nella zona centrale
    const opzioniEl = document.getElementById('quiz-opzioni');
    if (q.foto && opzioniEl) {
      const fotoEl = document.createElement('div');
      fotoEl.className = 'quiz-foto-area';
      fotoEl.innerHTML = `
        <img class="quiz-foto-grande" src="${q.foto}" alt="${q.fotoCaption || ''}" onerror="this.style.display='none'">
        ${q.fotoCaption ? `<div class="quiz-foto-caption-grande">${q.fotoCaption}</div>` : ''}`;
      opzioniEl.replaceWith(fotoEl);
    }

    // Feedback + CTA nella zona bottom
    const isUltima = quizIndex === QUIZ_DOMANDE.length - 1;
    bottom.innerHTML = `
      <div class="quiz-feedback quiz-feedback-ok">
        <div class="tick-wrap">
          <svg class="tick-svg" viewBox="0 0 52 52">
            <circle class="tick-circle" cx="26" cy="26" r="23"/>
            <path class="tick-check" d="M14 26 l8 8 l16 -16"/>
          </svg>
        </div>
        Esatto! Ottima risposta.
      </div>
      <div class="quiz-btn-wrap">
        <button class="btn-primary" onclick="${isUltima ? 'mostraRiepilogo()' : 'prossimadomanda()'}">${isUltima ? 'Vedi il risultato →' : 'Prossima domanda →'}</button>
      </div>`;


  } else {
    quizStato = 'feedback';
    quizSbagliate.add(quizIndex);
    const btnSbagliato = document.getElementById('opzione-' + idx);
    btnSbagliato.classList.add('sbagliata');
    btnSbagliato.disabled = true;

    suonaSbagliato();
    bottom.innerHTML = `
      <div class="quiz-feedback quiz-feedback-no">
        <div class="sad-wrap">
          <svg class="sad-svg" viewBox="0 0 52 52">
            <circle class="sad-circle" cx="26" cy="26" r="23"/>
            <circle class="sad-eye-l" cx="18" cy="22" r="2.5"/>
            <circle class="sad-eye-r" cx="34" cy="22" r="2.5"/>
            <path class="sad-mouth" d="M17 34 Q26 26 35 34"/>
          </svg>
        </div>
        Non è quella giusta. Riprova!
      </div>
      <div class="quiz-btn-wrap quiz-btn-wrap-sbagliata">
        <button class="btn-link-secondario" onclick="mostraRispostaCorretta()">Mostra la risposta</button>
        <button class="btn-primary" onclick="riprova()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Riprova
        </button>
      </div>`;
  }
}

function riprova() {
  quizStato = 'domanda';
  document.querySelectorAll('.quiz-opzione, .quiz-opzione-foto').forEach(btn => {
    if (!btn.classList.contains('sbagliata')) btn.disabled = false;
  });
  const bottom = document.getElementById('quiz-bottom');
  if (bottom) bottom.innerHTML = '';
}

function mostraRispostaCorretta() {
  const q = QUIZ_SHUFFLED[quizIndex];
  if (!quizRisposte[quizIndex]) quizRisposte.push({ corretta: false });

  document.querySelectorAll('.quiz-opzione, .quiz-opzione-foto').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.corretta) btn.classList.add('corretta');
    else if (!btn.classList.contains('sbagliata')) btn.classList.add('disabilitata');
  });

  const bottom = document.getElementById('quiz-bottom');
  if (bottom) bottom.innerHTML = '';

  // Sostituisci opzioni con foto nella zona centrale
  const opzioniEl = document.getElementById('quiz-opzioni');
  if (q.foto && opzioniEl) {
    const fotoEl = document.createElement('div');
    fotoEl.className = 'quiz-foto-area';
    fotoEl.innerHTML = `
      <img class="quiz-foto-grande" src="${q.foto}" alt="${q.fotoCaption || ''}" onerror="this.style.display='none'">
      ${q.fotoCaption ? `<div class="quiz-foto-caption-grande">${q.fotoCaption}</div>` : ''}`;
    opzioniEl.replaceWith(fotoEl);
  }

  const isUltima = quizIndex === QUIZ_DOMANDE.length - 1;
  if (bottom) bottom.innerHTML = `
    <div class="quiz-feedback quiz-feedback-no"><span class="quiz-feedback-icon">✕</span> La risposta corretta era: <strong>${['A','B','C','D'][q.corretta]}. ${q.opzioni[q.corretta]}</strong>.</div>
    <div class="quiz-btn-wrap">
      <button class="btn-primary" onclick="${isUltima ? 'mostraRiepilogo()' : 'prossimadomanda()'}">${isUltima ? 'Vedi il risultato →' : 'Prossima domanda →'}</button>
    </div>`;
}


function prossimadomanda() {
  quizIndex++;
  quizStato = 'domanda';
  renderQuiz();
}

function mostraRiepilogo() {
  let titolo, sottotitolo, emoji;
  if (quizPunteggio === 10)    { titolo = "Risultato perfetto!"; sottotitolo = "Sei un vero esperto del Delta del Po."; emoji = 'img/ic_feedback/feedback-1-risultato-perfetto.png'; }
  else if (quizPunteggio >= 8) { titolo = "Ottimo risultato!"; sottotitolo = "Conosci benissimo il Delta del Po."; emoji = 'img/ic_feedback/feedback-2-ottimo.png'; }
  else if (quizPunteggio >= 6) { titolo = "Buon risultato!"; sottotitolo = "Hai ancora qualcosa da scoprire."; emoji = 'img/ic_feedback/feedback-3-buon-risultato.png'; }
  else if (quizPunteggio >= 4) { titolo = "Ci siamo quasi!"; sottotitolo = "Riprova e impara di più sul Delta."; emoji = 'img/ic_feedback/feedback-4-ci-siamo-quasi.png'; }
  else if (quizPunteggio >= 1) { titolo = "Continua a esplorare!"; sottotitolo = "Il Delta ha ancora tanti segreti per te."; emoji = 'img/ic_feedback/feedback-5-continua-ad-esplorare.png'; }
  else                          { titolo = "Riparti dall'inizio!"; sottotitolo = "Il Delta del Po ti aspetta."; emoji = 'img/ic_feedback/feedback-6-riparti-dall-inizio.png'; }

  document.getElementById('game-area').innerHTML = `
    <div class="riepilogo-wrap">
      <div class="riepilogo-emoji"><img src="${emoji}" alt=""></div>
      <div class="riepilogo-titolo">${titolo}</div>
      <div class="riepilogo-sottotitolo">${sottotitolo}</div>
      <div class="riepilogo-score-label">Il tuo punteggio è</div>
      <div class="riepilogo-punteggio">
        <span class="riepilogo-num">${quizPunteggio}</span>
        <span class="riepilogo-su">su ${QUIZ_DOMANDE.length}</span>
      </div>
      <div class="riepilogo-azioni">
        <button class="btn-secondary" onclick="initQuiz()">Rigioca</button>
        <button class="btn-primary" onclick="backToSelect()">Scegli un altro gioco</button>
      </div>
    </div>`;
  if (quizPunteggio >= 8) setTimeout(esplodiCoriandoli, 300);
  setTimeout(suonaVittoria, 100);
}


/* ── PROGRESS BAR ── */
function setProgress(current, total) {
  // progress gestita dallo stepper nel quiz — nessun elemento header da aggiornare
}

/* ── CONFETTI BURST ── */
function confettiBurst() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const colori = ['#5B9E9A','#2D5F5D','#D4B896','#F5C842','#E86C3A','#7DC67A','#A8CECE','#E84393','#fff'];
  const forme = ['rect','circle','ribbon'];

  const particelle = Array.from({ length: 200 }, () => {
    const angolo = Math.random() * Math.PI * 2;
    const velocita = 6 + Math.random() * 14;
    return {
      x: cx, y: cy,
      vx: Math.cos(angolo) * velocita,
      vy: Math.sin(angolo) * velocita - (Math.random() * 4),
      w: 7 + Math.random() * 10,
      h: 4 + Math.random() * 7,
      colore: colori[Math.floor(Math.random() * colori.length)],
      forma: forme[Math.floor(Math.random() * forme.length)],
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.25,
      opacity: 1,
    };
  });

  let frame;
  let t = 0;
  const durata = 100;

  function disegna() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t++;
    particelle.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.vx *= 0.98;
      p.rot += p.vrot;
      p.opacity = t < durata * 0.6 ? 1 : 1 - (t - durata * 0.6) / (durata * 0.4);

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.colore;
      if (p.forma === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.forma === 'ribbon') {
        ctx.beginPath();
        ctx.moveTo(-p.w/2, -p.h/2);
        ctx.lineTo(p.w/2, 0);
        ctx.lineTo(-p.w/2, p.h/2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      }
      ctx.restore();
    });

    if (t < durata) {
      frame = requestAnimationFrame(disegna);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  if (frame) cancelAnimationFrame(frame);
  disegna();
}

/* ── CORIANDOLI ESPLOSIONE ── */
function esplodiCoriandoli() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const colori = [
    '#5B9E9A','#2D5F5D','#D4B896','#A8CECE',
    '#F5C842','#E86C3A','#7DC67A','#E84393','#fff'
  ];
  const forme = ['rect','circle','ribbon'];

  const particelle = Array.from({ length: 180 }, () => {
    const angolo = Math.random() * Math.PI * 2;
    const velocita = 6 + Math.random() * 14;
    return {
      x: cx, y: cy,
      vx: Math.cos(angolo) * velocita,
      vy: Math.sin(angolo) * velocita,
      w: 7 + Math.random() * 10,
      h: 4 + Math.random() * 7,
      colore: colori[Math.floor(Math.random() * colori.length)],
      forma: forme[Math.floor(Math.random() * forme.length)],
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.25,
      opacity: 1,
    };
  });

  let frame;
  let t = 0;
  const durata = 100;

  function disegna() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t++;

    particelle.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.vx *= 0.98;
      p.rot += p.vrot;
      p.opacity = t < durata * 0.6 ? 1 : 1 - (t - durata * 0.6) / (durata * 0.4);

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.colore;

      if (p.forma === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.forma === 'ribbon') {
        ctx.beginPath();
        ctx.moveTo(-p.w/2, -p.h/2);
        ctx.lineTo(p.w/2, 0);
        ctx.lineTo(-p.w/2, p.h/2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      }
      ctx.restore();
    });

    if (t < durata) {
      frame = requestAnimationFrame(disegna);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  if (frame) cancelAnimationFrame(frame);
  disegna();
}

/* ── AUDIO FEEDBACK ── */
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function suonaSeleziona() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.04;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(t);
  source.stop(t + 0.05);
}

function suonaCorretto() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  // Accordo Do-Mi-Sol — morbido, breve
  const note = [261.63, 329.63, 392.00];
  note.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.04);
    gain.gain.linearRampToValueAtTime(0.12, t + i * 0.04 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.5);
    osc.start(t + i * 0.04);
    osc.stop(t + i * 0.04 + 0.6);
  });
}

function suonaTempoScaduto() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  // Tre toni discendenti più marcati
  [[440, 0], [330, 0.22], [220, 0.44]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Secondo oscillatore per spessore
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc.type = 'triangle';
    osc2.type = 'sine';
    osc.frequency.value = freq;
    osc2.frequency.value = freq * 0.5;
    gain.gain.setValueAtTime(0, t + delay);
    gain.gain.linearRampToValueAtTime(0.32, t + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);
    gain2.gain.setValueAtTime(0, t + delay);
    gain2.gain.linearRampToValueAtTime(0.12, t + delay + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);
    osc.start(t + delay); osc2.start(t + delay);
    osc.stop(t + delay + 0.4); osc2.stop(t + delay + 0.4);
  });
}

function suonaTickTock() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  // Suono morbido tipo orologio — tono basso e breve
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 480;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.15);
}

function suonaVittoria() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const note = [261.63, 293.66, 329.63, 392.00];
  const durate = [0.18, 0.18, 0.18, 0.55];
  let offset = 0;
  note.forEach((freq, i) => {
    // Oscillatore principale (sine — più caldo)
    const osc = ctx.createOscillator();
    // Vibrato leggero
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    const gain = ctx.createGain();

    vibrato.type = 'sine';
    vibrato.frequency.value = 5.5;
    vibratoGain.gain.value = freq * 0.012;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Secondo osclillatore un'ottava sopra, molto attenuato, per calore
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    gain2.gain.value = 0.04;
    osc2.connect(gain2);
    gain2.connect(gain);

    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, t + offset);
    gain.gain.linearRampToValueAtTime(0.13, t + offset + 0.04);
    gain.gain.setValueAtTime(0.13, t + offset + durate[i] * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + durate[i]);

    osc.start(t + offset);
    osc2.start(t + offset);
    vibrato.start(t + offset);
    osc.stop(t + offset + durate[i] + 0.05);
    osc2.stop(t + offset + durate[i] + 0.05);
    vibrato.stop(t + offset + durate[i] + 0.05);

    offset += durate[i] * 0.82;
  });
}

function suonaNeutro() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  // Due note uguali piatte — né su né giù
  [0, 0.18].forEach(delay => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 330;
    gain.gain.setValueAtTime(0, t + delay);
    gain.gain.linearRampToValueAtTime(0.1, t + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.22);
    osc.start(t + delay);
    osc.stop(t + delay + 0.25);
  });
}

function suonaSbagliato() {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  // Tono basso smorzato — breve discesa
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.3);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.start(t);
  osc.stop(t + 0.45);
}

/* ── TAP RIPPLE ── */
document.addEventListener('pointerdown', e => {
  const el = document.createElement('div');
  el.className = 'tap-feedback';
  el.style.left = e.clientX + 'px';
  el.style.top = e.clientY + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 500);
});
