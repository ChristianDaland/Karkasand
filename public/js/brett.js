// Tegner spillbrettet: brikker, vikinger, markøren, hint og poeng-animasjoner.
// Brukes av storskjermen og galleriet. Brettet tilpasses vinduet av seg selv, og
// spillerne kan i tillegg zoome og flytte det (musehjul, dra, klyp, knapper, + − 0).

import { BRIKKE } from '/delt/brikker.js';
import { roterPunkt } from '/delt/motor.js';
import { brikkeUrl, vikingSvg, elementFra } from './felles.js';

const T = 100; // størrelsen på en brikke i brettets egne koordinater
const MAKS_ZOOM = 12; // hvor langt inn man kan zoome, i forhold til tilpasset visning
const MIN_ZOOM = 0.5;

export class BrettVisning {
  constructor(vindu, { maksSkala = 2.2, marg = 24 } = {}) {
    this.vindu = vindu;
    this.maksSkala = maksSkala;
    this.marg = marg;
    this.lag = elementFra('<div class="brett-lag"></div>');
    this.hintLag = elementFra('<div class="hint-lag"></div>');
    this.brikkeLag = elementFra('<div class="brikke-lag"></div>');
    this.vikingLag = elementFra('<div class="viking-lag"></div>');
    this.effektLag = elementFra('<div class="effekt-lag"></div>');
    this.markor = elementFra('<div class="markor" hidden><img alt=""></div>');
    this.lag.append(this.hintLag, this.brikkeLag, this.markor, this.vikingLag, this.effektLag);
    vindu.append(this.lag);
    this.brikker = new Map();
    this.sistHendelse = null;
    this.forrige = null;
    // Spillerens egen zoom oppå den tilpassede visningen: skjerm = forskyvning + zoom × tilpasset
    this.visning = { zoom: 1, x: 0, y: 0 };
    this.lagZoom();
    new ResizeObserver(() => this.tilpass()).observe(vindu);
  }

  // ---------- Zoom og flytting ----------

  lagZoom() {
    const knapper = elementFra(`
      <div class="zoom-knapper">
        <button data-zoom="inn" title="Zoom inn (+)">+</button>
        <button data-zoom="ut" title="Zoom ut (−)">−</button>
        <button data-zoom="tilpass" title="Vis hele brettet (0)">⤢</button>
      </div>`);
    knapper.addEventListener('click', (e) => {
      const valg = e.target.closest('button')?.dataset.zoom;
      if (valg === 'tilpass') this.nullstillZoom();
      else if (valg) this.zoomRundt(valg === 'inn' ? 1.4 : 1 / 1.4);
    });
    knapper.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.vindu.append(knapper);

    this.vindu.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = this.vindu.getBoundingClientRect();
      this.zoomRundt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    // Dra med én peker, klyp med to
    const pekere = new Map();
    let start = null;
    const tilstand = () => {
      const p = [...pekere.values()];
      const midt = { x: p.reduce((s, q) => s + q.x, 0) / p.length, y: p.reduce((s, q) => s + q.y, 0) / p.length };
      const avstand = p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
      return { midt, avstand, visning: { ...this.visning } };
    };
    this.vindu.addEventListener('pointerdown', (e) => {
      const r = this.vindu.getBoundingClientRect();
      pekere.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
      this.vindu.setPointerCapture(e.pointerId);
      start = tilstand();
      this.vindu.classList.add('drar');
    });
    this.vindu.addEventListener('pointermove', (e) => {
      if (!pekere.has(e.pointerId)) return;
      const r = this.vindu.getBoundingClientRect();
      pekere.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
      const n = tilstand();
      const f = start.avstand && n.avstand ? n.avstand / start.avstand : 1;
      const zoom = Math.min(MAKS_ZOOM, Math.max(MIN_ZOOM, start.visning.zoom * f));
      const g = zoom / start.visning.zoom;
      this.visning = {
        zoom,
        x: n.midt.x - g * (start.midt.x - start.visning.x),
        y: n.midt.y - g * (start.midt.y - start.visning.y),
      };
      this.tegnVisning(false);
    });
    const slipp = (e) => {
      pekere.delete(e.pointerId);
      start = pekere.size ? tilstand() : null;
      if (!pekere.size) this.vindu.classList.remove('drar');
    };
    this.vindu.addEventListener('pointerup', slipp);
    this.vindu.addEventListener('pointercancel', slipp);

    addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === '+' || e.key === '=') this.zoomRundt(1.4);
      else if (e.key === '-') this.zoomRundt(1 / 1.4);
      else if (e.key === '0') this.nullstillZoom();
    });
  }

  // Zoom med faktor f rundt et punkt i vinduet (standard: midten)
  zoomRundt(f, cx = this.vindu.clientWidth / 2, cy = this.vindu.clientHeight / 2) {
    const v = this.visning;
    const zoom = Math.min(MAKS_ZOOM, Math.max(MIN_ZOOM, v.zoom * f));
    const g = zoom / v.zoom;
    this.visning = { zoom, x: cx - g * (cx - v.x), y: cy - g * (cy - v.y) };
    this.tegnVisning(false);
  }

  nullstillZoom() {
    this.visning = { zoom: 1, x: 0, y: 0 };
    this.tegnVisning(true);
  }

  tegnVisning(myk) {
    if (!this.tilpasset) return;
    const { dx, dy, skala } = this.tilpasset;
    const { zoom, x, y } = this.visning;
    this.lag.classList.toggle('manuell', !myk);
    this.lag.style.transform = `translate(${x + zoom * dx}px, ${y + zoom * dy}px) scale(${zoom * skala})`;
  }

  oppdater(spill, spillere, { animer = true } = {}) {
    this.forrige = { spill, spillere };
    const farge = (i) => spillere[i]?.farge ?? '#fff';

    // Brikker: legg til nye, behold de som ligger der fra før
    const finnes = new Set();
    for (const b of spill.brett) {
      const k = `${b.x},${b.y},${b.id},${b.nr},${b.rot}`;
      finnes.add(k);
      if (this.brikker.has(k)) continue;
      const el = elementFra(`<div class="brikke"><img alt="" draggable="false"></div>`);
      el.style.left = `${b.x * T}px`;
      el.style.top = `${b.y * T}px`;
      const img = el.firstElementChild;
      img.src = brikkeUrl(b.id, b.nr);
      img.style.transform = `rotate(${b.rot * 90}deg)`;
      if (animer && this.brikker.size) el.classList.add('ny');
      this.brikkeLag.append(el);
      this.brikker.set(k, el);
    }
    for (const [k, el] of this.brikker) {
      if (!finnes.has(k)) {
        el.remove();
        this.brikker.delete(k);
      }
    }

    // Vikinger
    this.vikingLag.replaceChildren();
    for (const b of spill.brett) {
      if (!b.viking) continue;
      const del = BRIKKE[b.id].deler[b.viking.del];
      this.vikingLag.append(this.lagViking(b, b.viking.del, farge(b.viking.spiller), del.type === 'eng'));
    }

    // Hint og markør i leggefasen
    const a = spill.aktiv;
    this.hintLag.replaceChildren();
    const leggefase = spill.fase === 'legg' && a;
    this.markor.hidden = !leggefase;
    if (leggefase) {
      for (const h of spill.hint) {
        const el = elementFra('<div class="hint"></div>');
        el.style.left = `${h.x * T}px`;
        el.style.top = `${h.y * T}px`;
        this.hintLag.append(el);
      }
      this.markor.style.left = `${a.x * T}px`;
      this.markor.style.top = `${a.y * T}px`;
      this.markor.style.setProperty('--farge', farge(spill.tur));
      this.markor.classList.toggle('passer', a.passer);
      const img = this.markor.firstElementChild;
      const url = brikkeUrl(a.brikke.id, a.brikke.nr);
      if (img.getAttribute('src') !== url) img.src = url;
      img.style.transform = `rotate(${a.rot * 90}deg)`;
    }

    // Brikken som nettopp ble lagt, beholder rammen i spillerens farge til turen er over
    for (const el of this.brikkeLag.querySelectorAll('.lagt-na')) el.classList.remove('lagt-na');
    if (spill.fase === 'viking' && spill.sistLagt) {
      const b = spill.brett.find((t) => t.x === spill.sistLagt.x && t.y === spill.sistLagt.y);
      const el = this.brikker.get(`${b.x},${b.y},${b.id},${b.nr},${b.rot}`);
      el?.classList.add('lagt-na');
      el?.style.setProperty('--farge', farge(spill.tur));
    }

    // Valg av vikingplass på brikken som nettopp ble lagt
    if (spill.fase === 'viking' && spill.sistLagt) {
      const b = spill.brett.find((t) => t.x === spill.sistLagt.x && t.y === spill.sistLagt.y);
      for (const d of spill.vikingDeler) {
        const valgt = a?.valgtDel === d;
        const type = BRIKKE[b.id].deler[d].type;
        if (valgt) {
          const v = this.lagViking(b, d, farge(spill.tur), type === 'eng');
          v.classList.add('forslag');
          this.vikingLag.append(v);
        } else {
          const [px, py] = roterPunkt(BRIKKE[b.id].deler[d].punkt, b.rot);
          const prikk = elementFra('<div class="viking-prikk"></div>');
          prikk.style.left = `${(b.x + px) * T}px`;
          prikk.style.top = `${(b.y + py) * T}px`;
          prikk.style.setProperty('--farge', farge(spill.tur));
          this.vikingLag.append(prikk);
        }
      }
    }

    this.visHendelser(spill.hendelser, spillere, animer);
    this.tilpass();
  }

  lagViking(b, del, farge, liggende) {
    const [px, py] = roterPunkt(BRIKKE[b.id].deler[del].punkt, b.rot);
    const el = elementFra(`<div class="viking">${vikingSvg(farge, liggende)}</div>`);
    el.style.left = `${(b.x + px) * T}px`;
    el.style.top = `${(b.y + py) * T}px`;
    return el;
  }

  visHendelser(hendelser, spillere, animer) {
    const siste = hendelser.at(-1)?.nr ?? 0;
    // Nytt spill (tellingen har startet på nytt) eller første visning: ikke animer gamle hendelser
    if (this.sistHendelse === null || !animer || siste < this.sistHendelse) {
      this.sistHendelse = siste;
      return;
    }
    for (const h of hendelser) {
      if (h.nr <= this.sistHendelse) continue;
      if (h.type === 'poeng') {
        const el = elementFra(`<div class="poeng-sprett">+${h.poeng}</div>`);
        el.style.left = `${(h.x + 0.5) * T}px`;
        el.style.top = `${(h.y + 0.5) * T}px`;
        el.style.color = spillere[h.spiller]?.farge ?? '#fff';
        this.effektLag.append(el);
        setTimeout(() => el.remove(), 2600);
      }
    }
    this.sistHendelse = siste;
  }

  // Skaler og sentrer brettet så alt (pluss markøren) får plass i vinduet
  tilpass() {
    const spill = this.forrige?.spill;
    if (!spill?.brett.length) return;
    const xs = spill.brett.map((b) => b.x);
    const ys = spill.brett.map((b) => b.y);
    for (const h of spill.hint) {
      xs.push(h.x);
      ys.push(h.y);
    }
    if (spill.aktiv && spill.fase === 'legg') {
      xs.push(spill.aktiv.x);
      ys.push(spill.aktiv.y);
    }
    const minX = Math.min(...xs), maxX = Math.max(...xs) + 1;
    const minY = Math.min(...ys), maxY = Math.max(...ys) + 1;
    const b = this.vindu.clientWidth - 2 * this.marg;
    const h = this.vindu.clientHeight - 2 * this.marg;
    if (b <= 0 || h <= 0) return;
    const skala = Math.min(this.maksSkala, b / ((maxX - minX) * T), h / ((maxY - minY) * T));
    const dx = this.marg + (b - (maxX - minX) * T * skala) / 2 - minX * T * skala;
    const dy = this.marg + (h - (maxY - minY) * T * skala) / 2 - minY * T * skala;
    this.tilpasset = { dx, dy, skala };
    this.tegnVisning(true);
  }
}
