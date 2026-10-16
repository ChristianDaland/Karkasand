// Spillrom: holder styr på spillerne i lobbyen, valgene deres og spillet som pågår.

import { randomUUID } from 'node:crypto';
import { Spill } from '../delt/motor.js';

export const MIN_SPILLERE = 2;
export const MAKS_SPILLERE = 2;
export const FARGER = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa'];
export const PLASSER = ['S', 'N', 'V', 'Ø']; // side av bordet spilleren sitter ved

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
    const plass = this.modus === 'bord' ? PLASSER.find((p) => !this.spillere.some((s) => s.plass === p)) : 'S';
    const spiller = { id: randomUUID(), navn: `Spiller ${this.spillere.length + 1}`, farge, plass, tilkoblet: true };
    this.spillere.push(spiller);
    return spiller;
  }

  fjernSpiller(id) {
    this.spillere = this.spillere.filter((s) => s.id !== id);
  }

  oppsett(id, { navn, farge, plass }) {
    const s = this.finn(id);
    if (!s) return;
    if (typeof navn === 'string' && navn.trim()) s.navn = navn.trim().slice(0, 16);
    if (FARGER.includes(farge) && !this.spillere.some((a) => a !== s && a.farge === farge)) s.farge = farge;
    if (PLASSER.includes(plass) && (this.modus !== 'bord' || !this.spillere.some((a) => a !== s && a.plass === plass))) {
      s.plass = plass;
    }
  }

  settModus(modus) {
    if (modus !== 'tv' && modus !== 'bord') return;
    this.modus = modus;
    // Gi spillerne hver sin side av bordet, eller sett alle «foran skjermen»
    const brukt = new Set();
    for (const s of this.spillere) {
      if (modus === 'tv') s.plass = 'S';
      else {
        if (brukt.has(s.plass)) s.plass = PLASSER.find((p) => !brukt.has(p));
        brukt.add(s.plass);
      }
    }
  }

  start() {
    if (this.spill || this.spillere.length < MIN_SPILLERE) return false;
    this.spill = new Spill(this.spillere.map(({ id, navn, farge }) => ({ id, navn, farge })));
    return true;
  }

  nyttSpill() {
    this.spill = null;
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
      minSpillere: MIN_SPILLERE,
      maksSpillere: MAKS_SPILLERE,
      farger: FARGER,
      spill: this.spill?.tilstand() ?? null,
    };
  }
}
