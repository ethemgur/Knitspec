---
tags: [knitspec, sample]
---
# Knitspec fabric range

Six common circular-knit fabrics, one block each. Machine figures and yarns are typical values, not factory articles. Every block is marked `template-unverified` until a master checks it against the real set-up sheet. Switch labels with **Knitspec: Switch labels Turkish / English**.

## 1. Süprem (single jersey)

The plainest structure: one track, every needle knits at every feeder.

```knit
article: SUP-3001
structure: süprem
status: template-unverified
machine:
  type: single-jersey
  diameter: 30
  gauge: 28
  feeders: 96
  rpm: 28
  efficiency: 0.85
  needles: 2640
setout:
  cylinder: A
cams:
  F1: K
yarns:
  Y1: { count: Ne 30/1, material: CO }
feeds:
  F1: { yarn: Y1, loop: 2.75 mm }
fabric:
  finished: { gsm: 150, width: 180 cm }
```

## 2. İki iplik (two-thread fleece)

Ground yarn knits on every needle. The loop (fleece) yarn tucks on one needle in four and floats over the other three, on the back. The tuck moves from A to C on the next pass, so the loops are staggered.

```knit
article: IKI-2201
structure: iki-iplik
status: template-unverified
machine:
  type: single-jersey
  diameter: 30
  gauge: 20
  feeders: 96
  rpm: 22
  efficiency: 0.85
  needles: 1884
  tracks: 4
setout:
  cylinder: ABCD
cams:                 # tracks A B C D
  F1: TMMM            # loop yarn tucks on A
  F2: KKKK            # ground
  F3: MMTM            # loop yarn tucks on C
  F4: KKKK            # ground
yarns:
  Y1: { count: Ne 30/1, material: CO }    # ground
  Y2: { count: Ne 20/1, material: CO }    # loop
feeds:
  F1: { yarn: Y2, loop: 1.6 mm }
  F2: { yarn: Y1, loop: 2.7 mm }
  F3: { yarn: Y2, loop: 1.6 mm }
  F4: { yarn: Y1, loop: 2.7 mm }
fabric:
  finished: { gsm: 240, width: 175 cm }
```

## 3. Üç iplik (three-thread fleece)

Three yarns: a thick fleece yarn tucked one in four, a fine binder that holds it, and the face yarn. **The cam set-up here is my best guess.** Masters set three-thread fleece in different ways, so check the binder row in particular.

```knit
article: UC-3301
structure: üç-iplik
status: template-unverified
machine:
  type: single-jersey
  diameter: 30
  gauge: 20
  feeders: 96
  rpm: 20
  efficiency: 0.85
  needles: 1884
  tracks: 4
setout:
  cylinder: ABCD
cams:                 # tracks A B C D
  F1: TMMM            # fleece yarn tucks on A
  F2: KKKK            # binder
  F3: KKKK            # face
  F4: MMTM            # fleece yarn tucks on C
  F5: KKKK            # binder
  F6: KKKK            # face
yarns:
  Y1: { count: Ne 30/1, material: CO }      # face
  Y2: { count: 75/36 dtex, material: PES }  # binder
  Y3: { count: Ne 10/1, material: CO }      # fleece
feeds:
  F1: { yarn: Y3, loop: 1.6 mm }
  F2: { yarn: Y2, loop: 2.4 mm }
  F3: { yarn: Y1, loop: 2.8 mm }
  F4: { yarn: Y3, loop: 1.6 mm }
  F5: { yarn: Y2, loop: 2.4 mm }
  F6: { yarn: Y1, loop: 2.8 mm }
fabric:
  finished: { gsm: 320, width: 175 cm }
```

## 4. Ribana (1×1 rib)

Double jersey in rib gating: each dial needle sits between two cylinder needles, and both beds knit at every feeder.

```knit
article: RIB-1801
structure: ribana-1x1
status: template-unverified
machine:
  type: double-jersey
  gating: rib
  diameter: 30
  gauge: 18
  feeders: 60
  rpm: 22
  efficiency: 0.85
setout:
  cylinder: A
  dial: A
cams:
  F1: { cyl: K, dial: K }
yarns:
  Y1: { count: Ne 30/1, material: CO }
feeds:
  F1: { yarn: Y1, loop: 3.0 mm }
fabric:
  finished: { gsm: 220, width: 120 cm }   # tube fabrics are often quoted as flat width
```

## 5. İnterlok (interlock)

Long (A) and short (B) needles, with dial and cylinder needles facing each other. F1 knits the long needles of both beds and F2 the short ones. Each feeder makes a 1×1 rib, and the two ribs lock together.

```knit
article: INT-2401
structure: interlok
status: template-unverified
machine:
  type: interlock
  diameter: 30
  gauge: 24
  feeders: 72
  rpm: 24
  efficiency: 0.85
  needles: 2256
setout:
  cylinder: AB
  dial: BA            # long dial needle faces short cylinder needle
cams:                 # tracks A B
  F1: { cyl: KM, dial: KM }
  F2: { cyl: MK, dial: MK }
yarns:
  Y1: { count: Ne 40/1, material: CO }
feeds:
  F1-F2: { yarn: Y1, loop: 1.7 mm }
fabric:
  finished: { gsm: 200, width: 180 cm }
```

## 6. Double face (on an interlock machine)

Cotton on the face (cylinder), polyester on the back (dial). The face yarn tucks onto alternate dial needles to tie the two layers together. A tuck from the cylinder feed onto the dial needs the dial **between** the cylinder needles, so this block uses rib gating. Check with the master how the factory's interlock machines are set for double face.

```knit
article: DF-2402
structure: double-face
status: template-unverified
machine:
  type: double-jersey
  gating: rib
  diameter: 30
  gauge: 24
  feeders: 72
  rpm: 20
  efficiency: 0.85
  needles: 2256
setout:
  cylinder: AB
  dial: AB
cams:                 # tracks A B
  F1: { cyl: KK, dial: TM }   # face yarn knits cylinder, ties on dial A
  F2: { cyl: MM, dial: KK }   # back yarn knits dial
  F3: { cyl: KK, dial: MT }   # face yarn knits cylinder, ties on dial B
  F4: { cyl: MM, dial: KK }   # back yarn knits dial
yarns:
  Y1: { count: Ne 30/1, material: CO }       # face
  Y2: { count: 75/72 dtex, material: PES }   # back
feeds:
  F1: { yarn: Y1, loop: 2.2 mm }
  F2: { yarn: Y2, loop: 2.0 mm }
  F3: { yarn: Y1, loop: 2.2 mm }
  F4: { yarn: Y2, loop: 2.0 mm }
fabric:
  finished: { gsm: 260, width: 170 cm }
```
