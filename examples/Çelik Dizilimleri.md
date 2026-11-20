---
tags: [knitspec, çelik-dizilimi]
source: Excel "Ethem Dashboard", sheet "Çelik Dizilimleri"
---
# Çelik dizilimleri: K1825, K2475

Written the way the floor writes them: tracks top-down (2′ 2 1′ 1), feeders as columns, and the yarn per feeder in the `F` row. The sheet does not show the needle set-out, loop lengths, diameter, gauge or RPM. The card says what it assumed (the set-out) and what it still needs.

## K1825

Polyester (F2, F4) knits on tracks 2–2′, cotton (F1, F3) on tracks 1–1′, and polyester tucks on 1′ and 1 tie the two together.

```knit
article: K1825
structure: ABD Pike İnterlok
machine: SJ 4 tracks 28F

2' M K M K
2  M K M K
1' K T K M
1  K M K T
F  Y1 Y2 Y1 Y2

Y1 = 40/1 Penye
Y2 = 70/36 Poly
```

## K2475

The sheet has six track rows. Read in the same way as K1825, they are tracks 3′ 3 2′ 2 1′ 1 on a single jersey. **This is a guess: it could also be a double jersey**; see the questions below. Rows 3 and 2′ never knit and are shown dimmed (no needles).

```knit
article: K2475
status: draft-from-excel
machine: SJ 6 tracks

3' K K K M K K K
3  M M M M M M M
2' M M M M M M M
2  K M K M M M K
1' M M M K K M M
1  M M K M M K K
F  Y1 Y2 Y3 Y1 Y2 Y3 -    # F7 yarn not filled in the sheet

Y1 = 150/48 Pol
Y2 = 70/36 Poly
Y3 = 30/1 Penye
```

## To fill in from the machine or the master

- [ ] K2475: single jersey with 6 tracks, or double jersey (which rows are kapak)?
- [ ] Needle set-out for both, e.g. `silindir: 1 1' 2 2'`.
- [ ] K2475 F7: which yarn? Is the repeat really 7 feeders? It must divide the machine's feeder count.
- [ ] "70/36" and "150/48": denier (as read now) or dtex?
- [ ] Diameter, gauge, RPM (`machine: SJ 30" E28 28F 25rpm`), `needles:` from the plate, and an `L` row of loop lengths, to get kg/h, GSM and composition.
