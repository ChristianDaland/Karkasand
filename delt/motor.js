// Spillmotoren i Karkasand. Ren logikk uten nettverk eller DOM, slik at den
// kan kjøres både på serveren, i nettleseren (galleriet) og i testene.
//
// Koordinater: x øker mot øst, y øker mot sør. Rotasjon r = antall kvart
// omdreininger med klokka. Sider: 0 = nord, 1 = øst, 2 = sør, 3 = vest.

import { BRIKKER, BRIKKE, utvidelseAv } from './brikker.js';

export const VIKINGER_PER_SPILLER = 7;
const SIDER = ['N', 'Ø', 'S', 'V'];
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export const nokkel = (x, y) => `${x},${y}`;

// For hver brikketype: hvilken del eier hver av de 12 portene (kanonisk retning)
const PORT_DEL = Object.fromEntries(
  BRIKKER.map((b) => {
    const tabell = new Array(12).fill(-1);
    b.deler.forEach((d, i) => d.porter.forEach((p) => (tabell[SIDER.indexOf(p[0]) * 3 + Number(p[1])] = i)));
    return [b.id, tabell];
  }),
);

export function kanterRotert(id, rot) {
  const k = BRIKKE[id].kanter;
  const r = [];
  for (let s = 0; s < 4; s++) r[(s + rot) % 4] = k[s];
  return r;
}

// Roter et punkt (0–1) på brikken r kvart omdreininger med klokka
export function roterPunkt([x, y], rot) {
  for (let i = 0; i < rot; i++) [x, y] = [1 - y, x];
  return [x, y];
}

// Bunken trekkes fra slutten. Med Elva ligger elvebrikkene øverst, så vatnet, så resten,
// og kilden er startbrikke i stedet for Borgveien.
export function lagBunke(tilfeldig = Math.random, utvidelser = []) {
  const elva = utvidelser.includes('elva');
  const blandet = (liste) => {
    for (let i = liste.length - 1; i > 0; i--) {
      const j = Math.floor(tilfeldig() * (i + 1));
      [liste[i], liste[j]] = [liste[j], liste[i]];
    }
    return liste;
  };
  const vanlige = [], elv = [];
  let start = null, innsjo = null;
  for (const b of BRIKKER) {
    if (utvidelseAv(b) !== 'grunn' && !utvidelser.includes(utvidelseAv(b))) continue;
    for (let nr = 0; nr < b.antall; nr++) {
      const brikke = { id: b.id, nr };
      if (!start && (elva ? b.kilde : b.start)) start = brikke;
      else if (b.innsjo) innsjo = brikke;
      else if (utvidelseAv(b) === 'elva') elv.push(brikke);
      else vanlige.push(brikke);
    }
  }
  return { start, bunke: [...blandet(vanlige), ...(innsjo ? [innsjo] : []), ...blandet(elv)] };
}

export class Spill {
  constructor(spillere, { tilfeldig = Math.random, bunke, utvidelser = [] } = {}) {
    this.tilfeldig = tilfeldig;
    this.utvidelser = utvidelser;
    this.elvSving = 0; // forrige elvesving (1 = høyre, 3 = venstre), for å hindre U-sving
    // underveis/slutt: poengene fordelt på borg, vei, hov og eng, til oversikten på slutten
    this.spillere = spillere.map((s) => ({
      ...s, poeng: 0, vikinger: VIKINGER_PER_SPILLER, storvikinger: utvidelser.includes('gjestgiveri') ? 1 : 0,
      underveis: { borg: 0, vei: 0, hov: 0, eng: 0 }, slutt: { borg: 0, vei: 0, hov: 0, eng: 0 },
    }));
    const ny = lagBunke(tilfeldig, utvidelser);
    this.bunke = bunke ?? ny.bunke; // trekkes fra slutten
    this.brett = new Map();
    this.plasser(ny.start, 0, 0, 0);
    this.tur = 0;
    this.fase = 'legg';
    this.aktiv = null;
    this.markor = { x: 0, y: 0 };
    this.kastet = 0;
    this.hendelser = [];
    this.hendelseNr = 0;
    this.resultat = null;
    this.sluttposter = []; // ett innslag per område som telles på slutten, til opptellingen på skjermen
    this.trekk();
  }

  // ---------- Brettet ----------

  brikke(x, y) {
    return this.brett.get(nokkel(x, y));
  }

  plasser(brikke, x, y, rot) {
    const lagt = { id: brikke.id, nr: brikke.nr, x, y, rot, viking: null };
    this.brett.set(nokkel(x, y), lagt);
    return lagt;
  }

  grenser() {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const b of this.brett.values()) {
      minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x);
      minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
    }
    return { minX, maxX, minY, maxY };
  }

  passer(id, x, y, rot) {
    if (this.brikke(x, y)) return false;
    const kanter = kanterRotert(id, rot);
    let naboer = 0;
    for (let s = 0; s < 4; s++) {
      const nabo = this.brikke(x + DX[s], y + DY[s]);
      if (!nabo) continue;
      naboer++;
      if (kanterRotert(nabo.id, nabo.rot)[(s + 2) % 4] !== kanter[s]) return false;
    }
    return naboer > 0 && this.elvTilkobling(id, x, y, rot) !== null;
  }

  // For elvebrikker: elva må fortsette fra elva som ligger der, og den kan ikke snu rett
  // tilbake (to svinger samme vei etter hverandre). Gir svingen (0, 1 eller 3), eller null
  // hvis brikken ikke kan ligge her. Andre brikker gir alltid 0.
  elvTilkobling(id, x, y, rot) {
    const kanter = kanterRotert(id, rot);
    const elv = [0, 1, 2, 3].filter((s) => kanter[s] === 'elv');
    if (!elv.length) return 0;
    const inn = elv.find((s) => this.brikke(x + DX[s], y + DY[s]));
    if (inn === undefined) return null;
    const ut = elv.find((s) => s !== inn);
    if (ut === undefined) return 0;
    const sving = (ut - (inn + 2) + 8) % 4;
    return sving !== 0 && sving === this.elvSving ? null : sving;
  }

  gyldigeRotasjoner(id, x, y) {
    return [0, 1, 2, 3].filter((r) => this.passer(id, x, y, r));
  }

  // Alle tomme ruter der brikken passer i minst én rotasjon
  gyldigePlasser(id) {
    const sett = new Set();
    const plasser = [];
    for (const b of this.brett.values()) {
      for (let s = 0; s < 4; s++) {
        const x = b.x + DX[s], y = b.y + DY[s];
        const k = nokkel(x, y);
        if (sett.has(k) || this.brett.has(k)) continue;
        sett.add(k);
        const rot = this.gyldigeRotasjoner(id, x, y);
        if (rot.length) plasser.push({ x, y, rot });
      }
    }
    return plasser.sort((a, b) => a.y - b.y || a.x - b.x);
  }

  // ---------- Områder (sammenhengende borg, vei, eng) ----------

  // Finner hele området som delen `del` på brikken i (x, y) hører til
  omrade(x, y, del) {
    const start = this.brikke(x, y);
    const type = BRIKKE[start.id].deler[del].type;
    const sett = new Set();
    const ko = [[start, del]];
    const deler = [];
    let apen = false;
    while (ko.length) {
      const [b, d] = ko.pop();
      const k = `${b.x},${b.y}|${d}`;
      if (sett.has(k)) continue;
      sett.add(k);
      deler.push({ brikke: b, del: d });
      for (const p of BRIKKE[b.id].deler[d].porter) {
        const kanonisk = SIDER.indexOf(p[0]);
        const pos = Number(p[1]);
        const side = (kanonisk + b.rot) % 4;
        const nabo = this.brikke(b.x + DX[side], b.y + DY[side]);
        if (!nabo) {
          apen = true;
          continue;
        }
        // Naboens port på motsatt side; rekkefølgen snus fordi begge teller med klokka
        const nSide = ((side + 2) % 4 - nabo.rot + 4) % 4;
        const nDel = PORT_DEL[nabo.id][nSide * 3 + (2 - pos)];
        ko.push([nabo, nDel]);
      }
    }
    const brikker = new Set(deler.map((d) => d.brikke));
    const vikinger = deler
      .filter((d) => d.brikke.viking && d.brikke.viking.del === d.del)
      .map((d) => ({ brikke: d.brikke, spiller: d.brikke.viking.spiller }));
    const tell = (egenskap) => deler.filter((d) => BRIKKE[d.brikke.id].deler[d.del][egenskap]).length;
    const id = [...sett].sort()[0];
    return {
      id, type, deler, brikker, apen, vikinger,
      runesteiner: tell('runestein'), gjestgiverier: tell('gjestgiveri'), storhov: tell('storhov'),
    };
  }

  // Brikken og de som ligger rundt den
  medNaboer(b) {
    const ut = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const n = this.brikke(b.x + dx, b.y + dy);
        if (n) ut.push(n);
      }
    }
    return ut;
  }

  naboerRundt(x, y) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && this.brikke(x + dx, y + dy)) n++;
      }
    }
    return n;
  }

  // ---------- Turen ----------

  get aktivSpiller() {
    return this.spillere[this.tur];
  }

  trekk() {
    while (this.bunke.length) {
      const brikke = this.bunke.pop();
      const plasser = this.gyldigePlasser(brikke.id);
      if (!plasser.length) {
        this.kastet++;
        this.hendelse({ type: 'kastet', brikke: brikke.id });
        continue;
      }
      // Start markøren på den gyldige plassen nærmest forrige markør
      const { x: mx, y: my } = this.markor;
      const naermest = plasser.reduce((best, p) =>
        Math.hypot(p.x - mx, p.y - my) < Math.hypot(best.x - mx, best.y - my) ? p : best,
      );
      this.aktiv = { brikke, x: naermest.x, y: naermest.y, rot: naermest.rot[0] };
      this.markor = { x: naermest.x, y: naermest.y };
      this.fase = 'legg';
      return;
    }
    this.aktiv = null;
    this.sluttelling();
  }

  flytt(retning) {
    if (this.fase !== 'legg') return false;
    const g = this.grenser();
    const x = Math.max(g.minX - 1, Math.min(g.maxX + 1, this.aktiv.x + DX[retning]));
    const y = Math.max(g.minY - 1, Math.min(g.maxY + 1, this.aktiv.y + DY[retning]));
    this.aktiv.x = x;
    this.aktiv.y = y;
    this.markor = { x, y };
    // Hvis brikken bare passer i andre rotasjoner her, snu den automatisk
    const rot = this.gyldigeRotasjoner(this.aktiv.brikke.id, x, y);
    if (rot.length && !rot.includes(this.aktiv.rot)) this.aktiv.rot = rot[0];
    return true;
  }

  roter() {
    if (this.fase !== 'legg') return false;
    const a = this.aktiv;
    const gyldige = this.gyldigeRotasjoner(a.brikke.id, a.x, a.y);
    if (gyldige.length) {
      a.rot = gyldige.find((r) => r > a.rot) ?? gyldige[0];
    } else {
      a.rot = (a.rot + 1) % 4;
    }
    return true;
  }

  // Hopp til neste rute der brikken passer
  nestePlass() {
    if (this.fase !== 'legg') return false;
    const plasser = this.gyldigePlasser(this.aktiv.brikke.id);
    const i = plasser.findIndex((p) => p.y > this.aktiv.y || (p.y === this.aktiv.y && p.x > this.aktiv.x));
    const p = plasser[i === -1 ? 0 : i];
    this.aktiv.x = p.x;
    this.aktiv.y = p.y;
    this.aktiv.rot = p.rot.includes(this.aktiv.rot) ? this.aktiv.rot : p.rot[0];
    this.markor = { x: p.x, y: p.y };
    return true;
  }

  legg() {
    if (this.fase !== 'legg') return false;
    const { brikke, x, y, rot } = this.aktiv;
    if (!this.passer(brikke.id, x, y, rot)) return false;
    if (BRIKKE[brikke.id].kanter.includes('elv')) this.elvSving = this.elvTilkobling(brikke.id, x, y, rot);
    this.plasser(brikke, x, y, rot);
    this.sistLagt = { x, y };
    this.fase = 'viking';
    this.aktiv.valgtDel = null;
    if (!this.vikingDeler().length) this.fullforTur();
    return true;
  }

  // Delene på brikken som nettopp ble lagt, der det er lov å sette en viking
  vikingDeler() {
    const s = this.aktivSpiller;
    if (this.fase !== 'viking' || (s.vikinger <= 0 && s.storvikinger <= 0)) return [];
    const { x, y } = this.sistLagt;
    const b = this.brikke(x, y);
    return BRIKKE[b.id].deler
      .map((d, i) => i)
      .filter((i) => BRIKKE[b.id].deler[i].type !== 'elv')
      .filter((i) => BRIKKE[b.id].deler[i].type === 'hov' || this.omrade(x, y, i).vikinger.length === 0);
  }

  velgDel(del) {
    if (this.fase !== 'viking') return false;
    if (del !== null && !this.vikingDeler().includes(del)) return false;
    this.aktiv.valgtDel = del;
    return true;
  }

  // Bla gjennom delene der vikingen kan stå (retning +1 / -1)
  blaDel(retning) {
    const deler = this.vikingDeler();
    if (!deler.length) return false;
    const i = deler.indexOf(this.aktiv.valgtDel);
    const ny = i === -1 ? (retning > 0 ? 0 : deler.length - 1) : (i + retning + deler.length) % deler.length;
    this.aktiv.valgtDel = deler[ny];
    return true;
  }

  // stor: sett ut storvikingen (teller som to når det telles hvem som har flest)
  settViking(del, stor = false) {
    if (this.fase !== 'viking') return false;
    if (del !== null) {
      if (!this.vikingDeler().includes(del)) return false;
      if ((stor ? this.aktivSpiller.storvikinger : this.aktivSpiller.vikinger) <= 0) return false;
      const b = this.brikke(this.sistLagt.x, this.sistLagt.y);
      b.viking = { del, spiller: this.tur, ...(stor ? { stor: true } : {}) };
      this.aktivSpiller[stor ? 'storvikinger' : 'vikinger']--;
    }
    this.fullforTur();
    return true;
  }

  fullforTur() {
    this.tellFullforte();
    this.tur = (this.tur + 1) % this.spillere.length;
    this.trekk();
  }

  // ---------- Poeng ----------

  hendelse(h) {
    this.hendelser.push({ nr: ++this.hendelseNr, ...h });
    if (this.hendelser.length > 30) this.hendelser.shift();
  }

  // Gir poeng til spilleren(e) med flest vikinger i området og sender vikingene hjem
  gi(omrade, poeng, grunn) {
    const telling = new Map();
    for (const v of omrade.vikinger) telling.set(v.spiller, (telling.get(v.spiller) ?? 0) + (v.brikke.viking?.stor ? 2 : 1));
    const flest = Math.max(...telling.values());
    const vinnere = [...telling].filter(([, n]) => n === flest).map(([s]) => s);
    const brikker = [...omrade.brikker];
    const midt = {
      x: brikker.reduce((s, b) => s + b.x, 0) / brikker.length,
      y: brikker.reduce((s, b) => s + b.y, 0) / brikker.length,
    };
    for (const s of vinnere) {
      this.spillere[s].poeng += poeng;
      this.spillere[s][this.fase === 'slutt' ? 'slutt' : 'underveis'][grunn] += poeng;
      this.hendelse({ type: 'poeng', spiller: s, poeng, grunn, ...midt });
    }
    if (this.fase === 'slutt') {
      // For et hov lyser også brikkene rundt opp, siden det er de som gir poengene
      const vis = grunn === 'hov' ? this.medNaboer(brikker[0]) : brikker;
      this.sluttposter.push({
        grunn,
        poeng,
        vinnere,
        brikker: vis.map((b) => ({ x: b.x, y: b.y })),
        vikinger: omrade.vikinger.map((v) => ({
          x: v.brikke.x, y: v.brikke.y, del: v.brikke.viking.del, spiller: v.spiller, stor: Boolean(v.brikke.viking.stor),
        })),
      });
    }
    for (const v of omrade.vikinger) {
      this.spillere[v.spiller][v.brikke.viking.stor ? 'storvikinger' : 'vikinger']++;
      v.brikke.viking = null;
    }
  }

  // Etter at en brikke er lagt: tell opp borger, veier og hov som ble ferdige
  tellFullforte() {
    const { x, y } = this.sistLagt;
    const b = this.brikke(x, y);
    const sett = new Set();
    BRIKKE[b.id].deler.forEach((d, i) => {
      if (d.type !== 'borg' && d.type !== 'vei') return;
      const o = this.omrade(x, y, i);
      if (sett.has(o.id) || o.apen) return;
      sett.add(o.id);
      if (o.type === 'borg') this.hendelse({ type: 'ferdig', omrade: 'borg', x, y });
      if (!o.vikinger.length) return;
      // Storhov: 3 per brikke og runestein i stedet for 2. Gjestgiveri: 2 per brikke i stedet for 1.
      const poeng = o.type === 'borg'
        ? (o.storhov ? 3 : 2) * (o.brikker.size + o.runesteiner)
        : (o.gjestgiverier ? 2 : 1) * o.brikker.size;
      this.gi(o, poeng, o.type);
    });
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const h = this.brikke(x + dx, y + dy);
        if (!h?.viking || BRIKKE[h.id].deler[h.viking.del].type !== 'hov') continue;
        if (this.naboerRundt(h.x, h.y) === 8) {
          this.gi({ vikinger: [{ brikke: h, spiller: h.viking.spiller }], brikker: new Set([h]) }, 9, 'hov');
        }
      }
    }
  }

  sluttelling() {
    this.fase = 'slutt';
    const ferdigeBorger = new Map(); // område-id -> ferdig?
    const borgFerdig = (b, del) => {
      const o = this.omrade(b.x, b.y, del);
      if (!ferdigeBorger.has(o.id)) ferdigeBorger.set(o.id, !o.apen);
      return ferdigeBorger.get(o.id) ? o.id : null;
    };

    // Tell områder som fortsatt har vikinger. gi() fjerner vikingene, så hvert område telles én gang.
    const rekkefolge = ['vei', 'borg', 'hov', 'eng'];
    for (const type of rekkefolge) {
      for (const b of [...this.brett.values()]) {
        if (!b.viking) continue;
        const del = BRIKKE[b.id].deler[b.viking.del];
        if (del.type !== type) continue;
        if (type === 'hov') {
          this.gi({ vikinger: [{ brikke: b, spiller: b.viking.spiller }], brikker: new Set([b]) }, 1 + this.naboerRundt(b.x, b.y), 'hov');
          continue;
        }
        const o = this.omrade(b.x, b.y, b.viking.del);
        let poeng;
        // Uferdige veier med gjestgiveri og borger med storhov gir ingenting
        if (type === 'vei') poeng = o.gjestgiverier ? 0 : o.brikker.size;
        else if (type === 'borg') poeng = o.storhov ? 0 : o.brikker.size + o.runesteiner;
        else {
          const borger = new Set();
          for (const d of o.deler) {
            for (const bi of BRIKKE[d.brikke.id].deler[d.del].borger) {
              const id = borgFerdig(d.brikke, bi);
              if (id) borger.add(id);
            }
          }
          poeng = 3 * borger.size;
        }
        this.gi(o, poeng, type);
      }
    }

    const best = Math.max(...this.spillere.map((s) => s.poeng));
    this.resultat = {
      vinnere: this.spillere.map((s, i) => (s.poeng === best ? i : -1)).filter((i) => i >= 0),
    };
  }

  // ---------- Til klientene ----------

  tilstand() {
    const a = this.aktiv;
    let aktiv = null;
    if (a) {
      aktiv = {
        brikke: a.brikke,
        x: a.x,
        y: a.y,
        rot: a.rot,
        passer: this.fase === 'legg' ? this.passer(a.brikke.id, a.x, a.y, a.rot) : true,
        valgtDel: a.valgtDel ?? null,
      };
    }
    return {
      fase: this.fase,
      tur: this.tur,
      spillere: this.spillere,
      igjen: this.bunke.length,
      kastet: this.kastet,
      brett: [...this.brett.values()],
      aktiv,
      sistLagt: this.sistLagt ?? null,
      hint: this.fase === 'legg' ? this.gyldigePlasser(a.brikke.id).map(({ x, y }) => ({ x, y })) : [],
      vikingDeler: this.vikingDeler(),
      hendelser: this.hendelser,
      resultat: this.resultat,
      sluttposter: this.fase === 'slutt' ? this.sluttposter : [],
      utvidelser: this.utvidelser,
    };
  }
}
