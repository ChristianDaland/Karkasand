# Karkasand

Et flisleggingsspill i nettleseren, inspirert av Carcassonne og satt i vikingtidens Norden. 2–5 spillere (6 med en utvidelse) bygger borger, ferdaveier og hov sammen. Brettet vises på en felles skjerm, og hver spiller styrer med mobilen sin.

## Slik spiller du

1. Åpne spillet på storskjermen og velg **Spill på skjerm** (TV/PC) eller **Spill på bordet** (prosjektor som lyser ned på et bord). Modusen kan også byttes i lobbyen. (**Spill på nettbrett** er for to spillere uten mobiler, se under.)
2. Alle spillerne skanner QR-koden med mobilen, skriver navnet sitt og velger farge. En farge kan bare velges av én spiller. På bordet velger de også hvilken side av bordet de sitter ved, høyst to per side.
3. Den som skannet først, er vert. Verten velger utvidelser og ser hvor mange brikker det blir, trykker **Start spillet** og bekrefter at alle er klare.
4. Når det er din tur, trykker du **Trekk brikke**. Så flytter du brikken med pilene og roterer den med ⟳. «Neste plass» hopper til neste rute der brikken passer. Trykk **Legg brikken**.
5. Velg om du vil sette ut en viking på brikken du nettopp la. Har du trykket feil, kan du angre brikken eller hele trekket fra mobilen helt til neste spiller har trykket **Trekk brikke**.

På bordet følger pilene siden du sitter ved. «Opp» betyr alltid bort fra deg.

### To på nettbrett

**Spill på nettbrett** (`/nettbrett`) er for to spillere på én iPad eller et annet nettbrett som ligger flatt mellom dem, uten mobiler. Den ene sitter i sør og den andre i nord, og hver har kontrollene langs sin kant. Du trykker på brettet der brikken skal ligge, på brikken for å snu den og på punktet der vikingen skal stå. Hele spillet kjører i nettleseren på nettbrettet. Serveren sender bare nettsiden og brikkebildene.

På storskjermen kan du zoome med musehjulet, knappene + / − / ⤢ eller tastene + − 0, og dra for å flytte brettet. Når spillet er slutt, telles poengene opp på skjermen område for område, og verten kan hoppe over opptellingen fra mobilen. Resultatet vises i et kort over brettet, med poengene fordelt på borg, vei, hov og eng, så du fortsatt kan se på byggverket.

### Poeng

| Område | Ferdig under spillet | Ved slutten (uferdig) |
|---|---|---|
| Borg | 2 per brikke + 2 per runestein | 1 per brikke + 1 per runestein |
| Vei | 1 per brikke | 1 per brikke |
| Hov | 9 når det er omringet | 1 + antall brikker rundt |
| Eng | – | 3 per ferdig borg enga grenser til |

Den som har flest vikinger i et område får poengene. Står det likt, får alle de som deler førsteplassen poengene.

### Utvidelser

| Utvidelse | Brikker | Kort fortalt |
|---|---|---|
| Elva | +12 | Spillet starter ved kilden, og elva legges først til den renner ut i vatnet. |
| Gjestgiveri og storhov | +18 | Gjestgiverier dobler ferdige veier og storhov gir 3 per brikke i ferdige borger, men begge gir 0 hvis de er uferdige. Storviking som teller som to. Plass til 6 spillere. |
| Handel og håndverk | +15 | Borger med tørrfisk, jern og korn. Den som fullfører borgen, får varene, og flest av hver vare gir 10 poeng. Byggmester som gir ekstra tur, og en liten sort dvergkochin-høne som gir 4 i stedet for 3 per borg for enga. |

Den fullstendige veiledningen, med alle brikkene, ligger på siden `/veiledning` i spillet.

## Utvikling

```bash
npm install
npm run dev      # starter serveren på http://localhost:3000 og starter på nytt ved endringer
npm test         # tester spillmotoren
npm run skisser  # lager skissene på nytt i kunst/skisser/ (krever Google Chrome og ImageMagick)
```

Når du kjører lokalt, peker QR-koden til maskinens IP-adresse på nettverket. Mobilene må da være på samme nett.

### Mapper

| Mappe | Innhold |
|---|---|
| `delt/` | Brikkedata, spillmotor, spillrommet og brikketegning. Brukes av både serveren og nettleseren. |
| `server/` | Express- og Socket.IO-server |
| `public/` | Nettsidene: startside, storskjerm, nettbrett, mobilkontroll, spillveiledning og galleri |
| `kunst/brikker/` | De malte brikkebildene (`A.jpg` til `X.jpg`, og `R1`–`R10`, `G1`–`G17`, `H1`–`H14` for utvidelsene) |
| `kunst/skisser/` | Skisser som brukes som maler for maleriene |
| `docs/BRIKKER.md` | Beskrivelse av alle brikkene, med krav til bildene |
| `test/` | Tester for spillmotoren |

### Malte brikker

Legg bildene i `kunst/brikker/`, så tar spillet dem i bruk automatisk. Brikker som mangler bilde, tegnes med en midlertidig illustrasjon. Siden `/galleri` viser hvilke brikker som er malt og har et tilfeldig brett der du kan sjekke at kantene passer sammen. Se [docs/BRIKKER.md](docs/BRIKKER.md).

## Publisering på Render

Repoet har en `render.yaml`. Gå til Render, velg **New → Blueprint** og koble til GitHub-repoet, så settes tjenesten opp automatisk. Alternativt kan du lage en **Web Service** med byggkommandoen `npm ci --omit=dev` og startkommandoen `npm start`.

På gratisplanen går tjenesten i dvale etter en stund uten bruk, og første oppstart tar da opptil et minutt. Spill som pågår ligger i minnet og forsvinner hvis tjenesten starter på nytt.
