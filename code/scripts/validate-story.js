// scripts/validate-story.js — Checks story.json before you play it.
//
//   npm run validate                 → checks public/story.json
//   npm run validate -- other.json   → checks another file
//
// 1. Static checks: ids, themes, exits that point to missing nodes, dice that
//    don't cover 1–6, missing images.
// 2. Play-through: explores EVERY reachable game state (node + inventory +
//    flags) with the same rules as the game (src/engine.js), and reports:
//      • dead ends:  a non-final node where no choice is available
//      • traps:      states from which no ending can be reached (endless loops)
//      • nodes that can never be reached
// Exit code 1 if there are errors.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStory, explore, nodeKind } from "../src/engine.js";
import { THEMES } from "../src/components/Background/themes.js";

const MAX_STATES = 50000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.resolve(process.argv[2] ?? path.join(root, "public", "story.json"));

const errors = [];
const warnings = [];

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

let story;
try {
  story = buildStory(JSON.parse(readFileSync(file, "utf8")));
} catch (e) {
  fail(`${path.relative(process.cwd(), file)}: ${e.message}`);
}

const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const publicAsset = (p) => existsSync(path.join(root, "public", p.replace(/^\.?\//, "")));

// ── 1. Static checks ──────────────────────────────────────────

const itemsAdded = new Set();

function checkItems(where, source) {
  for (const item of toArray(source?.addToInventory)) {
    if (!item.id || !item.name) errors.push(`${where} oggetto senza id o name`);
    if (item.imagePath && !publicAsset(item.imagePath)) {
      errors.push(`${where} immagine oggetto mancante: ${item.imagePath}`);
    }
    itemsAdded.add(item.id);
  }
}

for (const node of story.nodes.values()) {
  const where = `[${node.id}]`;
  const kind = nodeKind(node);
  const targets = [];

  if (!Array.isArray(node.texts) || node.texts.length === 0) {
    errors.push(`${where} "texts" mancante o vuoto`);
  }
  if (!node.theme) warnings.push(`${where} nessun "theme"`);
  else if (!THEMES[node.theme]) errors.push(`${where} tema sconosciuto "${node.theme}"`);

  const mechanics = ["cards", "dice", "pin"].filter((k) => node[k]);
  if (mechanics.length > 1) errors.push(`${where} più meccaniche insieme: ${mechanics.join(", ")}`);
  if (kind === "none") errors.push(`${where} nessuna uscita: servono cards, dice, pin, nextNode o isEnd`);
  if (mechanics.length && node.nextNode != null) {
    warnings.push(`${where} "nextNode" ignorato: il nodo usa ${mechanics[0]}`);
  }

  checkItems(`${where} onEnter:`, node.onEnter);

  if (node.cards) {
    if (!node.cards.length) errors.push(`${where} "cards" è vuoto`);
    node.cards.forEach((c, i) => {
      if (!c.textCard) errors.push(`${where} carta ${i + 1} senza "textCard"`);
      if (c.cardPath && !publicAsset(c.cardPath)) {
        errors.push(`${where} immagine carta mancante: ${c.cardPath}`);
      }
      checkItems(`${where} carta "${c.textCard}":`, c);
      targets.push([c.nextNode, `carta "${c.textCard}"`]);
    });
  }

  if (node.dice) {
    const cover = Array(7).fill(0);
    node.dice.forEach((r) => {
      const [a, b] = r.range ?? [];
      if (!(a >= 1 && b <= 6 && a <= b)) {
        errors.push(`${where} range del dado non valido: ${JSON.stringify(r.range)}`);
        return;
      }
      for (let v = a; v <= b; v++) cover[v]++;
      checkItems(`${where} dado ${a}-${b}:`, r);
      targets.push([r.nextNode, `dado ${a}-${b}`]);
    });
    for (let v = 1; v <= 6; v++) {
      if (cover[v] === 0) errors.push(`${where} il risultato ${v} del dado non porta da nessuna parte`);
      if (cover[v] > 1) errors.push(`${where} il risultato ${v} del dado è coperto da più regole`);
    }
  }

  if (node.pin) {
    if (!/^\d+$/.test(String(node.pin.code ?? ""))) errors.push(`${where} PIN mancante o non numerico`);
    targets.push([node.pin.nextNode, "PIN"]);
    if (node.pin.leave) targets.push([node.pin.leave.nextNode, "PIN: rimetti via il telefono"]);
  }

  if (kind === "continue") targets.push([node.nextNode, "continua"]);

  for (const [to, via] of targets) {
    if (!story.nodes.has(to)) errors.push(`${where} ${via} → "${to}" non esiste`);
  }
}

// Conditions on items nobody ever gives
for (const node of story.nodes.values()) {
  for (const c of node.cards ?? []) {
    for (const id of [c.requiresItem, c.hideIfItem]) {
      if (id && !itemsAdded.has(id)) {
        errors.push(`[${node.id}] la carta "${c.textCard}" usa l'oggetto "${id}", che nessun nodo dà`);
      }
    }
  }
}

// ── 2. Play-through exploration ───────────────────────────────

// Same BFS the story graph page uses (src/engine.js → explore)
const { states, edges, endKeys, deadEnds, truncated } = explore(story, MAX_STATES);

function pathTo(k) {
  const steps = [];
  for (let cur = k; cur; cur = states.get(cur).parent) {
    const s = states.get(cur);
    steps.unshift(s.via ? `(${s.via}) ${s.id}` : s.id);
  }
  return steps.join(" → ");
}

const describe = (k) => {
  const { state } = states.get(k);
  const inv = state.inventory.map((i) => i.id).join(", ") || "vuoto";
  const flags = state.flags.join(", ") || "nessuno";
  return `inventario: ${inv} · flag: ${flags}`;
};

for (const k of deadEnds) {
  errors.push(`Vicolo cieco in ${states.get(k).id}: nessuna scelta disponibile (${describe(k)})\n    percorso: ${pathTo(k)}`);
}

// States that can reach an ending (reverse search from the endings)
const reverse = new Map();
for (const [from, tos] of edges) {
  for (const to of tos) {
    if (!reverse.has(to)) reverse.set(to, []);
    reverse.get(to).push(from);
  }
}
const canFinish = new Set(endKeys);
const back = [...endKeys];
while (back.length) {
  for (const prev of reverse.get(back.pop()) ?? []) {
    if (!canFinish.has(prev)) {
      canFinish.add(prev);
      back.push(prev);
    }
  }
}

if (!truncated) {
  const trapped = [...states.keys()].filter((k) => !canFinish.has(k) && !deadEnds.includes(k));
  // Report only the first state of each trap (its parent can still finish)
  for (const k of trapped.filter((k) => canFinish.has(states.get(k).parent))) {
    errors.push(`Trappola in ${states.get(k).id}: da qui non si arriva a nessun finale (${describe(k)})\n    percorso: ${pathTo(k)}`);
  }
}

const reached = new Set([...states.values()].map((s) => s.id));
for (const id of story.nodes.keys()) {
  if (!reached.has(id)) warnings.push(`[${id}] non è raggiungibile da ${story.start}`);
}
if (truncated) warnings.push(`Esplorazione interrotta a ${MAX_STATES} stati: risultati parziali`);
if (endKeys.length === 0) errors.push("Nessun finale raggiungibile");

// ── Report ────────────────────────────────────────────────────

const endings = new Set(endKeys.map((k) => states.get(k).id));
console.log(`Storia: ${path.relative(process.cwd(), file)}`);
console.log(
  `  ${story.nodes.size} nodi · ${states.size} stati di gioco esplorati · ` +
    `finali raggiungibili: ${[...endings].join(", ") || "nessuno"}`,
);
warnings.forEach((w) => console.log(`⚠ ${w}`));
errors.forEach((e) => console.log(`✖ ${e}`));
if (errors.length) {
  console.log(`\n${errors.length} errori.`);
  process.exit(1);
}
console.log(`\n✔ Nessun errore${warnings.length ? ` (${warnings.length} avvisi)` : ""}.`);
