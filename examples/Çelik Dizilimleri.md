---
tags: [knitspec, çelik-dizilimi]
source: Excel "Ethem Dashboard", sheet "Çelik Dizilimleri"
---
# Çelik dizilimleri: K1825, K2475

Typed in the same way as the Excel sheet: **rows are tracks** (1–4; kapak tracks with an apostrophe, 1′ 2′), **columns are feeders**, with the yarn under each feeder. The sheet does not show the needle set-out, machine, loop lengths or RPM. The card says what it assumed (the set-out) and what it still needs.

## K1825

Two-face single jersey: polyester (F2, F4) knits on tracks 1–2, cotton (F1, F3) knits on tracks 3–4, and polyester tucks on tracks 3 and 4 tie the two together.

```knit
article: K1825
structure: cotton/polyester two-face single jersey
status: draft-from-excel
machine: SJ 4 tracks

      F1  F2  F3  F4
1     M   K   M   K
2     M   K   M   K
3     K   T   K   M
4     K   M   K   T
yarn  Y1  Y2  Y1  Y2

Y1 = 40/1 Penye
Y2 = 70/36 Poly
```

## K2475

Six track rows is more than a 4-track single jersey has, so this reads it as a **double jersey**: kapak tracks 1′ 2′ and silindir tracks 1–4. Rows 2′ and 1 never knit; the plugin treats them as tracks with no needles and leaves them out of the assumed set-out.

```knit
article: K2475
structure: cotton/polyester double jersey
status: draft-from-excel
machine: DJ               # ⚠ assumed from 6 track rows

      F1  F2  F3  F4  F5  F6  F7
1'    K   K   K   M   K   K   K
2'    M   M   M   M   M   M   M
1     M   M   M   M   M   M   M
2     K   M   K   M   M   M   K
3     M   M   M   K   K   M   M
4     M   M   K   M   M   K   K
yarn  Y1  Y2  Y3  Y1  Y2  Y3  -   # F7 yarn not filled in the sheet

Y1 = 150/48 Pol
Y2 = 70/36 Poly
Y3 = 30/1 Penye
```

Expected checks on the card:
- **F7 knits but has no yarn.** The sheet's yarn row stops at F6. The 3-yarn cycle says 150/48, but F7 has the same cams as F3 (cotton).
- **F4: long float.** 150/48 knits only silindir track 3. Whether it is real depends on the actual set-out.

## To fill in from the machine or the master

- [ ] Is K2475 double jersey? Which rows are kapak and which silindir?
- [ ] Needle set-out (iğne dizilimi) for both, e.g. `silindir: 1234` or `1324`.
- [ ] K2475 F7: which yarn? Is the repeat really 7 feeders? It must divide the machine's feeder count.
- [ ] "70/36" and "150/48": denier (as read now) or dtex?
- [ ] Machine (`machine: SJ 30" E28 96F 25rpm`), `needles:` from the plate, and a `loop` row, to get kg/h, GSM and composition.
