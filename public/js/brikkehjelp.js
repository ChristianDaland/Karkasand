// Tekstene om hver brikke: motivet, kantene og hva områdene gir av poeng.
// Brukes av spillveiledningen og av hjelpevinduet på storskjermen.

import { BRIKKE } from '/delt/brikker.js';

export const OM = {
  A: 'Et hov – gudehuset – med dragehoder på gavlene, en stor ask og et offeralter. Veien fra sør ender ved døra.',
  B: 'Et hov i en lund av bjørk og ask, omgitt av en steinsetting. Ingen vei, bare eng rundt.',
  C: 'Brikken ligger midt inne i en stor borg. Langhus med torvtak står tett rundt en runestein. Borgen fortsetter på alle fire kanter.',
  D: 'En borgkappe med palisade i nord og en rett vei tvers over brikken. Spillet starter med denne brikken når Elva ikke er med.',
  E: 'En borgkappe med palisade i nord. Resten er eng, gjerne med sauer og en steingard.',
  F: 'En borg som går tvers over brikken fra vest til øst, med en runestein i midten. Palisadene buer inn mot nord og sør.',
  G: 'En borg som går tvers over brikken fra nord til sør. Palisadene buer inn mot øst og vest.',
  H: 'To små borger, én i nord og én i sør, hver med sin palisade. Mellom dem ligger en åker. De to borgene henger ikke sammen.',
  I: 'To små borger i nord og øst som møtes i hjørnet uten å henge sammen. Resten er eng.',
  J: 'En borgkappe i nord og en vei som svinger fra øst til sør.',
  K: 'En borgkappe i nord og en vei som svinger fra vest til sør.',
  L: 'En borgkappe i nord. Tre veier møtes i et tun med brønn midt på brikken.',
  M: 'En borg som dekker den nordvestlige halvdelen, med en runestein. Palisaden går på skrå fra hjørne til hjørne.',
  N: 'Samme som M, men uten runestein.',
  O: 'Som M, med runestein, og med en vei som svinger gjennom enga i sørøst.',
  P: 'Samme som O, men uten runestein.',
  Q: 'En stor borg som dekker nord, øst og vest, med en runestein på tunet. Palisaden buer inn mot enga i sør.',
  R: 'Samme som Q, men uten runestein.',
  S: 'En stor borg med runestein. Veien fra sør går gjennom en port i palisaden og ender inne i borgen.',
  T: 'Samme som S, men uten runestein.',
  U: 'En rett ferdavei fra nord til sør gjennom lyngkledd eng.',
  V: 'En vei som svinger fra vest til sør. Det finnes flest av denne brikken.',
  W: 'Tre veier møtes ved et lite tun. Hver vei ender her.',
  X: 'Fire veier møtes ved en brønn midt på brikken. Hver vei ender her.',
  R1: 'Startbrikken når Elva er med. En kilde springer fram mellom mosegrodde steiner midt på brikken, og elva renner ut midt på vestkanten.',
  R2: 'Elva kommer inn fra vest og renner ut i et stille vatn. Siste elvebrikke.',
  R3: 'Elva renner rett tvers over brikken fra vest til øst.',
  R4: 'Elva kommer inn fra vest og svinger ut mot sør.',
  R5: 'To adskilte borgkapper i nord og sør, med elva mellom seg.',
  R6: 'Borgen dekker den nordøstlige halvdelen. Elva svinger gjennom det sørvestlige hjørnet.',
  R7: 'En borgkappe i nord, elva tvers over brikken, og en vei fra sør som ender ved et vadested.',
  R8: 'Et lite hov nord for elva. En vei fra sør krysser elva på ei bru og ender ved hovet.',
  R9: 'En veisving i nordøst og en elvesving i sørvest. De møtes ikke.',
  R10: 'Elva renner fra vest til øst, og veien går over den på ei solid trebru.',
  G1: 'Midt inne i en stor borg står et storhov, et stort gudehus med tak i flere lag og dragehoder på gavlene. Brikken har ingen palisade.',
  G2: 'Fire små borger, én langs hver kant, som ikke henger sammen. Eng i midten.',
  G3: 'Tre små borger i nord, øst og sør, hver for seg. Enga går ut til vestkanten.',
  G4: 'En liten borgkappe i nord og en større borg med runestein i sørøst. De henger ikke sammen.',
  G5: 'Borgen dekker nordøst. En vei fra vest ender ved en port, og ved veien ligger et gjestgiveri.',
  G6: 'Borgen dekker nordøst. En vei fra sør ender ved en port.',
  G7: 'Borgen med runestein dekker nordøst. En vei svinger fra vest til sør, med et gjestgiveri ved veien.',
  G8: 'En dyp borgkappe i nord og eng på resten av brikken.',
  G9: 'En borgkappe i nord. En rett vei fra sør ender ved porten.',
  G10: 'En borgkappe i nord og en vei som svinger fra vest til sør, med et gjestgiveri ved veien.',
  G11: 'En borg går fra nord til sør. To veier fra vest og øst ender ved hver sin port. Borgen har en runestein.',
  G12: 'To borgkapper i nord og sør. Veier fra vest og øst og stier fra begge borgene møtes ved en brønn.',
  G13: 'En vei svinger fra vest til sør, med et gjestgiveri ved veien.',
  G14: 'En rett vei fra vest til øst, med et gjestgiveri på nordsiden.',
  G15: 'Et lite hov midt på brikken. Veiene fra vest og øst ender ved hovet.',
  G16: 'Et T-kryss med brønn, og et gjestgiveri ved veien mot øst.',
  G17: 'To veisvinger som ikke møtes: fra nord til vest og fra øst til sør.',
};

export const KANT = { borg: 'borg', vei: 'vei', eng: 'eng', elv: 'elv' };

// Det spilleren må vite om områdene på brikken, utledet fra brikkedataene
export function egenskaper(b) {
  const borger = b.deler.filter((d) => d.type === 'borg');
  const veier = b.deler.filter((d) => d.type === 'vei');
  const linjer = [];
  if (borger.length) {
    const rune = borger.some((d) => d.runestein);
    const antall = ['', '', 'To', 'Tre', 'Fire'][borger.length];
    linjer.push(`<span class="type borg">Borg</span> ${borger.length > 1 ? `${antall} adskilte borger som hver er et eget område. ` : ''}Ferdig borg: 2 p per brikke. Uferdig ved slutten: 1 p per brikke.`);
    if (borger.some((d) => d.storhov)) linjer.push('<span class="type storhov">Storhov</span> Ferdig borg: 3 p per brikke og runestein. Uferdig ved slutten: 0 p.');
    if (rune) linjer.push('<span class="type rune">Runestein</span> Borgen gir 2 ekstra poeng når den er ferdig (1 hvis den er uferdig ved slutten).');
  }
  if (veier.length) {
    // En veidel med bare én port går inn fra kanten og stopper på brikken
    const ender = veier.filter((d) => d.porter.length === 1).length;
    const tekst = ender > 1 ? ` ${ender} veier ender her.` : ender === 1 ? ' Veien ender på denne brikken.' : '';
    linjer.push(`<span class="type vei">Vei</span> 1 p per brikke.${tekst}`);
    if (veier.some((d) => d.gjestgiveri)) linjer.push('<span class="type gjest">Gjestgiveri</span> Ferdig vei: 2 p per brikke. Uferdig ved slutten: 0 p.');
  }
  if (b.deler.some((d) => d.type === 'hov')) {
    linjer.push('<span class="type hov">Hov</span> 9 p når alle de 8 rutene rundt er fylt. Ellers ved slutten: 1 p + 1 per nabobrikke.');
  }
  if (b.deler.some((d) => d.type === 'elv')) {
    linjer.push(`<span class="type elv">Elv</span> ${b.kilde ? 'Startbrikken når Elva er med.' : b.innsjo ? 'Siste elvebrikke.' : 'Legges før resten av brikkene.'} Elva deler enga, og man kan ikke sette vikinger i den.`);
  }
  const enger = b.deler.filter((d) => d.type === 'eng');
  if (enger.length) {
    const grenser = enger.some((d) => d.borger.length);
    linjer.push(`<span class="type eng">Eng</span> Ved slutten: 3 p per ferdig borg enga grenser til.${grenser ? ' Enga her grenser til borgen på brikken.' : ''}`);
  }
  return linjer;
}

// Hele beskrivelsen av en brikke som HTML (uten bilde)
export function brikkeTekst(id) {
  const b = BRIKKE[id];
  return (
    `<h3>${b.id} – ${b.navn}</h3>` +
    `<p class="fakta">${b.antall} stk · kanter: ${b.kanter.map((k) => KANT[k]).join(' / ')}${b.start ? ' · startbrikke uten Elva' : ''}</p>` +
    `<p>${OM[b.id]}</p>` +
    `<ul>${egenskaper(b).map((l) => `<li>${l}</li>`).join('')}</ul>`
  );
}
