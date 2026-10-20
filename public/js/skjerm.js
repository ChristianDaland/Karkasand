// Storskjermen: viser lobbyen med QR-kode, brettet, spillerpanelene og resultatet.

import { BrettVisning } from './brett.js';
import { lastBilder, brikkeUrl, vikingSvg, figurSvg, vareSvg, elementFra, PLASS_GRADER, PLASS_NAVN, GRUNN } from './felles.js';
import { VARER } from '/delt/brikker.js';
import { VIKINGER_PER_SPILLER } from '/delt/motor.js';
import { brikkeTekst } from './brikkehjelp.js';

const $ = (id) => document.getElementById(id);
// Bildelisten hentes før socketen lages. Ellers kan «connect» komme mens vi venter,
// før lytterne er satt opp, og siden blir stående uten å koble til.
await lastBilder();
const socket = io();
const params = new URLSearchParams(location.search);
let kode = location.pathname.split('/')[2];
let modus = params.get('modus');
let sisteMelding = 0;
let meldingTimer;

const brett = new BrettVisning($('brett'));
const panelene = []; // spillerpanelene, i samme rekkefølge som spillerne
let sisteRom = null;
let opptelling = null; // { avbrutt } mens sluttellingen spilles av
let opptellingVist = false; // sluttellingen for dette spillet er spilt av

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

socket.on('tilstand', (rom) => {
  sisteRom = rom;
  vis(rom);
});

$('skjul-resultat').addEventListener('click', () => {
  const skjult = !$('slutt-innhold').hidden;
  $('slutt-innhold').hidden = skjult;
  $('skjul-resultat').textContent = skjult ? 'Vis resultat' : 'Skjul';
  $('skjul-resultat').setAttribute('aria-expanded', String(!skjult));
});

for (const knapp of document.querySelectorAll('[data-velg-modus]')) {
  knapp.addEventListener('click', () => socket.emit('skjerm:modus', knapp.dataset.velgModus));
}

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
  if (spill?.fase !== 'slutt') opptellingVist = false;

  // Sluttellingen: spill den av én gang, og la den styre skjermen mens den pågår
  if (spill?.fase === 'slutt') {
    if (rom.opptelling === 'pågår' && !opptelling && !opptellingVist) spillOpptelling(rom);
    if (rom.opptelling !== 'pågår' && opptelling && !opptelling.igjen) opptelling.avbrutt = true;
    if (opptelling) return;
  }

  if (!spill) {
    $('hjelp').hidden = true;
    visLobby(rom);
    for (const panel of panelene.splice(0)) panel.remove();
    $('slutt').hidden = true;
    $('liten-qr').hidden = true;
    return;
  }

  brett.oppdater(spill, spill.spillere, { animer: spill.fase !== 'slutt' });
  visHjelp(rom);
  visPaneler(rom);
  if (spill.fase !== 'slutt') visMelding(spill);
  $('igjen').textContent = `${spill.igjen} ${spill.igjen === 1 ? 'brikke' : 'brikker'} igjen`;
  $('liten-qr').hidden = rom.spillere.every((s) => s.tilkoblet) || spill.fase === 'slutt';
  visSlutt(spill);
}

// Hjelpevinduet: hva brikken spilleren har trukket, er og gir av poeng
function visHjelp(rom) {
  const hjelp = rom.hjelp;
  $('hjelp').hidden = !hjelp;
  if (!hjelp) return;
  const spiller = rom.spill.spillere.find((s) => s.id === hjelp.spillerId);
  $('hjelp').style.setProperty('--farge', spiller?.farge ?? 'var(--gull)');
  $('hjelp-hvem').textContent = `${spiller?.navn ?? ''} spør: hva er denne brikken?`;
  if ($('hjelp').dataset.brikke !== hjelp.brikke) {
    $('hjelp').dataset.brikke = hjelp.brikke;
    $('hjelp-bilde').src = brikkeUrl(hjelp.brikke);
    $('hjelp-tekst').innerHTML = brikkeTekst(hjelp.brikke);
  }
}

function visLobby(rom) {
  const liste = $('lobby-liste');
  liste.replaceChildren();
  for (const s of rom.spillere) {
    const plass = rom.modus !== 'tv' ? `${PLASS_NAVN[s.plass]} side` : '';
    const li = elementFra(
      `<li><span class="prikk" style="background:${s.farge}"></span><span></span><span class="plass">${plass}</span></li>`,
    );
    li.children[1].textContent = s.navn + (s.id === rom.vertId ? ' · starter' : '') + (s.tilkoblet ? '' : ' (frakoblet)');
    liste.append(li);
  }
  // Utvidelsene verten har valgt, og hvor mange brikker det blir
  const valgte = rom.katalog.utvidelser.filter((u) => rom.utvidelser.includes(u.id));
  const sum = rom.katalog.grunn + valgte.reduce((a, u) => a + u.antall, 0);
  $('lobby-utvidelser').textContent = valgte.length
    ? `Utvidelser: ${valgte.map((u) => u.navn).join(' · ')} – ${sum} brikker`
    : `Grunnspillet: ${sum} brikker`;

  const ledige = rom.maksSpillere - rom.spillere.length;
  if (ledige) liste.append(elementFra(`<li class="tom">Plass til ${ledige} ${ledige === 1 ? 'spiller' : 'spillere'} til …</li>`));
  const nok = rom.spillere.length >= rom.minSpillere;
  const vert = rom.spillere.find((s) => s.id === rom.vertId);
  $('lobby-status').textContent = nok
    ? `${vert.navn} starter spillet fra mobilen når alle er klare.`
    : `Venter på spillere (minst ${rom.minSpillere}, høyst ${rom.maksSpillere}).`;
  for (const knapp of document.querySelectorAll('[data-velg-modus]')) {
    knapp.setAttribute('aria-pressed', String(knapp.dataset.velgModus === rom.modus));
  }
}

function visPaneler(rom) {
  const spill = rom.spill;
  // TV: annenhver spiller i venstre og høyre kolonne. Bord: hver ved sin side av bordet,
  // og to som deler en side, legges ved siden av hverandre langs kanten.
  const paSide = {};
  spill.spillere.forEach((s, i) => {
    let panel = panelene[i];
    if (!panel) {
      panel = elementFra(`
        <div class="panel">
          <div class="navn"><span class="prikk"></span><span class="tekst"></span></div>
          <div class="poeng"></div>
          <div class="vikinger"></div>
          <div class="lager" hidden></div>
          <div class="tur-tekst"></div>
          <div class="frakoblet" hidden>Frakoblet. Skann QR-koden igjen.</div>
          <img class="neste" alt="" hidden>
        </div>`);
      panelene[i] = panel;
    }
    const info = rom.spillere.find((r) => r.id === s.id) ?? {};
    const plass = info.plass ?? 'S';
    const forelder = rom.modus === 'tv' ? $(`kolonne-${i % 2}`) : $('paneler');
    if (panel.parentElement !== forelder) forelder.append(panel);
    const deler = spill.spillere.filter((t) => (rom.spillere.find((r) => r.id === t.id)?.plass ?? 'S') === plass).length;
    const nr = (paSide[plass] = (paSide[plass] ?? -1) + 1);
    // Avstanden mellom panelene (--panelsteg) står i CSS, fordi den er mindre på nettbrett
    panel.style.setProperty('--nr', String(deler > 1 ? nr - (deler - 1) / 2 : 0));
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
    // Storvikingen vises etter de vanlige når Gjestgiveri og storhov er med
    let stor = panel.querySelector('.storviking');
    if (spill.utvidelser?.includes('gjestgiveri')) {
      if (!stor || stor.dataset.farge !== s.farge) {
        stor?.remove();
        stor = elementFra(`<span class="storviking" title="Storviking">${vikingSvg(s.farge)}</span>`);
        stor.dataset.farge = s.farge;
        vikinger.append(stor);
      }
      stor.classList.toggle('borte', s.storvikinger <= 0);
    } else stor?.remove();

    // Handel og håndverk: byggmesteren og høna (blasse når de er ute på brettet) og varene
    const lager = panel.querySelector('.lager');
    lager.hidden = !spill.utvidelser?.includes('handel');
    if (!lager.hidden) {
      lager.innerHTML =
        `<span class="${s.byggmestere ? '' : 'borte'}" title="Byggmester">${figurSvg('bygg', s.farge)}</span>` +
        `<span class="${s.honer ? '' : 'borte'}" title="Høne">${figurSvg('hone', s.farge)}</span>` +
        Object.keys(VARER).map((v) => `<span title="${VARER[v]}">${vareSvg(v)}${s.varer[v]}</span>`).join('');
    }

    let turTekst = '';
    if (harTur) turTekst = { viking: 'Setter ut viking …', trekk: 'Trekker brikke …' }[spill.fase] ?? 'Legger brikke …';
    panel.querySelector('.tur-tekst').textContent = turTekst;
    panel.querySelector('.frakoblet').hidden = info.tilkoblet !== false;

    // Brikken som skal legges, vist i samme retning som på brettet
    const neste = panel.querySelector('.neste');
    neste.hidden = !(harTur && spill.fase === 'legg' && spill.aktiv);
    if (!neste.hidden) {
      const url = brikkeUrl(spill.aktiv.brikke.id, spill.aktiv.brikke.nr);
      if (neste.getAttribute('src') !== url) neste.src = url;
      const panelSnu = rom.modus !== 'tv' ? PLASS_GRADER[plass] : 0;
      neste.style.transform = `rotate(${spill.aktiv.rot * 90 + panelSnu}deg)`;
    }
  });
  while (panelene.length > spill.spillere.length) panelene.pop().remove();
}

function visMelding(spill) {
  const siste = spill.hendelser.at(-1)?.nr ?? 0;
  if (siste < sisteMelding) sisteMelding = 0; // nytt spill
  const nye = spill.hendelser.filter((h) => h.nr > sisteMelding && ['poeng', 'angret', 'varer', 'ekstratur'].includes(h.type));
  const forste = sisteMelding === 0;
  sisteMelding = siste;
  if (forste || !nye.length) return;
  const tekst = nye
    .map((h) => {
      const navn = spill.spillere[h.spiller].navn;
      if (h.type === 'angret') return `${navn} angret trekket`;
      if (h.type === 'ekstratur') return `Byggmesteren gir ${navn} en ekstra tur!`;
      if (h.type === 'varer') return `${navn} fikk ${varetekst(h.varer)}`;
      return `${navn} fikk ${h.poeng} poeng for ${GRUNN[h.grunn].toLowerCase()}!`;
    })
    .join('  ·  ');
  const el = $('melding');
  el.textContent = tekst;
  el.hidden = false;
  clearTimeout(meldingTimer);
  meldingTimer = setTimeout(() => (el.hidden = true), 3500);
}

// «2 tørrfisk og 1 korn»
function varetekst(varer) {
  const deler = Object.keys(VARER).filter((v) => varer[v]).map((v) => `${varer[v]} ${VARER[v]}`);
  return deler.length > 1 ? `${deler.slice(0, -1).join(', ')} og ${deler.at(-1)}` : deler[0];
}

// ---------- Opptellingen på slutten ----------

// Går gjennom sluttellingen område for område: området lyser opp, brettet glir dit,
// vikingene går hjem og poengene telles opp på panelene. Verten kan hoppe over.
async function spillOpptelling(rom, { igjen = false } = {}) {
  const spill = rom.spill;
  const status = { avbrutt: false, igjen };
  opptelling = status;
  $('slutt').hidden = true;

  // Start fra stillingen før sluttellingen, med vikingene tilbake på brettet
  const visSpillere = spill.spillere.map((s) => ({ ...s, poeng: s.poeng - Object.values(s.slutt).reduce((a, b) => a + b, 0) }));
  const brettet = spill.brett.map((b) => ({ ...b, viking: null }));
  const paPlass = (x, y) => brettet.find((b) => b.x === x && b.y === y);
  for (const post of spill.sluttposter) {
    for (const v of post.vikinger) paPlass(v.x, v.y).viking = { del: v.del, spiller: v.spiller, ...(v.stor ? { stor: true } : {}) };
  }
  const visning = () => ({ ...spill, brett: brettet, spillere: visSpillere, hendelser: [] });
  const tegn = () => {
    brett.oppdater(visning(), visSpillere, { animer: false });
    visPaneler({ ...rom, spill: visning() });
  };
  tegn();

  const vent = (ms) => new Promise((r) => {
    const t = setTimeout(r, ms);
    const sjekk = setInterval(() => status.avbrutt && (clearTimeout(t), clearInterval(sjekk), r()), 100);
    setTimeout(() => clearInterval(sjekk), ms + 50);
  });
  const tekst = $('opptelling');
  tekst.hidden = false;
  tekst.innerHTML = `<b>Sluttelling</b><span>Uferdige borger, veier og hov, og enga${spill.utvidelser?.includes('handel') ? ', og til slutt varene' : ''}</span>`;
  await vent(1800);

  const tempo = spill.sluttposter.length > 15 ? 0.7 : 1;
  for (const post of spill.sluttposter) {
    if (status.avbrutt) break;
    const vinnerFarge = visSpillere[post.vinnere[0]]?.farge ?? 'var(--gull)';
    // Varene ligger ikke på brettet, så da vises hele brettet
    if (post.grunn === 'varer') brett.nullstillZoom();
    else brett.fokuser(post.brikker);
    brett.fremhev(post.brikker, vinnerFarge);
    const poengPer = post.poengPer ?? post.vinnere.map(() => post.poeng);
    const navn = post.vinnere.map((i, n) => `${visSpillere[i].navn} +${poengPer[n]}`).join(' og ');
    const hva = post.grunn === 'varer' ? `Mest ${VARER[post.vare]}` : GRUNN[post.grunn];
    const borger = post.borger ?? post.poeng / 3;
    const omfang = post.grunn === 'varer' ? `${post.antall} stk`
      : post.grunn === 'eng' ? `${borger} ferdige borger${post.honer?.length ? ' · høna gir 4 per borg' : ''}`
        : post.grunn === 'hov' ? `${post.brikker.length - 1} brikker rundt` : `${post.brikker.length} brikker`;
    tekst.innerHTML = `<b>${hva}</b><span>${omfang}</span><span class="vinner" style="color:${vinnerFarge}"></span>`;
    tekst.querySelector('.vinner').textContent = navn;
    await vent(1100 * tempo);
    if (status.avbrutt) break;

    for (const v of post.vikinger) paPlass(v.x, v.y).viking = null;
    post.vinnere.forEach((i, n) => (visSpillere[i].poeng += poengPer[n]));
    tegn();
    if (post.brikker.length) {
      const midt = post.brikker.reduce((m, b) => ({ x: m.x + b.x / post.brikker.length, y: m.y + b.y / post.brikker.length }), { x: 0, y: 0 });
      post.vinnere.forEach((i, n) => brett.sprett(midt.x + n * 0.4, midt.y, `+${poengPer[n]}`, visSpillere[i].farge));
    }
    await vent(900 * tempo);
  }

  brett.fremhev([]);
  brett.nullstillZoom();
  tekst.hidden = true;
  opptelling = null;
  opptellingVist = true;
  if (!igjen) socket.emit('skjerm:opptelling-ferdig');
  if (sisteRom) vis(sisteRom);
}

$('se-igjen').addEventListener('click', () => sisteRom?.spill && !opptelling && spillOpptelling(sisteRom, { igjen: true }));

const KATEGORIER = ['borg', 'vei', 'hov', 'eng', 'varer'];
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

// Resultatet med en stolpe per spiller som viser hvor poengene kom fra
function visSlutt(spill) {
  $('slutt').hidden = spill.fase !== 'slutt';
  if (spill.fase !== 'slutt') return;
  document.querySelector('.forklaring .varer').hidden = !spill.utvidelser?.includes('handel');
  const rangert = spill.spillere.map((s, i) => ({ ...s, i })).sort((a, b) => b.poeng - a.poeng);
  const mest = Math.max(1, ...rangert.map((s) => s.poeng));
  $('resultat').replaceChildren(
    ...rangert.map((s) => {
      const vinner = spill.resultat?.vinnere.includes(s.i);
      const deler = KATEGORIER.map((k) => ({ k, p: (s.underveis[k] ?? 0) + (s.slutt[k] ?? 0) })).filter((d) => d.p);
      const li = elementFra(`
        <li class="${vinner ? 'vinner' : ''}">
          <div class="rad"><span class="prikk" style="background:${s.farge}"></span><span class="navn"></span><span class="p">${s.poeng}</span></div>
          <div class="stolpe">${deler.map((d) => `<span class="${d.k}" style="width:${(100 * d.p) / mest}%" title="${GRUNN[d.k]}: ${d.p}">${d.p}</span>`).join('')}</div>
          <div class="fordeling">${sum(s.underveis)} under spillet · ${sum(s.slutt)} i sluttellingen</div>
        </li>`);
      li.querySelector('.navn').textContent = (vinner ? '👑 ' : '') + s.navn;
      return li;
    }),
  );
}
