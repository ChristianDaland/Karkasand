# Karkasand – beskrivelse av brikkene

Dette dokumentet beskriver alle brikkene i Karkasand: hva de skal forestille, hvordan de skal se ut, og de tekniske kravene til bildefilene. Bruk det sammen med skissene i [kunst/skisser/](../kunst/skisser/) når du lager bildene på AI-riggen.

![Oversikt over alle skissene](../kunst/skisser/oversikt.png)

Spillet har **72 brikker** fordelt på **24 brikketyper** (A–X). Du lager **ett bilde per brikketype**. Like brikker bruker samme bilde. For de brikketypene vi har mange av, kan du gjerne lage flere varianter (se [Varianter](#varianter)).

---

## 1. Tekniske krav

| Hva | Krav |
|---|---|
| Format | **JPG**, sRGB |
| Størrelse | **1024 × 1024 piksler**, nøyaktig kvadratisk |
| Kvalitet | JPG-kvalitet 85–92, helst under 400 kB per fil |
| Filnavn | Brikkebokstaven med stor bokstav: `A.jpg`, `B.jpg` … `X.jpg`. Varianter: `U_2.jpg`, `U_3.jpg` |
| Plassering | Legg filene i `kunst/brikker/` |
| Retning | **Nord er øverst**, akkurat som i skissen. Spillet roterer brikkene selv |
| Ramme | **Ingen** ramme, kant, vignett eller avrundede hjørner. Motivet skal gå helt ut til kanten |

> **Viktig:** Bildet må **ikke** speilvendes. J og K, og O/P sammenlignet med M/N, er ulike brikker fordi de er speilbilder av hverandre.

### Perspektiv og lys
- **Rett ovenfra** (ortografisk fugleperspektiv), som et kart. Ingen horisont, ingen himmel og ikke skrått eller isometrisk.
- **Mykt og diffust lys**, som en overskyet nordisk dag. **Ingen tydelige slagskygger i én retning.** Brikkene roteres i spillet, og skygger som peker i ulike retninger ville avsløre det. Bruk heller korte, myke skygger rett under ting (ambient occlusion).
- Hus, trær og folk sees ovenfra: vi ser torvtak, trekroner og hoder.

---

## 2. Kantreglene

Når to brikker ligger inntil hverandre, må det ene bildet fortsette sømløst inn i det neste. Derfor har alle brikkene felles mål, oppgitt i piksler på et bilde på 1024 × 1024:

| Element | Regel |
|---|---|
| **Vei** | Treffer kanten **nøyaktig midt på** (512 px). Bredden er **110 px** (fra 457 til 567 px). Den er rett når den krysser kanten. |
| **Borg mot kant** | Borggrunnen dekker **hele kanten**, fra hjørne til hjørne. |
| **Borgkappe** | Når borgen bare dekker én kant, buer palisaden inn til **300 px** fra kanten på midten og ender i de to hjørnene. |
| **Palisade** | Ender alltid **i et hjørne** av brikken, aldri midt på en kant. Den er ca. 36–40 px tykk og står på borgsiden av grensen. |
| **Eng mot kant** | Bare gress. Samme grønnfarge og tetthet langs alle kanter. |
| **Kantsonen** | Hold de **ytterste 48 px** langs hver kant fri for gjenstander, og vis bare underlaget (gress, vei eller borggrunn). Hus, trær, steiner, folk og dyr skal ikke kuttes av kanten. |

**Underlaget langs kantene må være likt på alle brikkene.** Gresset skal ha samme farge og struktur, veien samme jordfarge med steinheller, og borggrunnen samme trampede jord og plankeganger. Det er dette som får brettet til å se ut som ett sammenhengende landskap.

---

## 3. Bildeelementene

### Eng (gress)
Saftig, litt vill nordisk beitemark: mosegrønt gress med innslag av lyng, blåklokker, smørblomster og små gråsteiner. Inne på brikken, utenfor kantsonen, kan det være enkelte bjørker, einer, en sau, en steingard eller en bekk. Hold det rolig, slik at engen fungerer som bakgrunn.

### Vei (ferdavei)
En opptråkket jordvei i lys brun-oker med hjulspor, små steinheller og gress som vokser inn i kantene. Veien skal ikke ha kantstein eller murer.

### Borg (borggrunn)
Inne i borgen er bakken trampet jord, med plankeganger mellom husene. Der står **langhus med torvtak** (grønne tak sett ovenfra, med røykhull), stabbur, smie, tønner, ved og fiskehjeller. Gjerne røyk fra et par røykhull. **Bygninger holdes 48 px unna kantene** som berører andre brikker.

### Palisade
En **trepalisade** av tette, tilspissede tømmerstokker i mørk, værbitt brun. Sett ovenfra ser den ut som en tykk rad med stokketopper. Det skal ikke være noen steinmur, for dette er ikke en middelalderborg. Gjerne med små vaktplattformer innimellom.

### Runestein (bonuspoeng)
En reist **grå runestein** med en **rødmalt ormeslynge** (Urnes-stil) inne i borgen. Den gir dobbelt så mange poeng i spillet, så den **må være lett å se**. Den skal fylle ca. 12–15 % av brikkens bredde, ha sterk rødfarge og gjerne et lite steinlagt område rundt seg. Plasseringen er vist i skissen.

### Hov (tilsvarer klosteret)
Et gudehus i tre, sett ovenfra. Det er et rektangulært bygg med bratt tak av spon eller torv, mønekam og **dragehoder på gavlene**. Ved siden av står et hellig tre, gjerne en stor ask, og rundt er det en liten steinsetting og et offeralter (horg). Hovet står midt på brikken og er omgitt av eng.

### Tun (veikryss)
Der veier møtes, står et lite **tun** med en **brønn** midt i krysset (et rundt steinsatt hull med vindestokk), et lite uthus og eventuelt en vognhjulsstabel. Veiene stopper ved tunet.

### Fargepalett (veiledende)
| Element | Farge |
|---|---|
| Gress | mosegrønn `#6f8f4e` til `#7fa65a` |
| Vei | lys oker `#c9a877` |
| Borggrunn | jordbrun `#9c7a55` |
| Palisade | mørk tømmerbrun `#4a3523` |
| Torvtak | grønt og gyllent gress på brun torv |
| Runestein | skifergrå `#8a8f94` med rødt `#b3322b` |

Fargene er bare veiledende. Det viktigste er at de er **like på alle brikkene**.

---

## 4. Felles stil (prompt)

Bruk samme stilbeskrivelse på alle brikkene og legg til den brikkespesifikke delen fra kapittel 5. Promptene er på engelsk, fordi de fleste bildemodellene forstår engelsk best.

**Stilprompt (felles):**
```
top-down orthographic bird's-eye view, square board game tile, hand-painted gouache and watercolor illustration, richly detailed, Viking Age Scandinavia 10th century, muted Nordic palette of moss green, heather purple, birch white, weathered timber brown and slate grey, soft overcast diffuse daylight, no directional cast shadows, painterly brushwork, fills the entire frame edge to edge, consistent grass texture along all edges
```

**Negativ prompt (felles):**
```
perspective, isometric, horizon, sky, clouds, text, letters, watermark, signature, border, frame, vignette, rounded corners, drop shadow, stone castle, medieval European castle, knights, modern objects, photorealistic, 3d render, blurry, cropped buildings at edges
```

### Anbefalt arbeidsflyt på AI-riggen
1. Bruk skissen `kunst/skisser/<ID>.png` som **styringsbilde**. Det kan være ControlNet med segmentering, canny eller scribble, eller img2img med denoise på omtrent 0,55–0,75. Skissene er flate og fargekodet: grønn er eng, lys brun er vei, mellombrun er borggrunn, mørk brun stripe er palisade, mørkebrunt rektangel er hov, grå stein med rødt er runestein, og den lille firkanten i en lys sirkel er tun med brønn.
2. Lag med samme oppløsning (1024 × 1024), eller høyere og skaler ned.
3. Bruk gjerne **samme seed og samme innstillinger** for alle brikkene, slik at stilen blir lik.
4. Legg bildene i `kunst/brikker/` og åpne `/galleri` i spillet. Der ser du hvilke brikker som er malt, og et tilfeldig brett der du kan se om kantene passer sammen.

---

## 5. Brikkene én for én

Kanter er oppgitt som **N / Ø / S / V** (nord, øst, sør, vest) slik bildet ligger med nord øverst.

---

### A – Hov ved veien · 2 stk
**Kanter:** eng / eng / vei / eng · **Skisse:** [A.png](../kunst/skisser/A.png)

**Motiv:** Et hov står midt på brikken, litt mot nord, omgitt av eng. En vei kommer inn fra sørkanten og ender ved inngangen på hovets sørgavl. Ved siden av hovet står en stor ask og en liten steinsatt horg.

**Detaljer:** dragehoder på gavlene, offerskål på horgen, noen ravner i asketreet, eng med lyng rundt.

**Prompt:**
```
a wooden Norse pagan temple (hov) with steep shingled roof and carved dragon heads on the gables seen from directly above, centered slightly north, surrounded by meadow, a sacred ash tree and a small stone altar beside it, a dirt road enters from the exact middle of the bottom edge and ends at the temple door
```

---

### B – Hovet i lunden · 4 stk
**Kanter:** eng / eng / eng / eng · **Skisse:** [B.png](../kunst/skisser/B.png)

**Motiv:** Et hov midt på brikken, med eng på alle sider og ingen vei. Det står i en liten lund av bjørk og ask, med en steinsetting rundt.

**Detaljer:** et rundt gjerde av staker med hestehodeskaller, en stor ask og noen bautasteiner. Pass på at trærne holder seg innenfor kantsonen.

**Prompt:**
```
a wooden Norse pagan temple (hov) with dragon-head gables seen from directly above in the exact center, inside a small sacred grove of birch and ash trees, ring of standing stones around it, open meadow on all four sides reaching every edge, no road
```

---

### C – Storborgen · 1 stk
**Kanter:** borg / borg / borg / borg · **Runestein** · **Skisse:** [C.png](../kunst/skisser/C.png)

**Motiv:** Hele brikken er inne i en stor borg. Langhus med torvtak ligger tett, med plankeganger mellom. Midt på står en stor runestein på en liten steinlagt plass. Det er ingen palisade, fordi borgen fortsetter på alle kanter.

**Detaljer:** røyk fra røykhull, et smiebål, tønner og fiskehjeller. Ingen hus i kantsonen.

**Prompt:**
```
the inside of a large Viking settlement filling the entire tile, turf-roofed longhouses seen from above, wooden plank walkways, packed earth ground reaching all four edges, a prominent grey runestone with a bright red painted serpent knotwork in the exact center on a small stone-paved square, no palisade
```

---

### D – Borgveien · 4 stk (én av dem er startbrikken)
**Kanter:** borg / vei / eng / vei · **Skisse:** [D.png](../kunst/skisser/D.png)

**Motiv:** En borgkappe med palisade i nord. En rett vei går tvers over brikken fra vest til øst, midt på. Det er eng mellom palisaden og veien og sør for veien.

**Detaljer:** taket på et langhus innenfor palisaden, en reisende med vandrestav på veien og en ku i enga sør for veien.

**Prompt:**
```
top edge: a curved wooden palisade of sharpened logs enclosing part of a Viking settlement with a turf-roofed longhouse, the palisade arcs from the top-left corner to the top-right corner reaching 30% down at its middle; a straight dirt road crosses the tile horizontally from the middle of the left edge to the middle of the right edge; meadow elsewhere
```

---

### E – Palisaden · 5 stk
**Kanter:** borg / eng / eng / eng · **Skisse:** [E.png](../kunst/skisser/E.png)

**Motiv:** En borgkappe med palisade i nord og eng på resten av brikken.

**Detaljer:** bak palisaden et stabbur og en vaktplattform. I enga noen sauer og en steingard. Lag gjerne 2 varianter.

**Prompt:**
```
top edge: a curved wooden palisade of sharpened logs enclosing part of a Viking settlement with turf roofs, arcing from the top-left corner to the top-right corner and reaching 30% down at its middle; the rest of the tile is open meadow with heather, a few sheep and a low stone wall
```

---

### F – Runeborgen på tvers · 2 stk
**Kanter:** eng / borg / eng / borg · **Runestein** · **Skisse:** [F.png](../kunst/skisser/F.png)

**Motiv:** Borgen går tvers over brikken fra vest til øst og smalner av på midten. Mot nord og sør buer palisaden inn, med eng utenfor. En runestein står midt i borgen.

**Detaljer:** én lang gate av planker gjennom borgen, langhus på begge sider og en runestein på en liten plass.

**Prompt:**
```
a Viking settlement band running from the left edge to the right edge, narrowing in the middle, two curved wooden palisades: one arcing between the top corners, one arcing between the bottom corners, meadow outside both palisades at top and bottom, turf-roofed longhouses and a plank street inside, a prominent grey runestone with bright red serpent knotwork in the center
```

---

### G – Borgen på tvers · 1 stk
**Kanter:** borg / eng / borg / eng · **Skisse:** [G.png](../kunst/skisser/G.png)

**Motiv:** Samme form som F, men borgen går fra nord til sør, og det er ingen runestein. Palisadene buer inn fra øst og vest, med eng utenfor.

**Prompt:**
```
a Viking settlement band running from the top edge to the bottom edge, narrowing in the middle, two curved wooden palisades: one arcing between the two left corners, one between the two right corners, meadow outside both palisades at left and right, turf-roofed longhouses and a plank street inside, no runestone
```

---

### H – To naboborger · 3 stk
**Kanter:** borg / eng / borg / eng · **To adskilte borger** · **Skisse:** [H.png](../kunst/skisser/H.png)

**Motiv:** Én borgkappe i nord og én i sør, hver med sin egen palisade. Mellom dem ligger et belte med eng fra vest til øst. De to borgene henger **ikke** sammen.

**Detaljer:** i enga mellom borgene en liten bekk eller et jorde med korn.

**Prompt:**
```
two separate Viking settlements: one behind a curved wooden palisade at the top edge arcing between the top corners, one behind a curved palisade at the bottom edge arcing between the bottom corners, each reaching 30% into the tile; a band of open meadow with a small field of barley between them from left edge to right edge
```

---

### I – Hjørneborgene · 2 stk
**Kanter:** borg / borg / eng / eng · **To adskilte borger** · **Skisse:** [I.png](../kunst/skisser/I.png)

**Motiv:** Én borgkappe i nord og én i øst. Hver har sin egen palisade, og de møtes i det nordøstlige hjørnet uten å henge sammen. Resten er eng.

**Detaljer:** der palisadene møtes i hjørnet, skal det tydelig se ut som to separate gjerder.

**Prompt:**
```
two separate Viking settlements each behind its own curved wooden palisade: one along the top edge arcing between the top corners, one along the right edge arcing between the right corners, the two palisades meet at the top-right corner but the settlements are separate; the rest is open meadow
```

---

### J – Borg og høyresving · 3 stk
**Kanter:** borg / vei / vei / eng · **Skisse:** [J.png](../kunst/skisser/J.png)

**Motiv:** En borgkappe i nord. En vei kommer inn fra midten av østkanten, svinger mykt og går ut midt på sørkanten. Svingen ligger i sørøst. Resten er eng.

> **Ikke speilvend.** K er speilbildet av J.

**Prompt:**
```
top edge: curved wooden palisade of a Viking settlement arcing between the top corners; a dirt road enters at the exact middle of the right edge, curves smoothly and exits at the exact middle of the bottom edge; meadow elsewhere
```

---

### K – Borg og venstresving · 3 stk
**Kanter:** borg / eng / vei / vei · **Skisse:** [K.png](../kunst/skisser/K.png)

**Motiv:** En borgkappe i nord. En vei kommer inn fra midten av vestkanten, svinger mykt og går ut midt på sørkanten. Svingen ligger i sørvest.

**Prompt:**
```
top edge: curved wooden palisade of a Viking settlement arcing between the top corners; a dirt road enters at the exact middle of the left edge, curves smoothly and exits at the exact middle of the bottom edge; meadow elsewhere
```

---

### L – Tunet under borgen · 3 stk
**Kanter:** borg / vei / vei / vei · **Skisse:** [L.png](../kunst/skisser/L.png)

**Motiv:** En borgkappe i nord. Tre veier fra øst, sør og vest møtes i et tun med brønn midt på brikken.

**Detaljer:** brønn med vindestokk, et lite uthus og en kjerre.

**Prompt:**
```
top edge: curved wooden palisade of a Viking settlement arcing between the top corners; three dirt roads from the exact middles of the left, right and bottom edges meet at a small farmyard with a stone well in the center of the tile; meadow between the roads
```

---

### M – Runeborgen i hjørnet · 2 stk
**Kanter:** borg / eng / eng / borg · **Runestein** · **Skisse:** [M.png](../kunst/skisser/M.png)

**Motiv:** Borgen dekker den nordvestlige halvdelen. Palisaden buer fra det nordøstlige til det sørvestlige hjørnet og bukter seg litt ut mot sørøst. Runesteinen står i nordvest. Det er eng i sørøst.

**Prompt:**
```
a Viking settlement fills the upper-left half of the tile, bounded by a curved wooden palisade running from the top-right corner to the bottom-left corner bulging slightly toward the lower right; turf-roofed longhouses inside; a prominent grey runestone with bright red serpent knotwork in the upper-left area; open meadow in the lower-right half
```

---

### N – Hjørneborgen · 3 stk
**Kanter:** borg / eng / eng / borg · **Skisse:** [N.png](../kunst/skisser/N.png)

**Motiv:** Samme som M, men uten runestein.

**Prompt:**
```
a Viking settlement fills the upper-left half of the tile, bounded by a curved wooden palisade running from the top-right corner to the bottom-left corner bulging slightly toward the lower right; turf-roofed longhouses inside; open meadow in the lower-right half, no runestone
```

---

### O – Runeborg med vei · 2 stk
**Kanter:** borg / vei / vei / borg · **Runestein** · **Skisse:** [O.png](../kunst/skisser/O.png)

**Motiv:** Som M, men en vei går i bue gjennom engen i sørøst, fra midten av østkanten til midten av sørkanten.

**Prompt:**
```
a Viking settlement fills the upper-left half, bounded by a curved wooden palisade from the top-right corner to the bottom-left corner; a prominent grey runestone with bright red serpent knotwork in the upper-left; in the lower-right meadow a dirt road curves from the exact middle of the right edge to the exact middle of the bottom edge
```

---

### P – Hjørneborg med vei · 3 stk
**Kanter:** borg / vei / vei / borg · **Skisse:** [P.png](../kunst/skisser/P.png)

**Motiv:** Samme som O, men uten runestein.

**Prompt:**
```
a Viking settlement fills the upper-left half, bounded by a curved wooden palisade from the top-right corner to the bottom-left corner; in the lower-right meadow a dirt road curves from the exact middle of the right edge to the exact middle of the bottom edge; no runestone
```

---

### Q – Runeborgen ved enga · 1 stk
**Kanter:** borg / borg / eng / borg · **Runestein** · **Skisse:** [Q.png](../kunst/skisser/Q.png)

**Motiv:** Borgen dekker nord, øst og vest. Mot sør buer palisaden inn mellom de to sørlige hjørnene, med eng utenfor. Runesteinen står midt i borgen.

**Prompt:**
```
a Viking settlement covers the tile and reaches the top, left and right edges; along the bottom a curved wooden palisade arcs between the two bottom corners reaching 30% up at its middle, with meadow outside it; turf-roofed longhouses; a prominent grey runestone with bright red serpent knotwork near the center
```

---

### R – Storgården · 3 stk
**Kanter:** borg / borg / eng / borg · **Skisse:** [R.png](../kunst/skisser/R.png)

**Motiv:** Samme som Q, men uten runestein. Gjerne med et stort høvdingehus i midten.

**Prompt:**
```
a Viking settlement covers the tile and reaches the top, left and right edges; along the bottom a curved wooden palisade arcs between the two bottom corners with meadow outside it; a large chieftain's longhouse in the middle, no runestone
```

---

### S – Runeporten · 2 stk
**Kanter:** borg / borg / vei / borg · **Runestein** · **Skisse:** [S.png](../kunst/skisser/S.png)

**Motiv:** Som Q, men en vei kommer inn midt på sørkanten og går gjennom en **port i palisaden** og inn i borgen. Runesteinen står like innenfor porten.

**Prompt:**
```
a Viking settlement covers the tile reaching the top, left and right edges; along the bottom a curved wooden palisade arcs between the bottom corners; a dirt road enters at the exact middle of the bottom edge and passes through a wooden gate in the palisade into the settlement; a prominent grey runestone with bright red serpent knotwork just inside the gate
```

---

### T – Borgporten · 1 stk
**Kanter:** borg / borg / vei / borg · **Skisse:** [T.png](../kunst/skisser/T.png)

**Motiv:** Samme som S, men uten runestein.

**Prompt:**
```
a Viking settlement covers the tile reaching the top, left and right edges; along the bottom a curved wooden palisade arcs between the bottom corners; a dirt road enters at the exact middle of the bottom edge and passes through a wooden gate in the palisade; no runestone
```

---

### U – Ferdaveien · 8 stk
**Kanter:** vei / eng / vei / eng · **Skisse:** [U.png](../kunst/skisser/U.png)

**Motiv:** En rett vei fra midten av nordkanten til midten av sørkanten, med eng på begge sider.

**Detaljer:** Dette er en vanlig brikke, så lag gjerne **3 varianter**. Variant 1 kan ha en hest og kjerre, variant 2 en bautastein ved veien og et par bjørker, og variant 3 en bekk under en liten trebro.

**Prompt:**
```
a straight dirt road runs vertically from the exact middle of the top edge to the exact middle of the bottom edge, open Nordic meadow with heather and wildflowers on both sides
```

---

### V – Svingen · 9 stk
**Kanter:** eng / eng / vei / vei · **Skisse:** [V.png](../kunst/skisser/V.png)

**Motiv:** En vei kommer inn midt på vestkanten, svinger og går ut midt på sørkanten. Resten er eng.

**Detaljer:** Dette er den vanligste brikken, så lag gjerne **3 varianter**: en stor stein i svingen, en einerbusk og en geit, eller et lite potetjorde.

**Prompt:**
```
a dirt road enters at the exact middle of the left edge, curves smoothly and exits at the exact middle of the bottom edge; open Nordic meadow elsewhere with a large boulder inside the curve
```

---

### W – Veidelet · 4 stk
**Kanter:** eng / vei / vei / vei · **Skisse:** [W.png](../kunst/skisser/W.png)

**Motiv:** Tre veier fra øst, sør og vest møtes i et tun med brønn midt på brikken. Nord for tunet er det eng.

**Prompt:**
```
three dirt roads from the exact middles of the left, right and bottom edges meet at a small farmyard with a stone well and a tiny storehouse in the center; open meadow on the top half
```

---

### X – Krysset ved brønnen · 1 stk
**Kanter:** vei / vei / vei / vei · **Skisse:** [X.png](../kunst/skisser/X.png)

**Motiv:** Fire veier, én fra midten av hver kant, møtes ved en brønn midt på brikken. Det er eng i de fire hjørnene.

**Prompt:**
```
four dirt roads from the exact middles of all four edges meet at a stone well in the center of the tile, a small farmyard around the well, open meadow in the four corners
```

---

## 6. Varianter

Spillet velger tilfeldig blant variantene til en brikketype. Varianter må ha **nøyaktig samme form** som skissen. Det er bare detaljene som skal være forskjellige.

| Brikke | Antall | Forslag til varianter |
|---|---|---|
| V | 9 | `V.jpg`, `V_2.jpg`, `V_3.jpg` |
| U | 8 | `U.jpg`, `U_2.jpg`, `U_3.jpg` |
| E | 5 | `E.jpg`, `E_2.jpg` |
| B | 4 | `B.jpg`, `B_2.jpg` |
| D | 4 | `D.jpg`, `D_2.jpg` |
| W | 4 | `W.jpg`, `W_2.jpg` |

Variantene er valgfrie. Spillet virker med én fil per brikketype.

---

## 7. Andre bilder

| Fil | Størrelse | Beskrivelse |
|---|---|---|
| `kunst/brikker/bakside.jpg` | 1024 × 1024 | Baksiden av en brikke, brukt på trekkbunken. Mørkt tre med en innskåret ormeslynge og en vikingskipsstavn. |
| `kunst/bord.jpg` | 2048 × 2048 | (Valgfri) Bordbakgrunn til TV-modus: grovt treverk eller mørkt sjøvann sett ovenfra. Brukes **ikke** i prosjektormodus. Der er bakgrunnen svart, slik at det hvite bordet ikke blir lyst opp. |
| `kunst/logo.png` | 1600 × 600, gjennomsiktig | (Valgfri) Logoen «KARKASAND» med runeinspirerte bokstaver og knotemønster. |

**Vikingene** (spillebrikkene) tegner jeg i koden, i sterke spillerfarger. Fargen må være helt tydelig på en prosjektor, og den byttes ut per spiller. Vil du ha malte vikinger senere, trenger vi én PNG med gjennomsiktig bakgrunn per stilling (stående og liggende), malt i nøytral grå, som spillet farger selv.

---

## 8. Sjekkliste før du leverer

- [ ] 24 filer, `A.jpg` til `X.jpg`, i `kunst/brikker/`
- [ ] Alle er nøyaktig 1024 × 1024 og har nord øverst, uten speilvending
- [ ] Veiene treffer midt på kanten og er like brede
- [ ] Palisadene ender i hjørnene
- [ ] Ingen hus, trær eller dyr er kuttet av kanten
- [ ] Runesteinene er lett synlige på C, F, M, O, Q og S
- [ ] Ingen tekst, ramme eller vignett
- [ ] Lyset er mykt, uten skygger i én retning
