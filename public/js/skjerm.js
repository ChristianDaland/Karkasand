// Storskjermen: viser lobbyen med QR-kode, brettet, spillerpanelene og resultatet.

import { BrettVisning } from './brett.js';
import { lastBilder, brikkeUrl, vikingSvg, elementFra, PLASS_GRADER, PLASS_NAVN, GRUNN } from './felles.js';
import { VIKINGER_PER_SPILLER } from '/delt/motor.js';

const $ = (id) => document.getElementById(id);
const socket = io();
const params = new URLSearchParams(location.search);
let kode = location.pathname.split('/')[2];
let modus = params.get('modus');
let sisteMelding = 0;
let meldingTimer;

await lastBilder();
const brett = new BrettVisning($('brett'));

socket.on('connect', () => {
  socket.emit('skjerm:koble', { kode, modus }, (svar) => {
    if (kode !== svar.kode) {
      kode = svar.kode;
      history.replaceState(null, '', `/skjerm/${kode}`);
    }
    modus = null; // modus sendes bare første gang
    $('qr').src = `/qr/${kode}.svg`;
    $('liten-qr').src = `/qr/${kode}.svg`;
    fetch(`/api/adresse/${kode}`).then((r) => r.json()).then(({ url }) => ($('adresse').textContent = url));
  });
});

socket.on('tilstand', vis);

$('bytt-modus').addEventListener('click', () => {
  socket.emit('skjerm:modus', document.body.dataset.modus === 'tv' ? 'bord' : 'tv');
});

// Hold skjermen våken mens spillet står fremme
async function holdVaaken() {
  try {
    await navigator.wakeLock?.request('screen');
  } catch {
    // ikke støttet eller ikke tillatt
  }
}
holdVaaken();
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && holdVaaken());

function vis(rom) {
  document.body.dataset.modus = rom.modus;
  const spill = rom.spill;
  $('lobby').hidden = Boolean(spill);
  $('info').hidden = !spill;
  if (!spill) {
    visLobby(rom);
    $('paneler').replaceChildren();
    $('slutt').hidden = true;
    $('liten-qr').hidden = true;
    return;
  }

  brett.oppdater(spill, spill.spillere);
  visPaneler(rom);
  visMelding(spill);
  $('igjen').textContent = spill.igjen;
  $('liten-qr').hidden = rom.spillere.every((s) => s.tilkoblet) || spill.fase === 'slutt';
  visSlutt(spill);
}

function visLobby(rom) {
  const liste = $('lobby-liste');
  liste.replaceChildren();
  for (const s of rom.spillere) {
    const plass = rom.modus === 'bord' ? `${PLASS_NAVN[s.plass]} side` : '';
    const li = elementFra(
      `<li><span class="prikk" style="background:${s.farge}"></span><span></span><span class="plass">${plass}</span></li>`,
    );
    li.children[1].textContent = s.navn + (s.tilkoblet ? '' : ' (frakoblet)');
    liste.append(li);
  }
  for (let i = rom.spillere.length; i < rom.maksSpillere; i++) {
    liste.append(elementFra('<li class="tom">Venter på spiller …</li>'));
  }
  const klare = rom.spillere.length >= rom.minSpillere;
  $('lobby-status').textContent = klare
    ? 'Alle er med! Trykk «Start spillet» på en av mobilene.'
    : `Venter på spillere (${rom.spillere.length} av ${rom.maksSpillere}).`;
  $('bytt-modus').textContent = rom.modus === 'tv' ? 'Bytt til bordmodus (prosjektor)' : 'Bytt til skjermmodus (TV)';
}

function visPaneler(rom) {
  const spill = rom.spill;
  const beholder = $('paneler');
  spill.spillere.forEach((s, i) => {
    let panel = beholder.children[i];
    if (!panel) {
      panel = elementFra(`
        <div class="panel">
          <div class="navn"><span class="prikk"></span><span class="tekst"></span></div>
          <div class="poeng"></div>
          <div class="vikinger"></div>
          <div class="tur-tekst"></div>
          <div class="frakoblet" hidden>Frakoblet. Skann QR-koden igjen.</div>
          <img class="neste" alt="" hidden>
        </div>`);
      beholder.append(panel);
    }
    const info = rom.spillere.find((r) => r.id === s.id) ?? {};
    const plass = info.plass ?? 'S';
    const harTur = spill.tur === i && spill.fase !== 'slutt';
    panel.className = `panel side-${i} plass-${plass}${harTur ? ' tur' : ''}`;
    panel.style.setProperty('--farge', s.farge);
    panel.querySelector('.tekst').textContent = s.navn;
    panel.querySelector('.poeng').innerHTML = `${s.poeng}<small> poeng</small>`;

    const vikinger = panel.querySelector('.vikinger');
    if (vikinger.dataset.farge !== s.farge) {
      vikinger.replaceChildren(
        ...Array.from({ length: VIKINGER_PER_SPILLER }, () => elementFra(`<span>${vikingSvg(s.farge)}</span>`)),
      );
      vikinger.dataset.farge = s.farge;
    }
    [...vikinger.children].forEach((v, n) => v.classList.toggle('borte', n >= s.vikinger));

    let turTekst = '';
    if (harTur) turTekst = spill.fase === 'viking' ? 'Setter ut viking …' : 'Legger brikke …';
    panel.querySelector('.tur-tekst').textContent = turTekst;
    panel.querySelector('.frakoblet').hidden = info.tilkoblet !== false;

    // Brikken som skal legges, vist i samme retning som på brettet
    const neste = panel.querySelector('.neste');
    neste.hidden = !(harTur && spill.fase === 'legg' && spill.aktiv);
    if (!neste.hidden) {
      const url = brikkeUrl(spill.aktiv.brikke.id, spill.aktiv.brikke.nr);
      if (neste.getAttribute('src') !== url) neste.src = url;
      const panelSnu = rom.modus === 'bord' ? PLASS_GRADER[plass] : 0;
      neste.style.transform = `rotate(${spill.aktiv.rot * 90 + panelSnu}deg)`;
    }
  });
  while (beholder.children.length > spill.spillere.length) beholder.lastElementChild.remove();
}

function visMelding(spill) {
  const siste = spill.hendelser.at(-1)?.nr ?? 0;
  if (siste < sisteMelding) sisteMelding = 0; // nytt spill
  const nye = spill.hendelser.filter((h) => h.nr > sisteMelding && h.type === 'poeng');
  const forste = sisteMelding === 0;
  sisteMelding = siste;
  if (forste || !nye.length) return;
  const tekst = nye
    .map((h) => `${spill.spillere[h.spiller].navn} fikk ${h.poeng} poeng for ${GRUNN[h.grunn].toLowerCase()}!`)
    .join('  ·  ');
  const el = $('melding');
  el.textContent = tekst;
  el.hidden = false;
  clearTimeout(meldingTimer);
  meldingTimer = setTimeout(() => (el.hidden = true), 3500);
}

function visSlutt(spill) {
  $('slutt').hidden = spill.fase !== 'slutt';
  if (spill.fase !== 'slutt') return;
  const rangert = spill.spillere.map((s, i) => ({ ...s, i })).sort((a, b) => b.poeng - a.poeng);
  $('resultat').replaceChildren(
    ...rangert.map((s) => {
      const vinner = spill.resultat?.vinnere.includes(s.i);
      const li = elementFra(
        `<li class="${vinner ? 'vinner' : ''}"><span class="prikk" style="background:${s.farge}"></span><span></span><span class="p">${s.poeng}</span></li>`,
      );
      li.children[1].textContent = (vinner ? '👑 ' : '') + s.navn;
      return li;
    }),
  );
}
