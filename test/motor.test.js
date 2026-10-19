import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BRIKKER, BRIKKE, ANTALL_BRIKKER, ANTALL } from '../delt/brikker.js';
import { Spill, kanterRotert, roterPunkt, lagBunke } from '../delt/motor.js';
import { tegnBrikke } from '../delt/tegning.js';

const SIDER = ['N', 'Ø', 'S', 'V'];

// Forutsigbar «tilfeldighet» så testene alltid gir samme resultat
function frø(n) {
  return () => ((n = (n * 1103515245 + 12345) % 2147483648) / 2147483648);
}

function nyttSpill(opts = {}) {
  return new Spill([{ navn: 'Astrid' }, { navn: 'Bjørn' }], { tilfeldig: frø(1), ...opts });
}

// Legg en bestemt brikke på en bestemt plass, uten å gå via bunken
function leggDirekte(spill, id, x, y, rot, viking = null) {
  assert.ok(spill.passer(id, x, y, rot), `${id} passer ikke på ${x},${y} rot ${rot}`);
  spill.aktiv = { brikke: { id, nr: 99 }, x, y, rot };
  spill.fase = 'legg';
  spill.bunke.push({ id: 'U', nr: 98 }); // sørg for at det finnes en neste brikke
  assert.ok(spill.legg());
  if (spill.fase === 'viking') assert.ok(spill.settViking(viking));
}

test('grunnspillet har 72 brikker i 24 typer, og utvidelsene 12 og 18', () => {
  assert.equal(BRIKKER.filter((b) => !b.utvidelse).length, 24);
  assert.equal(ANTALL_BRIKKER, 72);
  assert.deepEqual(ANTALL, { grunn: 72, elva: 12, gjestgiveri: 18 });
});

test('portene til hver brikke stemmer med kantene', () => {
  for (const b of BRIKKER) {
    const eier = new Map();
    for (const [i, d] of b.deler.entries()) {
      for (const p of d.porter) {
        assert.ok(!eier.has(p), `${b.id}: port ${p} er brukt to ganger`);
        eier.set(p, i);
      }
    }
    SIDER.forEach((side, s) => {
      const kant = b.kanter[s];
      const midt = b.deler[eier.get(`${side}1`)]?.type;
      assert.equal(midt, kant, `${b.id}: midtporten på ${side} skulle vært ${kant}`);
      if (kant !== 'vei' && kant !== 'elv') {
        for (const p of [0, 2]) assert.equal(b.deler[eier.get(`${side}${p}`)]?.type, kant, `${b.id} ${side}${p}`);
      } else {
        for (const p of [0, 2]) assert.equal(b.deler[eier.get(`${side}${p}`)]?.type, 'eng', `${b.id} ${side}${p}`);
      }
    });
    for (const d of b.deler) {
      for (const bi of d.borger ?? []) assert.equal(b.deler[bi].type, 'borg', `${b.id}: eng grenser til ikke-borg`);
    }
  }
});

test('alle brikker kan tegnes i begge stiler', () => {
  for (const b of BRIKKER) {
    assert.match(tegnBrikke(b.id, 'skisse'), /^<svg/);
    assert.match(tegnBrikke(b.id, 'plassholder'), /^<svg/);
  }
});

test('rotasjon av kanter og punkter', () => {
  assert.deepEqual(kanterRotert('D', 0), ['borg', 'vei', 'eng', 'vei']);
  assert.deepEqual(kanterRotert('D', 1), ['vei', 'borg', 'vei', 'eng']);
  assert.deepEqual(roterPunkt([0.5, 0.1], 1), [0.9, 0.5]);
  assert.deepEqual(roterPunkt([0.5, 0.1], 2), [0.5, 0.9]);
});

test('kantene må passe med naboene', () => {
  const spill = nyttSpill();
  // Startbrikken D ligger på 0,0 med borg mot nord
  assert.ok(spill.passer('E', 0, -1, 2)); // borg mot sør møter borg
  assert.ok(!spill.passer('E', 0, -1, 0)); // eng mot sør møter borg
  assert.ok(spill.passer('U', 1, 0, 1)); // vei øst-vest fortsetter veien
  assert.ok(!spill.passer('U', 1, 0, 0)); // eng møter vei
  assert.ok(!spill.passer('U', 5, 5, 0)); // ingen naboer
  assert.ok(!spill.passer('U', 0, 0, 0)); // opptatt
});

test('ferdig borg gir 2 poeng per brikke og vikingen kommer hjem', () => {
  const spill = nyttSpill();
  leggDirekte(spill, 'E', 0, -1, 2, 0); // Astrid setter viking i borgen
  assert.equal(spill.spillere[0].poeng, 4);
  assert.equal(spill.spillere[0].vikinger, 7);
  assert.equal(spill.brikke(0, -1).viking, null);
});

test('runestein gir ekstra poeng', () => {
  const spill = nyttSpill();
  // M rotert 2: borg mot sør og øst. Legges nord for startbrikken.
  leggDirekte(spill, 'M', 0, -1, 2, 0);
  assert.equal(spill.spillere[0].poeng, 0); // borgen er åpen mot øst
  leggDirekte(spill, 'E', 1, -1, 3); // lukker østsiden (Bjørns tur, ingen viking)
  assert.equal(spill.spillere[0].poeng, 2 * (3 + 1));
});

test('vei mellom to tun gir 1 poeng per brikke', () => {
  const spill = nyttSpill();
  leggDirekte(spill, 'W', 1, 0, 0, 2); // tun øst for start, viking på vestveien (del 2)
  assert.equal(spill.spillere[0].poeng, 0);
  leggDirekte(spill, 'W', -1, 0, 0); // tun vest for start lukker veien
  assert.equal(spill.spillere[0].poeng, 3);
});

test('man kan ikke sette viking på en vei som allerede er tatt', () => {
  const spill = nyttSpill();
  leggDirekte(spill, 'V', 1, 0, 1, 0); // Astrid: sving øst for start, viking på veien
  spill.aktiv = { brikke: { id: 'V', nr: 99 }, x: -1, y: 0, rot: 2 };
  spill.bunke.push({ id: 'U', nr: 98 });
  assert.ok(spill.legg()); // Bjørn: sving vest for start, samme vei
  assert.ok(!spill.vikingDeler().includes(0));
  assert.equal(spill.settViking(0), false);
});

test('like mange vikinger: begge får poeng', () => {
  const spill = nyttSpill();
  leggDirekte(spill, 'W', 1, 0, 0); // tun øst for start
  leggDirekte(spill, 'U', -1, 0, 1); // vei vest for start
  spill.brikke(1, 0).viking = { del: 2, spiller: 0 };
  spill.brikke(-1, 0).viking = { del: 0, spiller: 1 };
  leggDirekte(spill, 'W', -2, 0, 0); // tun i vest lukker veien: 4 brikker
  assert.equal(spill.spillere[0].poeng, 4);
  assert.equal(spill.spillere[1].poeng, 4);
});

test('hov gir 9 poeng når det er omringet', () => {
  const spill = nyttSpill();
  // Bygg et hov sør for startbrikken og fyll rundt det
  leggDirekte(spill, 'B', 0, 1, 0, 0);
  const rundt = [[-1, 0, 'U', 1], [1, 0, 'U', 1], [-1, 1, 'B', 0], [1, 1, 'B', 0], [-1, 2, 'B', 0], [0, 2, 'B', 0]];
  for (const [x, y, id, rot] of rundt) leggDirekte(spill, id, x, y, rot);
  assert.equal(spill.spillere[0].poeng, 0);
  leggDirekte(spill, 'B', 1, 2, 0);
  assert.equal(spill.spillere[0].poeng, 9);
});

test('eng som ikke grenser til borg gir 0 poeng', () => {
  const spill = nyttSpill();
  leggDirekte(spill, 'E', 0, -1, 2); // lukker borgen på startbrikken
  leggDirekte(spill, 'U', 0, 1, 1, 2); // viking i enga nord for veien sør for start
  spill.bunke = [];
  spill.sluttelling();
  // Enga sør for startbrikken grenser ikke til borgen (veien skiller), så 0 poeng
  assert.equal(spill.spillere[0].poeng, 0);
});

test('eng som grenser til ferdig borg', () => {
  const spill = nyttSpill();
  leggDirekte(spill, 'E', 0, -1, 2); // Astrid lukker borgen, ingen viking
  leggDirekte(spill, 'U', 1, -1, 0); // Bjørn
  leggDirekte(spill, 'V', 1, 0, 1, 1); // sving, viking i hjørneenga mot nordvest
  spill.bunke = [];
  spill.sluttelling();
  assert.ok(spill.spillere[0].poeng >= 3, `fikk ${spill.spillere[0].poeng}`);
});

test('mange hele spill kan spilles ferdig uten feil', () => {
  for (let s = 1; s <= 40; s++) {
    const tilfeldig = frø(s);
    const spill = new Spill([{ navn: 'A' }, { navn: 'B' }], { tilfeldig });
    let trekk = 0;
    while (spill.fase !== 'slutt') {
      assert.ok(trekk++ < 200, 'spillet stopper ikke');
      assert.equal(spill.fase, 'legg');
      const plasser = spill.gyldigePlasser(spill.aktiv.brikke.id);
      const p = plasser[Math.floor(tilfeldig() * plasser.length)];
      spill.aktiv.x = p.x;
      spill.aktiv.y = p.y;
      spill.aktiv.rot = p.rot[Math.floor(tilfeldig() * p.rot.length)];
      assert.ok(spill.legg());
      if (spill.fase === 'viking') {
        const deler = spill.vikingDeler();
        const del = tilfeldig() < 0.5 && deler.length ? deler[Math.floor(tilfeldig() * deler.length)] : null;
        assert.ok(spill.settViking(del));
      }
    }
    assert.equal(spill.brett.size + spill.kastet, 72);
    for (const sp of spill.spillere) {
      assert.equal(sp.vikinger, 7, 'alle vikinger skal være hjemme etter sluttellingen');
      assert.ok(sp.poeng >= 0);
    }
    // Alle kanter på brettet skal passe
    for (const b of spill.brett.values()) {
      const k = kanterRotert(b.id, b.rot);
      const ost = spill.brikke(b.x + 1, b.y);
      const sor = spill.brikke(b.x, b.y + 1);
      if (ost) assert.equal(kanterRotert(ost.id, ost.rot)[3], k[1]);
      if (sor) assert.equal(kanterRotert(sor.id, sor.rot)[0], k[2]);
    }
    assert.ok(BRIKKE);
  }
});

test('markøren kan flyttes, roteres og hoppe til neste plass', () => {
  const spill = nyttSpill();
  const { x, y } = spill.aktiv;
  spill.flytt(0);
  assert.equal(spill.aktiv.y, Math.max(y - 1, -1));
  spill.nestePlass();
  assert.ok(spill.passer(spill.aktiv.brikke.id, spill.aktiv.x, spill.aktiv.y, spill.aktiv.rot));
  spill.roter();
  assert.ok(spill.passer(spill.aktiv.brikke.id, spill.aktiv.x, spill.aktiv.y, spill.aktiv.rot));
  assert.ok(x !== undefined);
});

test('sluttellingen lagres område for område, og poengfordelingen går opp', () => {
  const tilfeldig = frø(7);
  const spill = new Spill(['A', 'B', 'C', 'D', 'E'].map((navn) => ({ navn })), { tilfeldig });
  while (spill.fase !== 'slutt') {
    const plasser = spill.gyldigePlasser(spill.aktiv.brikke.id);
    const p = plasser[Math.floor(tilfeldig() * plasser.length)];
    Object.assign(spill.aktiv, { x: p.x, y: p.y, rot: p.rot[0] });
    assert.ok(spill.legg());
    if (spill.fase === 'viking') {
      const deler = spill.vikingDeler();
      spill.settViking(deler.length && tilfeldig() < 0.5 ? deler[0] : null);
    }
  }
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  for (const [i, s] of spill.spillere.entries()) {
    assert.equal(sum(s.underveis) + sum(s.slutt), s.poeng, `${s.navn}: fordelingen går ikke opp`);
    const fraPoster = spill.sluttposter.filter((p) => p.vinnere.includes(i)).reduce((a, p) => a + p.poeng, 0);
    assert.equal(fraPoster, sum(s.slutt), `${s.navn}: sluttpostene stemmer ikke`);
  }
  assert.ok(spill.sluttposter.length > 0);
  for (const p of spill.sluttposter) {
    assert.ok(p.brikker.length > 0 && p.vikinger.length > 0);
    assert.ok(spill.tilstand().sluttposter.length === spill.sluttposter.length);
  }
  // Ingen vikinger står igjen på brettet etter sluttellingen
  assert.ok([...spill.brett.values()].every((b) => !b.viking));
});

// ---------- Utvidelsene ----------

test('bunken med utvidelser: kilden starter, elva ligger øverst og vatnet sist i elva', () => {
  const { start, bunke } = lagBunke(frø(3), ['elva', 'gjestgiveri']);
  assert.equal(start.id, 'R1');
  assert.equal(bunke.length, 72 + 12 + 18 - 1);
  const elv = bunke.slice(-10);
  assert.ok(elv.every((b) => BRIKKE[b.id].utvidelse === 'elva' && !BRIKKE[b.id].innsjo));
  assert.equal(bunke.at(-11).id, 'R2');
  assert.equal(bunke.filter((b) => b.id === 'D').length, 4); // Borgveien blandes inn i resten
  assert.equal(lagBunke(frø(3)).bunke.length, 71);
});

test('elva må henge sammen og kan ikke snu', () => {
  const spill = nyttSpill({ utvidelser: ['elva'] });
  assert.equal(spill.brikke(0, 0).id, 'R1'); // elva renner ut mot vest
  assert.ok(spill.passer('R3', -1, 0, 0));
  assert.ok(!spill.passer('R3', 1, 0, 0)); // elv mot eng
  assert.ok(!spill.passer('R3', 0, -1, 1));
  leggDirekte(spill, 'R4', -1, 0, 2); // svinger mot nord (høyresving)
  assert.ok(!spill.passer('R4', -1, -1, 3)); // en høyresving til ville vært en U-sving
  assert.ok(spill.passer('R4', -1, -1, 0)); // venstresving går fint
  // Ingen vikinger i selve elva
  const r = new Spill([{ navn: 'A' }, { navn: 'B' }], { tilfeldig: frø(1), utvidelser: ['elva'] });
  r.aktiv = { brikke: { id: 'R3', nr: 99 }, x: -1, y: 0, rot: 0 };
  r.bunke.push({ id: 'U', nr: 98 });
  assert.ok(r.legg());
  assert.ok(!r.vikingDeler().includes(0));
});

test('gjestgiveri: dobbelt for ferdig vei, ingenting for uferdig', () => {
  const spill = nyttSpill({ utvidelser: ['gjestgiveri'] });
  leggDirekte(spill, 'G14', 1, 0, 0, 0); // Astrid: vei med gjestgiveri øst for start
  leggDirekte(spill, 'W', 2, 0, 0); // Bjørn lukker østenden
  leggDirekte(spill, 'W', -1, 0, 0); // Astrid lukker vestenden: 4 brikker
  assert.equal(spill.spillere[0].poeng, 8);

  const uferdig = nyttSpill({ utvidelser: ['gjestgiveri'] });
  leggDirekte(uferdig, 'G14', 1, 0, 0, 0);
  uferdig.sluttelling();
  assert.equal(uferdig.spillere[0].poeng, 0);
  assert.equal(uferdig.sluttposter[0].poeng, 0);
});

test('storhov: tre ganger for ferdig borg', () => {
  const spill = nyttSpill({ utvidelser: ['gjestgiveri'] });
  leggDirekte(spill, 'G1', 0, -1, 0, 0); // Astrid: storhov nord for startbrikken
  leggDirekte(spill, 'E', 0, -2, 2);
  leggDirekte(spill, 'E', 1, -1, 3);
  leggDirekte(spill, 'E', -1, -1, 1); // lukker borgen: 5 brikker
  assert.equal(spill.spillere[0].poeng, 15);
});

test('storvikingen teller som to', () => {
  const spill = nyttSpill({ utvidelser: ['gjestgiveri'] });
  assert.equal(spill.spillere[0].storvikinger, 1);
  leggDirekte(spill, 'W', 1, 0, 0);
  leggDirekte(spill, 'U', -1, 0, 1);
  spill.brikke(1, 0).viking = { del: 2, spiller: 0, stor: true };
  spill.spillere[0].storvikinger = 0;
  spill.brikke(-1, 0).viking = { del: 0, spiller: 1 };
  spill.brikke(0, 0).viking = { del: 1, spiller: 1 }; // Bjørn har to vanlige: likt
  leggDirekte(spill, 'W', -2, 0, 0);
  assert.equal(spill.spillere[0].poeng, 4);
  assert.equal(spill.spillere[1].poeng, 4);
  assert.equal(spill.spillere[0].storvikinger, 1); // storvikingen er hjemme igjen
});

test('et helt parti med begge utvidelsene og seks spillere går opp', () => {
  const tilfeldig = frø(11);
  const spill = new Spill(['A', 'B', 'C', 'D', 'E', 'F'].map((navn) => ({ navn })), { tilfeldig, utvidelser: ['elva', 'gjestgiveri'] });
  let trekk = 0;
  while (spill.fase !== 'slutt') {
    const plasser = spill.gyldigePlasser(spill.aktiv.brikke.id);
    const p = plasser[Math.floor(tilfeldig() * plasser.length)];
    Object.assign(spill.aktiv, { x: p.x, y: p.y, rot: p.rot[0] });
    assert.ok(spill.legg());
    trekk++;
    if (spill.fase === 'viking') {
      const deler = spill.vikingDeler();
      const stor = spill.aktivSpiller.storvikinger > 0 && tilfeldig() < 0.3;
      spill.settViking(deler.length && tilfeldig() < 0.5 ? deler[0] : null, stor);
    }
  }
  assert.equal(trekk + spill.kastet, 101);
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  for (const s of spill.spillere) {
    assert.equal(sum(s.underveis) + sum(s.slutt), s.poeng);
    assert.equal(s.vikinger, 7);
    assert.equal(s.storvikinger, 1);
  }
});

test('et nytt rom får alltid en gyldig modus', async () => {
  const { Rom } = await import('../server/rom.js');
  assert.equal(new Rom('ABCD', null).modus, 'tv');
  assert.equal(new Rom('ABCD').modus, 'tv');
  assert.equal(new Rom('ABCD', 'bord').modus, 'bord');
  assert.equal(new Rom('ABCD', 'tull').modus, 'tv');
});

// ---------- Angre ----------

test('angre brikken mens man velger viking', () => {
  const spill = nyttSpill();
  spill.aktiv = { brikke: { id: 'E', nr: 99 }, x: 0, y: -1, rot: 2 };
  spill.bunke.push({ id: 'U', nr: 98 });
  assert.ok(spill.legg());
  assert.equal(spill.fase, 'viking');
  assert.equal(spill.angre(1), false); // bare den som la brikken kan angre
  assert.ok(spill.angre(0));
  assert.equal(spill.fase, 'legg');
  assert.equal(spill.brikke(0, -1), undefined);
  assert.equal(spill.aktiv.brikke.id, 'E');
  assert.deepEqual([spill.aktiv.x, spill.aktiv.y], [0, -1]);
});

test('angre et helt trekk med viking og poeng, helt til neste spiller legger brikke', () => {
  const spill = nyttSpill();
  const bunke = spill.bunke.length;
  leggDirekte(spill, 'E', 0, -1, 2, 0); // Astrid lukker borgen og får 4 poeng
  assert.equal(spill.spillere[0].poeng, 4);
  assert.equal(spill.tur, 1);
  spill.flytt(1); // Bjørn flytter markøren; det hindrer ikke angring
  assert.equal(spill.tilstand().kanAngre, 0);
  assert.ok(spill.angre(0));
  assert.equal(spill.tur, 0);
  assert.equal(spill.spillere[0].poeng, 0);
  assert.equal(spill.spillere[0].vikinger, 7);
  assert.equal(spill.brikke(0, -1), undefined);
  assert.equal(spill.bunke.length, bunke + 1); // som før trekket (leggDirekte la én brikke i bunken), med Bjørns brikke tilbake
  assert.equal(spill.angre(0), false); // bare ett steg tilbake

  leggDirekte(spill, 'E', 0, -1, 2); // Astrid legger igjen, uten viking
  leggDirekte(spill, 'U', 1, 0, 1); // Bjørn legger sin brikke
  assert.equal(spill.angre(0), false); // nå er det for sent for Astrid
  assert.equal(spill.tilstand().kanAngre, 1);
});
