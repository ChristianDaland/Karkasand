// Nettbrettet: to spillere sitter på hver sin side av et nettbrett som ligger flatt på
// bordet, den første i sør og den andre i nord. Her er lobbyen, kontrollraden langs kanten
// til hver spiller og trykk på brettet: trykk på en rute for å flytte brikken dit, på
// brikken for å snu den, og på et punkt på brikken for å velge hvor vikingen skal stå.

import { BRIKKE } from '/delt/brikker.js';
import { roterPunkt } from '/delt/motor.js';
import { figurSvg, elementFra, FIGURNAVN } from './felles.js';

const LAGRET = 'karkasand:nettbrett'; // navn og farger fra forrige gang

function hent() {
  try {
    return JSON.parse(localStorage.getItem(LAGRET)) ?? {};
  } catch {
    return {};
  }
}

function lagre(rom) {
  try {
    localStorage.setItem(LAGRET, JSON.stringify({ navn: rom.spillere.map((s) => s.navn), farger: rom.spillere.map((s) => s.farge) }));
  } catch {
    // privat modus o.l.
  }
}

export function start(kanal, brett) {
  let rom = null;
  const lobby = lagLobby(kanal);
  const styringer = [0, 1].map((i) => lagStyring(kanal, i));

  // Navn og farger fra forrige gang. Fargene settes to ganger, i tilfelle de to har byttet.
  const lagret = hent();
  kanal.spillere.forEach((s, i) => lagret.navn?.[i] && kanal.mobil(s.id, 'oppsett', { navn: lagret.navn[i] }));
  for (let gang = 0; gang < 2; gang++) {
    kanal.spillere.forEach((s, i) => lagret.farger?.[i] && kanal.mobil(s.id, 'oppsett', { farge: lagret.farger[i] }));
  }

  kanal.on('tilstand', (r) => {
    rom = r;
    lobby.vis(rom);
    for (const s of styringer) s.vis(rom);
  });

  brett.vedTrykk = (x, y) => {
    const spill = rom?.spill;
    if (!spill?.aktiv || !['legg', 'viking'].includes(spill.fase)) return;
    const id = spill.spillere[spill.tur].id;
    const bx = Math.floor(x), by = Math.floor(y);
    if (spill.fase === 'legg') {
      const her = bx === spill.aktiv.x && by === spill.aktiv.y;
      kanal.mobil(id, 'handling', her ? { type: 'roter' } : { type: 'flyttTil', x: bx, y: by });
      return;
    }
    // Vikingen: punktet på brikken som nettopp ble lagt, nærmest der man trykket
    const lagt = spill.sistLagt && spill.brett.find((b) => b.x === spill.sistLagt.x && b.y === spill.sistLagt.y);
    if (!lagt || bx !== lagt.x || by !== lagt.y) return;
    const avstand = (d) => {
      const [px, py] = roterPunkt(BRIKKE[lagt.id].deler[d].punkt, lagt.rot);
      return Math.hypot(px - (x - bx), py - (y - by));
    };
    const del = spill.vikingDeler.reduce((best, d) => (best === null || avstand(d) < avstand(best) ? d : best), null);
    if (del !== null) kanal.mobil(id, 'handling', { type: 'velg', del });
  };
}

// ---------- Lobbyen ----------

// Hver spiller skriver navnet sitt og velger farge på sin side av nettbrettet.
// Utvidelsene og startknappen ligger i midten.
function lagLobby(kanal) {
  const el = elementFra(`
    <section class="overlegg nettbrett-lobby">
      <div class="sete plass-N"></div>
      <div class="lobby-midt">
        <h1 class="tittel">Karkasand</h1>
        <div class="utvidelser" role="group" aria-label="Utvidelser"></div>
        <p class="brikketall dempet"></p>
        <button class="start primar">Start spillet</button>
        <p class="dempet"><a href="/">Tilbake</a> · <a href="/veiledning" target="_blank" rel="noopener">Slik spiller du</a></p>
      </div>
      <div class="sete plass-S"></div>
    </section>`);
  document.body.append(el);
  const seter = [el.querySelector('.plass-S'), el.querySelector('.plass-N')];
  seter.forEach((sete, i) => {
    sete.append(elementFra(`<label>Spiller ${i + 1}<input maxlength="16" autocomplete="off" enterkeyhint="done"></label>`));
    sete.append(elementFra('<div class="farger"></div>'));
    const input = sete.querySelector('input');
    input.addEventListener('input', () => input.value.trim() && kanal.mobil(kanal.spillere[i].id, 'oppsett', { navn: input.value }));
    input.addEventListener('keydown', (e) => e.key === 'Enter' && input.blur());
  });
  el.querySelector('.start').addEventListener('click', () => {
    document.activeElement?.blur();
    kanal.mobil(kanal.spillere[0].id, 'start');
  });

  function vis(rom) {
    el.hidden = Boolean(rom.spill);
    if (rom.spill) return;
    lagre(rom);
    rom.spillere.forEach((s, i) => {
      const sete = seter[i];
      sete.style.setProperty('--farge', s.farge);
      const input = sete.querySelector('input');
      if (document.activeElement !== input) input.value = s.navn;
      const farger = sete.querySelector('.farger');
      farger.replaceChildren(...rom.farger.map((f) => {
        const annen = rom.spillere.find((a) => a.id !== s.id && a.farge === f);
        const b = elementFra(`<button style="background:${f}" aria-label="${annen ? `Valgt av ${annen.navn}` : 'Velg farge'}"></button>`);
        b.classList.toggle('valgt', s.farge === f);
        b.disabled = Boolean(annen);
        b.addEventListener('click', () => kanal.mobil(s.id, 'oppsett', { farge: f }));
        return b;
      }));
    });

    const utvidelser = el.querySelector('.utvidelser');
    utvidelser.replaceChildren(...rom.katalog.utvidelser.map((u) => {
      const valgt = rom.utvidelser.includes(u.id);
      const b = elementFra(`<button aria-pressed="${valgt}" title=""></button>`);
      b.textContent = u.navn;
      b.title = u.om;
      b.addEventListener('click', () => {
        const liste = valgt ? rom.utvidelser.filter((v) => v !== u.id) : [...rom.utvidelser, u.id];
        kanal.mobil(rom.vertId, 'utvidelser', liste);
      });
      return b;
    }));
    const valgte = rom.katalog.utvidelser.filter((u) => rom.utvidelser.includes(u.id));
    const sum = rom.katalog.grunn + valgte.reduce((a, u) => a + u.antall, 0);
    el.querySelector('.brikketall').textContent = valgte.length ? `${sum} brikker` : `Grunnspillet: ${sum} brikker`;
  }

  return { vis };
}

// ---------- Kontrollene ----------

// Kontrollraden langs kanten til spiller nr. i, vendt mot spilleren. Den viser bare
// knappene som passer akkurat nå, som mobilen gjør.
function lagStyring(kanal, i) {
  const el = elementFra(`
    <div class="styring" hidden>
      <p class="styring-tekst"></p>
      <div class="styring-knapper"></div>
    </div>`);
  document.body.append(el);
  let brukStor = false; // storvikingen er valgt; tilbakestilles hver tur
  let rom = null;

  // Knappene beskrives med data-attributter, så én lytter holder
  el.addEventListener('click', (e) => {
    const knapp = e.target.closest('button');
    if (!knapp || !rom?.spill) return;
    const spill = rom.spill;
    const id = spill.spillere[i].id;
    const { gjor } = knapp.dataset;
    if (gjor === 'stor') {
      brukStor = !brukStor;
      return vis(rom);
    }
    if (gjor === 'hjelp') return kanal.mobil(id, 'hjelp', rom.hjelp?.spillerId !== id);
    if (gjor === 'hopp-over' || gjor === 'nytt-spill') return kanal.mobil(id, gjor);
    if (gjor === 'sett-viking') {
      const jeg = spill.spillere[i];
      return kanal.mobil(id, 'handling', { type: 'viking', del: spill.aktiv?.valgtDel ?? null, stor: brukStor || jeg.vikinger === 0 });
    }
    kanal.mobil(id, 'handling', JSON.parse(knapp.dataset.handling));
  });

  const knapp = (tekst, { handling, gjor, klasse = '', av = false } = {}) => {
    const b = elementFra(`<button class="${klasse}"></button>`);
    b.innerHTML = tekst;
    if (handling) b.dataset.handling = JSON.stringify(handling);
    if (gjor) b.dataset.gjor = gjor;
    b.disabled = av;
    return b;
  };

  function vis(r) {
    rom = r;
    const spill = rom.spill;
    el.hidden = !spill;
    if (!spill) return;
    const jeg = spill.spillere[i];
    const plass = rom.spillere.find((s) => s.id === jeg.id)?.plass ?? 'S';
    el.className = `styring plass-${plass}`;
    el.style.setProperty('--farge', jeg.farge);
    const harTur = spill.tur === i && spill.fase !== 'slutt';
    el.classList.toggle('tur', harTur);
    if (!(harTur && spill.fase === 'viking')) brukStor = false;

    const aktiv = spill.aktiv;
    const handel = spill.utvidelser?.includes('handel');
    const figur = aktiv?.figur ?? 'viking';
    const kanAngre = spill.kanAngre === i && (!harTur || spill.fase === 'trekk');
    const hjelpApen = rom.hjelp?.spillerId === jeg.id;
    const hjelp = () => knapp(hjelpApen ? '✕' : '?', { gjor: 'hjelp', klasse: `rund${hjelpApen ? ' apen' : ''}` });
    let tekst;
    const knapper = [];

    if (spill.fase === 'slutt') {
      const telles = rom.opptelling === 'pågår';
      tekst = telles ? 'Poengene telles opp …' : 'Spillet er slutt';
      knapper.push(telles ? knapp('Hopp over', { gjor: 'hopp-over' }) : knapp('Nytt spill', { gjor: 'nytt-spill', klasse: 'primar' }));
    } else if (!harTur) {
      tekst = `${spill.spillere[spill.tur].navn} sin tur …`;
    } else if (spill.fase === 'trekk') {
      tekst = spill.ekstraTur ? 'Byggmesteren gir deg en ekstra tur!' : 'Din tur!';
      knapper.push(knapp('Trekk brikke', { handling: { type: 'trekk' }, klasse: 'primar' }));
    } else if (spill.fase === 'legg') {
      tekst = aktiv.passer ? 'Brikken passer. Trykk på den for å snu den.' : 'Trykk på brettet der brikken skal ligge.';
      knapper.push(
        hjelp(),
        knapp('⟳', { handling: { type: 'roter' }, klasse: 'rund' }),
        knapp('Neste plass', { handling: { type: 'neste' } }),
        knapp('Legg brikken', { handling: { type: 'legg' }, klasse: 'primar', av: !aktiv.passer }),
      );
    } else {
      tekst = {
        viking: 'Trykk på et punkt på brikken der vikingen skal stå.',
        bygg: 'Byggmesteren gir en ekstra tur når du bygger videre her.',
        hone: 'Høna gir 4 i stedet for 3 per borg for enga.',
      }[figur];
      knapper.push(hjelp());
      // Handel og håndverk: viking, byggmester eller høne, når de kan stå et sted på brikken
      if (handel && (spill.figurValg?.bygg || spill.figurValg?.hone)) {
        for (const f of ['viking', 'bygg', 'hone']) {
          const b = knapp(figurSvg(f, jeg.farge), { handling: { type: 'figur', figur: f }, klasse: `rund figur${f === figur ? ' valgt' : ''}`, av: !spill.figurValg?.[f] });
          b.title = FIGURNAVN[f];
          knapper.push(b);
        }
      }
      if (figur === 'viking' && jeg.storvikinger > 0 && jeg.vikinger > 0) {
        knapper.push(knapp(brukStor ? 'Storviking ✓' : 'Storviking', { gjor: 'stor', klasse: brukStor ? 'valgt' : '' }));
      }
      knapper.push(
        knapp('↶', { handling: { type: 'angre' }, klasse: 'rund' }),
        knapp(handel ? 'Ingen figur' : 'Ingen viking', { handling: { type: 'viking', del: null } }),
        knapp({ viking: 'Sett ut viking', bygg: 'Sett ut byggmesteren', hone: 'Sett ut høna' }[figur], { gjor: 'sett-viking', klasse: 'primar', av: aktiv?.valgtDel == null }),
      );
    }
    // Den som la siste brikke, kan angre trekket til neste spiller har trukket sin
    if (kanAngre) knapper.unshift(knapp('↶ Angre trekket', { handling: { type: 'angre' } }));

    el.querySelector('.styring-tekst').textContent = tekst;
    el.querySelector('.styring-knapper').replaceChildren(...knapper);
  }

  return { vis };
}
