// Karkasand-serveren: sender ut nettsidene, lager QR-koder og holder spillrommene
// i gang over Socket.IO. Storskjermen og mobilene kobler seg til samme rom.

import express from 'express';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import QRCode from 'qrcode';
import { Rom } from './rom.js';

const rot = (sti) => fileURLToPath(new URL(`../${sti}`, import.meta.url));
const PORT = process.env.PORT || 3000;
const ROM_LEVETID = 6 * 60 * 60 * 1000; // rom uten aktivitet slettes etter 6 timer

const app = express();
const http = createServer(app);
const io = new Server(http);
const rommene = new Map();

// ---------- Nettsider ----------

app.use(express.static(rot('public')));
app.use('/delt', express.static(rot('delt')));
app.use('/kunst', express.static(rot('kunst'), { maxAge: '1h' }));

app.get('/skjerm/:kode', (req, res) => res.sendFile(rot('public/skjerm.html')));
app.get('/m/:kode', (req, res) => res.sendFile(rot('public/mobil.html')));
app.get('/galleri', (req, res) => res.sendFile(rot('public/galleri.html')));
app.get('/veiledning', (req, res) => res.sendFile(rot('public/veiledning.html')));

// Hvilke malte brikkebilder som finnes: { A: ['A.jpg', 'A_2.jpg'], ... }
app.get('/api/bilder', (req, res) => {
  const bilder = {};
  try {
    for (const fil of readdirSync(rot('kunst/brikker')).sort()) {
      const treff = fil.match(/^([A-X]|[RGH]\d+)(_\d+)?\.(jpe?g|png|webp)$/i);
      if (treff) (bilder[treff[1].toUpperCase()] ??= []).push(fil);
    }
  } catch {
    // mappen finnes ikke ennå
  }
  res.json(bilder);
});

// Adressen mobilene skal bruke. Lokalt byttes «localhost» ut med maskinens
// IP-adresse på nettverket, ellers kommer ikke mobilen fram.
function offentligAdresse(req) {
  const proto = req.headers['x-forwarded-proto']?.split(',')[0] || req.protocol;
  let host = req.headers.host;
  if (/^(localhost|127\.0\.0\.1)(:|$)/.test(host)) {
    const ip = Object.values(networkInterfaces())
      .flat()
      .find((n) => n?.family === 'IPv4' && !n.internal)?.address;
    if (ip) host = host.replace(/^(localhost|127\.0\.0\.1)/, ip);
  }
  return `${proto}://${host}`;
}

app.get('/api/adresse/:kode', (req, res) => {
  res.json({ url: `${offentligAdresse(req)}/m/${req.params.kode}` });
});

app.get('/qr/:kode.svg', async (req, res) => {
  const url = `${offentligAdresse(req)}/m/${req.params.kode}`;
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#1b140d', light: '#f4ead8' } });
  res.type('image/svg+xml').send(svg);
});

// ---------- Spillrom ----------

function sendTilstand(rom) {
  rom.sistAktiv = Date.now();
  io.to(rom.kode).emit('tilstand', rom.tilstand());
}

function nyttRom(modus) {
  const rom = new Rom(Rom.lagKode(rommene), modus);
  rommene.set(rom.kode, rom);
  return rom;
}

// Sluttellingen vises område for område på skjermen. Mobilene venter med resultatet til den
// er ferdig. Er ingen skjerm koblet til, avsluttes den av seg selv etter en stund.
function startOpptelling(rom) {
  rom.opptelling = 'pågår';
  const sekunder = 10 + rom.spill.sluttposter.length * 2;
  rom.opptellingTimer = setTimeout(() => ferdigOpptelling(rom), sekunder * 1000);
}

function ferdigOpptelling(rom) {
  if (rom.opptelling !== 'pågår') return;
  rom.opptelling = 'ferdig';
  clearTimeout(rom.opptellingTimer);
  sendTilstand(rom);
}

io.on('connection', (socket) => {
  const hentRom = () => rommene.get(socket.data.rom);

  socket.on('skjerm:koble', ({ kode, modus } = {}, svar) => {
    let rom = rommene.get(kode?.toUpperCase());
    if (!rom) rom = nyttRom(modus);
    else if (modus && !rom.spill) rom.settModus(modus);
    socket.data = { rom: rom.kode, rolle: 'skjerm' };
    socket.join(rom.kode);
    svar?.({ kode: rom.kode });
    sendTilstand(rom);
  });

  socket.on('skjerm:modus', (modus) => {
    const rom = hentRom();
    if (!rom || rom.spill) return;
    rom.settModus(modus);
    sendTilstand(rom);
  });

  socket.on('mobil:koble', ({ kode, spillerId } = {}, svar) => {
    const rom = rommene.get(kode?.toUpperCase());
    if (!rom) return svar?.({ feil: 'Fant ikke spillet. Skann QR-koden på skjermen på nytt.' });
    let spiller = rom.finn(spillerId);
    if (!spiller) spiller = rom.leggTilSpiller();
    if (!spiller) return svar?.({ feil: rom.spill ? 'Spillet er allerede i gang.' : 'Spillet er fullt.' });
    spiller.tilkoblet = true;
    socket.data = { rom: rom.kode, rolle: 'mobil', spillerId: spiller.id };
    socket.join(rom.kode);
    svar?.({ spillerId: spiller.id });
    sendTilstand(rom);
  });

  socket.on('mobil:oppsett', (valg = {}) => {
    const rom = hentRom();
    if (!rom || rom.spill) return;
    rom.oppsett(socket.data.spillerId, valg);
    sendTilstand(rom);
  });

  socket.on('mobil:hjelp', (vis) => {
    const rom = hentRom();
    if (rom?.settHjelp(socket.data.spillerId, Boolean(vis))) sendTilstand(rom);
  });

  socket.on('mobil:utvidelser', (liste) => {
    const rom = hentRom();
    if (rom?.settUtvidelser(socket.data.spillerId, liste)) sendTilstand(rom);
  });

  socket.on('mobil:start', () => {
    const rom = hentRom();
    if (rom?.start(socket.data.spillerId)) sendTilstand(rom);
  });

  socket.on('mobil:handling', (handling = {}) => {
    const rom = hentRom();
    if (!rom?.handling(socket.data.spillerId, handling)) return;
    if (rom.spill.fase === 'slutt' && !rom.opptelling) startOpptelling(rom);
    sendTilstand(rom);
  });

  // Skjermen er ferdig med å vise sluttellingen, eller verten vil hoppe over den
  socket.on('skjerm:opptelling-ferdig', () => {
    const rom = hentRom();
    if (rom && socket.data.rolle === 'skjerm') ferdigOpptelling(rom);
  });
  socket.on('mobil:hopp-over', () => {
    const rom = hentRom();
    if (rom && rom.vert?.id === socket.data.spillerId) ferdigOpptelling(rom);
  });

  socket.on('mobil:nytt-spill', () => {
    const rom = hentRom();
    if (!rom?.spill || rom.spill.fase !== 'slutt') return;
    rom.nyttSpill();
    sendTilstand(rom);
  });

  socket.on('mobil:forlat', () => {
    const rom = hentRom();
    if (!rom || rom.spill) return;
    rom.fjernSpiller(socket.data.spillerId);
    socket.leave(rom.kode);
    socket.data = {};
    sendTilstand(rom);
  });

  socket.on('disconnect', () => {
    const rom = hentRom();
    if (!rom || socket.data.rolle !== 'mobil') return;
    const id = socket.data.spillerId;
    // En spiller kan ha flere faner åpne; bare marker frakoblet når ingen er igjen
    const fortsattTilkoblet = [...io.sockets.sockets.values()].some(
      (s) => s !== socket && s.data.spillerId === id,
    );
    if (fortsattTilkoblet) return;
    const spiller = rom.finn(id);
    if (spiller) spiller.tilkoblet = false;
    sendTilstand(rom);
  });
});

// Rydd bort gamle rom
setInterval(() => {
  const naa = Date.now();
  for (const [kode, rom] of rommene) {
    if (naa - rom.sistAktiv > ROM_LEVETID) rommene.delete(kode);
  }
}, 10 * 60 * 1000).unref();

http.listen(PORT, () => {
  console.log(`Karkasand kjører på http://localhost:${PORT}`);
});
