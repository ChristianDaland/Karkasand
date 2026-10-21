// Nettbrettet: to spillere spiller på samme nettbrett, og hele spillet kjører her i
// nettleseren. LokalKanal later som den er Socket.IO-forbindelsen til serveren, så
// storskjermen (skjerm.js) virker som før. Kontrollene på nettbrettet sender det
// mobilene ellers sender, med mobil(spillerId, hendelse, data).

import { Rom } from '/delt/rom.js';

export class LokalKanal {
  constructor() {
    this.lyttere = new Map();
    this.rom = new Rom('NETTBRETT', 'pad');
    // Den første sitter i sør og er vert, den andre sitter i nord
    this.rom.leggTilSpiller();
    this.rom.leggTilSpiller();
    // Som en ekte socket kobler den til etter at lytterne er satt opp
    setTimeout(() => this.utlos('connect'));
  }

  get spillere() {
    return this.rom.spillere;
  }

  on(hendelse, lytter) {
    if (!this.lyttere.has(hendelse)) this.lyttere.set(hendelse, []);
    this.lyttere.get(hendelse).push(lytter);
  }

  utlos(hendelse, ...data) {
    for (const lytter of this.lyttere.get(hendelse) ?? []) lytter(...data);
  }

  // Alle får en egen kopi, slik de ville fått over nettet
  sendTilstand() {
    this.utlos('tilstand', structuredClone(this.rom.tilstand()));
  }

  // Det storskjermen sender
  emit(hendelse, data, svar) {
    const rom = this.rom;
    if (hendelse === 'skjerm:koble') {
      svar?.({ kode: rom.kode });
      this.sendTilstand();
    } else if (hendelse === 'skjerm:opptelling-ferdig') {
      if (rom.ferdigOpptelling()) this.sendTilstand();
    } else if (hendelse === 'spill:avslutt') {
      if (!rom.spill) return;
      rom.nyttSpill();
      this.sendTilstand();
    }
  }

  // Det mobilene ellers sender, på vegne av spilleren med id-en
  mobil(id, hendelse, data) {
    const rom = this.rom;
    let endret = false;
    if (hendelse === 'oppsett' && !rom.spill) {
      rom.oppsett(id, data);
      endret = true;
    } else if (hendelse === 'utvidelser') endret = rom.settUtvidelser(id, data);
    else if (hendelse === 'start') endret = rom.start(id);
    else if (hendelse === 'hjelp') endret = rom.settHjelp(id, Boolean(data));
    else if (hendelse === 'handling') {
      endret = rom.handling(id, data);
      if (endret && rom.spill.fase === 'slutt' && !rom.opptelling) rom.startOpptelling(() => this.sendTilstand());
    } else if (hendelse === 'hopp-over') endret = rom.ferdigOpptelling();
    else if (hendelse === 'nytt-spill' && rom.spill?.fase === 'slutt') {
      rom.nyttSpill();
      endret = true;
    }
    if (endret) this.sendTilstand();
    return endret;
  }
}
