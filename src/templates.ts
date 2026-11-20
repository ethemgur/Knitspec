/**
 * Built-in structure templates. Each is a starting point and ships with
 * `status: template-unverified` until it has been checked against a real
 * sample or a master's set-up sheet (see the plan's structure library).
 */
export interface Template {
  id: string;
  name: string;
  body: string;
}

const SJ = 'machine: SJ 30" E28 96F 25rpm 85%';

export const BUILTIN_TEMPLATES: Template[] = [
  {
    id: "single-jersey",
    name: "Süprem (single jersey)",
    body: `article: NEW
structure: süprem
status: template-unverified
${SJ}
cylinder: A

      F1
A     K
yarn  Y1
loop  2.75

Y1 = 30/1 Penye
grey:          # e.g. 150 gsm 180 cm 20 cpc 14 wpc`,
  },
  {
    id: "single-jersey-elastane",
    name: "Likralı süprem (single jersey plated with elastane)",
    body: `article: NEW
structure: likralı süprem
status: template-unverified
${SJ}
cylinder: A

      F1
A     K
yarn  Y1+Y2     # Y2 plated with Y1
loop  2.9

Y1 = 75 dtex PES
Y2 = 22 dtex likra draft 3
grey:`,
  },
  {
    id: "single-pique",
    name: "Lakost (single piqué)",
    body: `article: NEW
structure: lakost
status: template-unverified
${SJ}
cylinder: AB

      F1 F2 F3 F4
A     K  K  K  T
B     K  T  K  K
yarn  Y1
loop  2.9

Y1 = 75 dtex PES
grey:`,
  },
  {
    id: "double-pique",
    name: "Çift lakost (double piqué)",
    body: `article: NEW
structure: çift lakost
status: template-unverified
${SJ}
cylinder: AB

      F1 F2 F3 F4 F5 F6
A     T  T  K  K  K  K
B     K  K  K  T  T  K
yarn  Y1
loop  2.9

Y1 = 75 dtex PES
grey:`,
  },
  {
    id: "tuck-mesh",
    name: "Askılı file (tuck mesh)",
    body: `article: NEW
structure: askılı file
status: template-unverified
${SJ}
cylinder: AB

      F1 F2
A     T  K
B     K  T
yarn  Y1
loop  2.8

Y1 = 75 dtex PES
grey:`,
  },
  {
    id: "two-thread-fleece",
    name: "İki iplik (two-thread fleece)",
    body: `article: NEW
structure: iki iplik
status: template-unverified
machine: SJ 30" E20 96F 22rpm 4 tracks
cylinder: ABCD

      F1  F2  F3  F4
A     T   K   M   K      # loop yarn tucks on A …
B     M   K   M   K
C     M   K   T   K      # … then on C
D     M   K   M   K
yarn  Y2  Y1  Y2  Y1
loop  1.6 2.7 1.6 2.7

Y1 = 30/1 Penye          # ground
Y2 = 20/1 Penye          # loop
grey:`,
  },
  {
    id: "three-thread-fleece",
    name: "Üç iplik (three-thread fleece)",
    body: `article: NEW
structure: üç iplik
status: template-unverified
machine: SJ 30" E20 96F 20rpm 4 tracks
cylinder: ABCD

      F1  F2  F3  F4  F5  F6
A     T   K   K   M   K   K
B     M   K   K   M   K   K
C     M   K   K   T   K   K
D     M   K   K   M   K   K
yarn  Y3  Y2  Y1  Y3  Y2  Y1
loop  1.6 2.4 2.8 1.6 2.4 2.8

Y1 = 30/1 Penye          # face
Y2 = 75/36 Poly          # binder
Y3 = 10/1 Penye          # fleece
grey:`,
  },
  {
    id: "rib-1x1",
    name: "Ribana 1×1",
    body: `article: NEW
structure: ribana 1x1
status: template-unverified
machine: rib 30" E18 60F 22rpm
cylinder: A
dial: A'

      F1
A'    K
A     K
yarn  Y1
loop  3.0

Y1 = 30/1 Penye
grey:`,
  },
  {
    id: "rib-2x2",
    name: "Ribana 2×2",
    body: `article: NEW
structure: ribana 2x2
status: template-unverified
machine: rib 30" E18 60F 22rpm
cylinder: AA--           # - = needle taken out
dial: -A'A'-

      F1
A'    K
A     K
yarn  Y1
loop  3.0

Y1 = 30/1 Penye
grey:`,
  },
  {
    id: "interlock",
    name: "İnterlok",
    body: `article: NEW
structure: interlok
status: template-unverified
machine: interlock 30" E24 72F 24rpm
cylinder: AB             # A long, B short needles
dial: B'A'               # long dial needle faces short cylinder needle

      F1  F2
A'    K   M
B'    M   K
A     K   M
B     M   K
yarn  Y1
loop  1.7

Y1 = 40/1 Penye
grey:`,
  },
  {
    id: "spacer",
    name: "Scuba / spacer",
    body: `article: NEW
structure: scuba
status: template-unverified
machine: interlock 30" E24 72F 20rpm
cylinder: AB
dial: A'B'

      F1  F2  F3  F4  F5  F6
A'    M   K   M   M   K   T
B'    M   K   T   M   K   M
A     K   M   T   K   M   M
B     K   M   M   K   M   T
yarn  Y1  Y1  Y2  Y1  Y1  Y2
loop  1.8 1.8 2.4 1.8 1.8 2.4

Y1 = 75/72 Poly          # face and back
Y2 = 33 dtex PES         # spacer monofilament
grey:`,
  },
];

export function templateBlock(body: string): string {
  return "```knit\n" + body.trim() + "\n```\n";
}
