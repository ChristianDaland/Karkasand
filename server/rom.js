// Spillrom: holder styr på spillerne i lobbyen, valgene deres og spillet som pågår.

import { randomUUID } from 'node:crypto';
import { Spill } from '../delt/motor.js';

export const MIN_SPILLERE = 2;
export const MAKS_SPILLERE = 5;
export const FARGER = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa'];
export const PLASSER = ['S', 'N', 'V', 'Ø']; // side av bordet spilleren sitter ved
const PER_SIDE = 2; // med 5 spillere må to dele en side av bordet

// Hvilken bretteretning «opp» på mobilen tilsvarer for hver side av bordet
// (0 = nord, 1 = øst, 2 = sør, 3 = vest)
const PLASS_FORSKYVNING = { S: 0, V: 1, N: 2, Ø: 3 };
const RETNING = { opp: 0, hoyre: 1, ned: 2, venstre: 3 };

const BOKSTAVER = 'ABCDEFGHJKLMNPRSTUVWXYZ';

export class Rom {
  constructor(kode, modus = 'tv') {
    this.kode = kode;
    this.modus = modus; // 'tv' eller 'bord'
    this.spillere = []; // { id, navn, farge, plass, tilkoblet }
    this.spill = null;
    this.opptelling = null; // null, 'pågår' eller 'ferdig': sluttellingen som vises på skjermen
    this.sistAktiv = Date.now();
  }

  static lagKode(opptatt) {
    let kode;
    do {
      kode = Array.from({ length: 4 }, () => BOKSTAVER[Math.floor(Math.random() * BOKSTAVER.length)]).join('');
    } while (opptatt.has(kode));
    return kode;
  }

  finn(id) {
    return this.spillere.find((s) => s.id === id);
  }

  leggTilSpiller() {
    if (this.spill) return null;
    // Er lobbyen full, tar den nye spilleren over plassen til en som har koblet fra
    if (this.spillere.length >= MAKS_SPILLERE) {
      const borte = this.spillere.find((s) => !s.tilkoblet);
      if (!borte) return null;
      this.fjernSpiller(borte.id);
    }
    const farge = FARGER.find((f) => !this.spillere.some((s) => s.farge === f));
    const plass = this.modus === 'bord' ? this.ledigsteSide() : 'S';
    const spiller = { id: randomUUID(), navn: `Spiller ${this.spillere.length + 1}`, farge, plass, tilkoblet: true };
    this.spillere.push(spiller);
    return spiller;
  }

  // Siden av bordet med færrest spillere (første i PLASSER ved likt)
  ledigsteSide(utenom = null) {
    const antall = (p) => this.spillere.filter((s) => s !== utenom && s.plass === p).length;
    return PLASSER.reduce((best, p) => (antall(p) < antall(best) ? p : best));
  }

  // Den første spilleren i lobbyen er verten og den eneste som kan starte spillet
  get vert() {
    return this.spillere[0] ?? null;
  }

  fjernSpiller(id) {
    this.spillere = this.spillere.filter((s) => s.id !== id);
  }

  oppsett(id, { navn, farge, plass }) {
    const s = this.finn(id);
    if (!s) return;
    if (typeof navn === 'string' && navn.trim()) s.navn = navn.trim().slice(0, 16);
    if (FARGER.includes(farge) && !this.spillere.some((a) => a !== s && a.farge === farge)) s.farge = farge;
    const paaSiden = this.spillere.filter((a) => a !== s && a.plass === plass).length;
    if (PLASSER.includes(plass) && (this.modus !== 'bord' || paaSiden < PER_SIDE)) {
      s.plass = plass;
    }
  }

  settModus(modus) {
    if (modus !== 'tv' && modus !== 'bord') return;
    this.modus = modus;
    // Fordel spillerne rundt bordet, høyst to per side, eller sett alle «foran skjermen»
    for (const s of this.spillere) s.plass = modus === 'tv' ? 'S' : null;
    if (modus === 'bord') for (const s of this.spillere) s.plass = this.ledigsteSide(s);
  }

  start(id) {
    if (this.spill || this.spillere.length < MIN_SPILLERE || this.vert?.id !== id) return false;
    this.spill = new Spill(this.spillere.map(({ id, navn, farge }) => ({ id, navn, farge })));
    return true;
  }

  nyttSpill() {
    this.spill = null;
    this.opptelling = null;
    clearTimeout(this.opptellingTimer);
  }

  // Handlinger fra mobilen. Bare spilleren som har tur kan gjøre noe.
  handling(id, { type, retning, del }) {
    const spill = this.spill;
    if (!spill || spill.fase === 'slutt') return false;
    if (spill.aktivSpiller.id !== id) return false;
    const spiller = this.finn(id);
    switch (type) {
      case 'flytt': {
        if (!(retning in RETNING)) return false;
        const r = (RETNING[retning] + PLASS_FORSKYVNING[spiller.plass]) % 4;
        if (spill.fase === 'viking') return spill.blaDel(r === 1 || r === 2 ? 1 : -1);
        return spill.flytt(r);
      }
      case 'roter':
        return spill.roter();
      case 'neste':
        return spill.nestePlass();
      case 'legg':
        return spill.legg();
      case 'velg':
        return spill.velgDel(del ?? null);
      case 'viking':
        return spill.settViking(del ?? null);
      default:
        return false;
    }
  }

  tilstand() {
    return {
      kode: this.kode,
      modus: this.modus,
      spillere: this.spillere,
      vertId: this.vert?.id ?? null,
      opptelling: this.opptelling,
      minSpillere: MIN_SPILLERE,
      maksSpillere: MAKS_SPILLERE,
      farger: FARGER,
      spill: this.spill?.tilstand() ?? null,
    };
  }
}
