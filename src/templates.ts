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

const sjMachine = `machine:
  type: single-jersey
  diameter: 30        # inch
  gauge: 28           # E
  feeders: 96
  rpm: 25
  efficiency: 0.85`;

const djMachine = (gating: string) => `machine:
  type: double-jersey
  gating: ${gating}
  diameter: 30
  gauge: 18
  feeders: 60
  rpm: 22
  efficiency: 0.85`;

export const BUILTIN_TEMPLATES: Template[] = [
  {
    id: "single-jersey",
    name: "Single jersey (plain)",
    body: `article: NEW
structure: single-jersey
status: template-unverified
${sjMachine}
setout:
  cylinder: A
cams:
  F1: K
yarns:
  Y1: { count: 75 dtex, material: PES }
feeds:
  F1: { yarn: Y1, loop: 2.9 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "single-jersey-elastane",
    name: "Single jersey plated with elastane",
    body: `article: NEW
structure: single-jersey-plated
status: template-unverified
${sjMachine}
setout:
  cylinder: A
cams:
  F1: K
yarns:
  Y1: { count: 75 dtex, material: PES }
  Y2: { count: 22 dtex, material: EA }
feeds:
  F1: { yarn: Y1, loop: 2.9 mm, plate: Y2, draft: 3 }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "single-pique",
    name: "Single piqué (Lacoste)",
    body: `article: NEW
structure: single-pique
status: template-unverified
${sjMachine}
setout:
  cylinder: AB
cams:                 # one letter per track: A B
  F1: KK
  F2: KT
  F3: KK
  F4: TK
yarns:
  Y1: { count: 75 dtex, material: PES }
feeds:
  F1-F4: { yarn: Y1, loop: 2.9 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "double-pique",
    name: "Double piqué (double Lacoste)",
    body: `article: NEW
structure: double-pique
status: template-unverified
${sjMachine}
setout:
  cylinder: AB
cams:
  F1: TK
  F2: TK
  F3: KK
  F4: KT
  F5: KT
  F6: KK
yarns:
  Y1: { count: 75 dtex, material: PES }
feeds:
  F1-F6: { yarn: Y1, loop: 2.9 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "tuck-mesh",
    name: "Tuck mesh (micro mesh)",
    body: `article: NEW
structure: tuck-mesh
status: template-unverified
${sjMachine}
setout:
  cylinder: AB
cams:
  F1: TK
  F2: KT
yarns:
  Y1: { count: 75 dtex, material: PES }
feeds:
  F1-F2: { yarn: Y1, loop: 2.8 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "two-thread-fleece",
    name: "Two-thread fleece (French terry)",
    body: `article: NEW
structure: two-thread-fleece
status: template-unverified
${sjMachine}
  tracks: 4
setout:
  cylinder: ABCD
cams:                 # tracks A B C D
  F1: TMMM            # loop yarn tucks on A
  F2: KKKK            # ground
  F3: MMTM            # loop yarn tucks on C
  F4: KKKK
yarns:
  Y1: { count: Ne 30/1, material: CO }
  Y2: { count: Ne 20/1, material: CO }
feeds:
  F1: { yarn: Y2, loop: 1.6 mm }
  F2: { yarn: Y1, loop: 2.7 mm }
  F3: { yarn: Y2, loop: 1.6 mm }
  F4: { yarn: Y1, loop: 2.7 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "three-thread-fleece",
    name: "Three-thread fleece",
    body: `article: NEW
structure: three-thread-fleece
status: template-unverified
${sjMachine}
  tracks: 4
setout:
  cylinder: ABCD
cams:                 # tracks A B C D
  F1: TMMM            # fleece yarn tucks on A
  F2: KKKK            # binder
  F3: KKKK            # face
  F4: MMTM            # fleece yarn tucks on C
  F5: KKKK
  F6: KKKK
yarns:
  Y1: { count: Ne 30/1, material: CO }
  Y2: { count: 75 dtex, material: PES }
  Y3: { count: Ne 10/1, material: CO }
feeds:
  F1: { yarn: Y3, loop: 1.4 mm }
  F2: { yarn: Y2, loop: 2.4 mm }
  F3: { yarn: Y1, loop: 2.8 mm }
  F4: { yarn: Y3, loop: 1.4 mm }
  F5: { yarn: Y2, loop: 2.4 mm }
  F6: { yarn: Y1, loop: 2.8 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "rib-1x1",
    name: "1×1 rib",
    body: `article: NEW
structure: rib-1x1
status: template-unverified
${djMachine("rib")}
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
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "rib-2x2",
    name: "2×2 rib",
    body: `article: NEW
structure: rib-2x2
status: template-unverified
${djMachine("rib")}
setout:               # "-" = needle taken out
  cylinder: AA--
  dial: -AA-
cams:
  F1: { cyl: K, dial: K }
yarns:
  Y1: { count: Ne 30/1, material: CO }
feeds:
  F1: { yarn: Y1, loop: 3.0 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "interlock",
    name: "Interlock",
    body: `article: NEW
structure: interlock
status: template-unverified
${djMachine("interlock").replace("gauge: 18", "gauge: 24")}
setout:               # long (A) and short (B) needles
  cylinder: AB
  dial: BA
cams:                 # tracks A B
  F1: { cyl: KM, dial: KM }
  F2: { cyl: MK, dial: MK }
yarns:
  Y1: { count: Ne 40/1, material: CO }
feeds:
  F1-F2: { yarn: Y1, loop: 1.7 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
  {
    id: "spacer",
    name: "Spacer / scuba",
    body: `article: NEW
structure: spacer
status: template-unverified
${djMachine("interlock").replace("gauge: 18", "gauge: 24")}
setout:
  cylinder: AB
  dial: AB
cams:                 # tracks A B
  F1: { cyl: KK, dial: MM }   # face
  F2: { cyl: MM, dial: KK }   # back
  F3: { cyl: TM, dial: MT }   # spacer yarn
  F4: { cyl: KK, dial: MM }
  F5: { cyl: MM, dial: KK }
  F6: { cyl: MT, dial: TM }
yarns:
  Y1: { count: 75 dtex, material: PES }
  Y2: { count: 33 dtex, material: PES-mono }
feeds:
  F1-F2: { yarn: Y1, loop: 1.8 mm }
  F3: { yarn: Y2, loop: 2.4 mm }
  F4-F5: { yarn: Y1, loop: 1.8 mm }
  F6: { yarn: Y2, loop: 2.4 mm }
fabric:
  grey: {}            # gsm, width (cm), cpc, wpc`,
  },
];

export function templateBlock(body: string): string {
  return "```knit\n" + body.trim() + "\n```\n";
}
