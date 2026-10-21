// Spillrom: holder styr på spillerne i lobbyen, valgene deres og spillet som pågår.
// Brukes av serveren, og av nettbrettet, der hele spillet kjører i nettleseren.

import { Spill } from './motor.js';
import { UTVIDELSER, ANTALL } from './brikker.js';

// crypto.randomUUID finnes bare på https og localhost i nettleseren
const lagId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const MIN_SPILLERE = 2;
export const MAKS_SPILLERE = 5; // 6 med Gjestgiveri og storhov
export const FARGER = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa', '#ec407a'];
export const PLASSER = ['S', 'N', 'V', 'Ø']; // side av bordet spilleren sitter ved
// 'tv': alle ser brettet samme vei. 'bord': prosjektor over et bord. 'pad': to spillere på
// ett nettbrett uten mobiler (kjøres i nettleseren). På bord og pad sitter spillerne rundt
// brettet, hver ved sin side.
export const MODUSER = ['tv', 'bord', 'pad'];
const PER_SIDE = 2; // med 5 spillere må to dele en side av bordet

// Hvilken bretteretning «opp» på mobilen tilsvarer for hver side av bordet
// (0 = nord, 1 = øst, 2 = sør, 3 = vest)
const PLASS_FORSKYVNING = { S: 0, V: 1, N: 2, Ø: 3 };
const RETNING = { opp: 0, hoyre: 1, ned: 2, venstre: 3 };

const BOKSTAVER = 'ABCDEFGHJKLMNPRSTUVWXYZ';

export class Rom {
  constructor(kode, modus) {
    this.kode = kode;
    // En av MODUSER. Alt annet blir TV, også null: en skjerm som kobler seg til igjen
    // etter at serveren har startet på nytt, sender modus: null og får et nytt rom.
    this.modus = MODUSER.includes(modus) ? modus : 'tv';
    this.spillere = []; // { id, navn, farge, plass, tilkoblet }
    this.spill = null;
    this.utvidelser = []; // id-ene til utvidelsene verten har valgt
    this.hjelp = null; // id-en til spilleren som har bedt om hjelp for brikken sin
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
    if (this.spillere.length >= this.maksSpillere) {
      const borte = this.spillere.find((s) => !s.tilkoblet);
      if (!borte) return null;
      this.fjernSpiller(borte.id);
    }
    const farge = FARGER.find((f) => !this.spillere.some((s) => s.farge === f));
    const plass = this.rundtBrettet ? this.ledigsteSide() : 'S';
    const spiller = { id: lagId(), navn: `Spiller ${this.spillere.length + 1}`, farge, plass, tilkoblet: true };
    this.spillere.push(spiller);
    return spiller;
  }

  // Siden av bordet med færrest spillere (første i PLASSER ved likt)
  ledigsteSide(utenom = null) {
    const antall = (p) => this.spillere.filter((s) => s !== utenom && s.plass === p).length;
    return PLASSER.reduce((best, p) => (antall(p) < antall(best) ? p : best));
  }

  // Sitter spillerne rundt brettet (bord og pad), eller foran skjermen (tv)?
  get rundtBrettet() {
    return this.modus !== 'tv';
  }

  get maksSpillere() {
    return this.utvidelser.includes('gjestgiveri') ? MAKS_SPILLERE + 1 : MAKS_SPILLERE;
  }

  // Verten velger utvidelser i lobbyen. Gjestgiveri kan ikke velges bort med 6 spillere inne.
  settUtvidelser(id, liste) {
    if (this.spill || this.vert?.id !== id || !Array.isArray(liste)) return false;
    const nye = UTVIDELSER.map((u) => u.id).filter((u) => liste.includes(u));
    if (!nye.includes('gjestgiveri') && this.spillere.length > MAKS_SPILLERE) return false;
    this.utvidelser = nye;
    return true;
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
    if (PLASSER.includes(plass) && (!this.rundtBrettet || paaSiden < PER_SIDE)) {
      s.plass = plass;
    }
  }

  settModus(modus) {
    if (!MODUSER.includes(modus)) return;
    const varRundt = this.rundtBrettet;
    this.modus = modus;
    // Fordel spillerne rundt brettet, høyst to per side, eller sett alle «foran skjermen».
    // Mellom bord og pad beholder spillerne plassene sine.
    if (this.rundtBrettet && varRundt) return;
    for (const s of this.spillere) s.plass = this.rundtBrettet ? null : 'S';
    if (this.rundtBrettet) for (const s of this.spillere) s.plass = this.ledigsteSide(s);
  }

  start(id) {
    if (this.spill || this.spillere.length < MIN_SPILLERE || this.vert?.id !== id) return false;
    this.spill = new Spill(this.spillere.map(({ id, navn, farge }) => ({ id, navn, farge })), { utvidelser: this.utvidelser });
    return true;
  }

  // Hjelpevinduet på skjermen: bare spilleren som har tur og har trukket brikke, kan åpne det
  settHjelp(id, vis) {
    const spill = this.spill;
    if (!vis) {
      if (this.hjelp !== id) return false;
      this.hjelp = null;
      return true;
    }
    if (!spill?.aktiv || spill.aktivSpiller.id !== id) return false;
    this.hjelp = id;
    return true;
  }

  // Brikken hjelpevinduet viser. Vinduet lukkes av seg selv når turen går videre.
  hjelpBrikke() {
    const spill = this.spill;
    if (!this.hjelp || !spill?.aktiv || spill.aktivSpiller.id !== this.hjelp) {
      this.hjelp = null;
      return null;
    }
    return spill.aktiv.brikke.id;
  }

  // Sluttellingen vises område for område på skjermen. Mobilene venter med resultatet til den
  // er ferdig. Er ingen skjerm koblet til, avsluttes den av seg selv etter en stund, og da
  // kalles ferdig().
  startOpptelling(ferdig) {
    this.opptelling = 'pågår';
    const sekunder = 10 + this.spill.sluttposter.length * 2;
    this.opptellingTimer = setTimeout(() => this.ferdigOpptelling() && ferdig(), sekunder * 1000);
  }

  // Gir true hvis opptellingen pågikk og nå er avsluttet
  ferdigOpptelling() {
    if (this.opptelling !== 'pågår') return false;
    this.opptelling = 'ferdig';
    clearTimeout(this.opptellingTimer);
    return true;
  }

  nyttSpill() {
    this.spill = null;
    this.hjelp = null;
    this.opptelling = null;
    clearTimeout(this.opptellingTimer);
  }

  // Handlinger fra mobilen. Bare spilleren som har tur kan gjøre noe.
  handling(id, { type, retning, del, stor, figur, x, y }) {
    const spill = this.spill;
    if (!spill || spill.fase === 'slutt') return false;
    // Angre kan gjøres av den som la siste brikke, også etter at turen har gått videre
    if (type === 'angre') return spill.angre(spill.spillere.findIndex((s) => s.id === id));
    if (spill.aktivSpiller.id !== id) return false;
    const spiller = this.finn(id);
    switch (type) {
      case 'flytt': {
        if (!(retning in RETNING)) return false;
        const r = (RETNING[retning] + PLASS_FORSKYVNING[spiller.plass]) % 4;
        if (spill.fase === 'viking') return spill.blaDel(r === 1 || r === 2 ? 1 : -1);
        return spill.flytt(r);
      }
      case 'flyttTil': // nettbrettet: spilleren trykker på en rute på brettet
        return spill.flyttTil(Number(x), Number(y));
      case 'roter':
        return spill.roter();
      case 'neste':
        return spill.nestePlass();
      case 'trekk':
        return spill.trekkBrikke();
      case 'legg':
        return spill.legg();
      case 'velg':
        return spill.velgDel(del ?? null);
      case 'figur':
        return spill.velgFigur(figur);
      case 'viking':
        return spill.settViking(del ?? null, Boolean(stor));
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
      hjelp: this.hjelpBrikke() && { spillerId: this.hjelp, brikke: this.hjelpBrikke() },
      minSpillere: MIN_SPILLERE,
      maksSpillere: this.maksSpillere,
      utvidelser: this.utvidelser,
      katalog: { grunn: ANTALL.grunn, utvidelser: UTVIDELSER },
      farger: FARGER,
      spill: this.spill?.tilstand() ?? null,
    };
  }
}
