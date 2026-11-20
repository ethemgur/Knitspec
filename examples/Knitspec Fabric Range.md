---
tags: [knitspec, sample]
---
# Knitspec fabric range

Six common circular-knit fabrics, one block each. Machine figures and yarns are typical values, not factory articles. Every block is marked `template-unverified` until a master checks it against the real set-up sheet. Switch labels with **Knitspec: Switch labels Turkish / English**.

## 1. Süprem (single jersey)

The plainest structure: one track, every needle knits at every feeder.

```knit
article: SUP-3001
status: template-unverified
structure: süprem
machine: SJ 30" E28 96F 28rpm 85%
needles: 2640
cylinder: A

      F1
A     K
yarn  Y1
loop  2.75

Y1 = Ne 30/1 CO
finished: 150 gsm 180 cm
```

## 2. İki iplik (two-thread fleece)

Ground yarn knits on every needle. The loop (fleece) yarn tucks on one needle in four and floats over the other three, on the back. The tuck moves from A to C on the next pass, so the loops are staggered.

```knit
article: IKI-2201
status: template-unverified
structure: iki-iplik
machine: SJ 30" E20 96F 22rpm 85% 4 tracks
needles: 1884
cylinder: ABCD

      F1  F2  F3  F4
A     T   K   M   K
B     M   K   M   K
C     M   K   T   K
D     M   K   M   K
yarn  Y2  Y1  Y2  Y1
loop  1.6 2.7 1.6 2.7

Y1 = Ne 30/1 CO
Y2 = Ne 20/1 CO
finished: 240 gsm 175 cm
```

## 3. Üç iplik (three-thread fleece)

Three yarns: a thick fleece yarn tucked one in four, a fine binder that holds it, and the face yarn. **The cam set-up here is my best guess.** Masters set three-thread fleece in different ways, so check the binder row in particular.

```knit
article: UC-3301
status: template-unverified
structure: üç-iplik
machine: SJ 30" E20 96F 20rpm 85% 4 tracks
needles: 1884
cylinder: ABCD

      F1  F2  F3  F4  F5  F6
A     T   K   K   M   K   K
B     M   K   K   M   K   K
C     M   K   K   T   K   K
D     M   K   K   M   K   K
yarn  Y3  Y2  Y1  Y3  Y2  Y1
loop  1.6 2.4 2.8 1.6 2.4 2.8

Y1 = Ne 30/1 CO
Y2 = 75/36 dtex PES
Y3 = Ne 10/1 CO
finished: 320 gsm 175 cm
```

## 4. Ribana (1×1 rib)

Double jersey in rib gating: each dial needle sits between two cylinder needles, and both beds knit at every feeder.

```knit
article: RIB-1801
status: template-unverified
structure: ribana-1x1
machine: rib 30" E18 60F 22rpm 85%
cylinder: A
dial: A'

      F1
A'    K
A     K
yarn  Y1
loop  3.0

Y1 = Ne 30/1 CO
finished: 220 gsm 120 cm
```

## 5. İnterlok (interlock)

Long (A) and short (B) needles, with dial and cylinder needles facing each other. F1 knits the long needles of both beds and F2 the short ones. Each feeder makes a 1×1 rib, and the two ribs lock together.

```knit
article: INT-2401
status: template-unverified
structure: interlok
machine: interlock 30" E24 72F 24rpm 85%
needles: 2256
cylinder: AB
dial: B'A'

      F1  F2
A'    K   M
B'    M   K
A     K   M
B     M   K
yarn  Y1
loop  1.7

Y1 = Ne 40/1 CO
finished: 200 gsm 180 cm
```

## 6. Double face (on an interlock machine)

Cotton on the face (cylinder), polyester on the back (dial). The face yarn tucks onto alternate dial needles to tie the two layers together. A tuck from the cylinder feed onto the dial needs the dial **between** the cylinder needles, so this block uses rib gating. Check with the master how the factory's interlock machines are set for double face.

```knit
article: DF-2402
status: template-unverified
structure: double-face
machine: rib 30" E24 72F 20rpm 85%
needles: 2256
cylinder: AB
dial: A'B'

      F1  F2  F3  F4
A'    T   K   M   K
B'    M   K   T   K
A     K   M   K   M
B     K   M   K   M
yarn  Y1  Y2  Y1  Y2
loop  2.2 2.0 2.2 2.0

Y1 = Ne 30/1 CO
Y2 = 75/72 dtex PES
finished: 260 gsm 170 cm
```
