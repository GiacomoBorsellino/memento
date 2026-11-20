// StoryGraph/graphModel.js — story.json → nodes and arrows for React Flow.
//
// Pure functions, no React: the drawing (StoryGraph.jsx) only renders what
// is computed here. Arrows come from engine.staticExits (every exit, even the
// conditional ones); problems and "play from here" states come from
// engine.explore, the same play-through the validator runs.

import dagre from "@dagrejs/dagre";
import { explore, nodeKind, staticExits } from "../../engine.js";

// The five node categories, in legend order.
export const CATEGORIES = {
  bound: { label: "Inizio / fine", color: "#c8a84b" },
  cards: { label: "Carte", color: "#5fa98a" },
  dice: { label: "Dado", color: "#6f93d6" },
  text: { label: "Solo testo", color: "#a39782" },
  special: { label: "Interazione speciale", color: "#c0607e" },
};

// The node's mechanic, shown as an icon: a start or end node keeps the
// colour of its category but still says what the player does there.
export const MECHANICS = {
  cards: { icon: "🃏", label: "carte" },
  dice: { icon: "🎲", label: "dado" },
  pin: { icon: "🔢", label: "PIN" },
  continue: { icon: "¶", label: "testo" },
  end: { icon: "⚑", label: "finale" },
  none: { icon: "⚠", label: "nessuna uscita" },
};

export const NODE_W = 210;
export const NODE_H = 80;
const LABEL_MAX = 26;

const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const shorten = (s) => (s.length > LABEL_MAX ? `${s.slice(0, LABEL_MAX - 1)}…` : s);

export function category(node, story) {
  if (node.id === story.start || node.isEnd) return "bound";
  switch (nodeKind(node)) {
    case "cards":
      return "cards";
    case "dice":
      return "dice";
    case "continue":
      return "text";
    default:
      return "special"; // pin today, any future mechanic tomorrow
  }
}

/** Item id → display name, from every addToInventory in the story. */
function itemNames(story) {
  const names = new Map();
  const collect = (src) => {
    for (const it of toArray(src?.addToInventory)) names.set(it.id, it.name);
  };
  for (const node of story.nodes.values()) {
    collect(node.onEnter);
    (node.cards ?? []).forEach(collect);
    (node.dice ?? []).forEach(collect);
  }
  return names;
}

/**
 * Everything the page needs from the play-through:
 *   firstKey:   node id → key of the first (shortest-path) state reaching it
 *   deadEndIds: nodes where some game state has no available choice
 */
export function analyse(story) {
  const result = explore(story);
  const firstKey = new Map();
  // Map iteration follows insertion order = BFS order: first hit = shortest path
  for (const [k, s] of result.states) if (!firstKey.has(s.id)) firstKey.set(s.id, k);
  const deadEndIds = new Set(result.deadEnds.map((k) => result.states.get(k).id));
  return { ...result, firstKey, deadEndIds, items: itemNames(story) };
}

/** Steps of the shortest path to `id`: [{ id, via }], via = choice taken. */
export function pathTo(analysis, id) {
  const steps = [];
  for (let k = analysis.firstKey.get(id); k; k = analysis.states.get(k).parent) {
    const s = analysis.states.get(k);
    steps.unshift({ id: s.id, via: s.via });
  }
  return steps;
}

const CONDITION_TEXT = {
  requiresItem: (v) => `serve «${v}»`,
  hideIfItem: (v) => `sparisce se hai «${v}»`,
  requiresFlag: (v) => `serve il flag ${v}`,
  hideIfFlag: (v) => `sparisce col flag ${v}`,
};

/** Human-readable conditions of an exit, item ids replaced by names. */
export function describeConditions(conditions, items) {
  return Object.entries(conditions).map(([k, v]) =>
    CONDITION_TEXT[k](k.endsWith("Item") ? (items.get(v) ?? v) : v),
  );
}

/** Human-readable effects of a card / dice rule / onEnter. */
export function describeEffects(src, items) {
  const out = [];
  for (const r of toArray(src?.removeFromInventory)) {
    const id = typeof r === "string" ? r : r.id;
    const qty = typeof r === "string" ? "" : ` ×${r.quantity ?? 1}`;
    out.push(`− ${items.get(id) ?? id}${qty}`);
  }
  for (const a of toArray(src?.addToInventory)) {
    out.push(`+ ${a.name}${a.quantity ? ` ×${a.quantity}` : ""}`);
  }
  for (const f of toArray(src?.setFlags)) out.push(`⚑ ${f}`);
  return out;
}

function edgeLabel(ex) {
  switch (ex.kind) {
    case "dice":
      return `🎲 ${ex.label}`;
    case "continue":
      return "";
    default:
      return shorten(ex.label);
  }
}

/**
 * React Flow nodes + edges, laid out by dagre.
 * direction: "LR" (left → right) or "TB" (top → bottom).
 */
export function buildGraph(story, analysis, direction) {
  const nodes = [];
  const edges = [];
  const missing = new Set();
  const merged = new Map(); // "src→dst|dashed" → edge (parallel arrows become one)

  for (const node of story.nodes.values()) {
    const problems = [];
    if (!analysis.firstKey.has(node.id)) problems.push("irraggiungibile");
    if (analysis.deadEndIds.has(node.id)) problems.push("vicolo cieco");
    if (nodeKind(node) === "none") problems.push("nessuna uscita");

    nodes.push({
      id: node.id,
      type: "story",
      position: { x: 0, y: 0 },
      data: {
        node,
        category: category(node, story),
        mechanic: nodeKind(node),
        isStart: node.id === story.start,
        problems,
        direction,
      },
    });

    for (const ex of staticExits(node)) {
      const target = ex.to ?? `∅ ${node.id}`;
      if (!story.nodes.has(target)) missing.add(target);
      const conditional = Object.keys(ex.conditions).length > 0;
      const label = (conditional ? "🔒 " : "") + edgeLabel(ex);
      const key = `${node.id}→${target}|${conditional}`;
      const prev = merged.get(key);
      if (prev) {
        prev.label = [prev.label, label].filter(Boolean).join(" · ");
        continue;
      }
      const edge = {
        id: key,
        type: "routed",
        source: node.id,
        target,
        label,
        data: { conditional, leave: ex.kind === "leave" },
      };
      merged.set(key, edge);
      edges.push(edge);
    }
  }

  // Exits pointing to nodes that don't exist get a red placeholder node
  for (const id of missing) {
    nodes.push({
      id,
      type: "missing",
      position: { x: 0, y: 0 },
      data: { direction },
    });
  }

  // dagre places the nodes AND routes the arrows: each edge gets a list of
  // points that goes around the nodes (back edges such as S08B → S08A too)
  // and a reserved spot for its label, so labels don't overlap the nodes.
  // multigraph: two edges between the same nodes (one conditional, one not)
  // must stay distinct, so each edge is named by its id.
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: direction, nodesep: 36, ranksep: 90, edgesep: 20 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) =>
    g.setEdge(e.source, e.target, labelBox(e.label), e.id),
  );
  dagre.layout(g);

  for (const n of nodes) {
    const { x, y } = g.node(n.id); // dagre gives the centre, React Flow the corner
    n.position = { x: x - NODE_W / 2, y: y - NODE_H / 2 };
    // Declared sizes: the nodes are controlled (no onNodesChange), so React
    // Flow's own measurements never reach these objects, and the MiniMap
    // skips nodes without dimensions.
    n.width = NODE_W;
    n.height = NODE_H;
  }
  for (const e of edges) {
    const routed = g.edge({ v: e.source, w: e.target, name: e.id });
    e.data.points = routed.points;
    e.data.labelX = routed.x;
    e.data.labelY = routed.y;
  }
  return { nodes, edges };
}

// Rough size of an edge label (11px Georgia), for dagre to make room for it
const labelBox = (label) =>
  label ? { width: [...label].length * 6.5 + 12, height: 18, labelpos: "c" } : {};

/** SVG path through dagre's points, corners smoothed with quadratic curves. */
export function smoothPath(p) {
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i].x + p[i + 1].x) / 2;
    const my = (p[i].y + p[i + 1].y) / 2;
    d += ` Q${p[i].x},${p[i].y} ${mx},${my}`;
  }
  return `${d} L${p.at(-1).x},${p.at(-1).y}`;
}
