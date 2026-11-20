// engine.js — Pure gamebook rules: story lookup, inventory, flags, conditions.
//
// No React, no DOM: the same functions drive GameScreen in the browser and
// scripts/validate-story.js in Node, so the validator explores exactly the
// rules the game applies.
//
// Game state (what gets saved):  { inventory: Item[], flags: string[] }
// Item: { id, name, description, imagePath?, icon?, quantity? }
//   • an item with `quantity` is stackable: adding it again sums quantities
//   • an item without `quantity` is unique: adding it again does nothing

export const EMPTY_STATE = Object.freeze({ inventory: [], flags: [] });

const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

// ── Story ─────────────────────────────────────────────────────

/**
 * Turns the raw story.json into { title, start, nodes: Map<id, node> }.
 * Throws on problems that would make the game unplayable.
 */
export function buildStory(raw) {
  if (!raw || !Array.isArray(raw.nodes)) {
    throw new Error("story.json: expected { start, nodes: [...] }");
  }
  const nodes = new Map();
  for (const node of raw.nodes) {
    if (!node.id) throw new Error("story.json: a node has no id");
    if (nodes.has(node.id)) throw new Error(`story.json: duplicate id ${node.id}`);
    nodes.set(node.id, node);
  }
  const start = raw.start ?? raw.nodes[0]?.id;
  if (!nodes.has(start)) throw new Error(`story.json: start node ${start} not found`);
  return { title: raw.title ?? "", start, nodes };
}

// ── Inventory & flags ─────────────────────────────────────────

export const hasItem = (state, id) => state.inventory.some((i) => i.id === id);
export const hasFlag = (state, flag) => state.flags.includes(flag);

function addItem(inventory, item) {
  const existing = inventory.find((i) => i.id === item.id);
  if (!existing) return [...inventory, { ...item }];
  if (item.quantity == null) return inventory; // unique item: no duplicates
  return inventory.map((i) =>
    i.id === item.id
      ? { ...i, quantity: (i.quantity ?? 1) + item.quantity }
      : i,
  );
}

// `what` is an item id (removes it entirely) or { id, quantity } (decrements).
function removeItem(inventory, what) {
  const id = typeof what === "string" ? what : what.id;
  const amount = typeof what === "string" ? Infinity : (what.quantity ?? 1);
  return inventory.flatMap((i) => {
    if (i.id !== id) return [i];
    const left = (i.quantity ?? 1) - amount;
    return left > 0 ? [{ ...i, quantity: left }] : [];
  });
}

/**
 * Applies the effects carried by a card, a dice rule or a node's onEnter:
 *   removeFromInventory: id | {id, quantity} | [...]   (applied first)
 *   addToInventory:      Item | Item[]
 *   setFlags:            string | string[]
 */
export function applyEffects(state, source) {
  if (!source) return state;
  let inventory = state.inventory;
  for (const r of toArray(source.removeFromInventory)) inventory = removeItem(inventory, r);
  for (const a of toArray(source.addToInventory)) inventory = addItem(inventory, a);

  let flags = state.flags;
  for (const f of toArray(source.setFlags)) {
    if (!flags.includes(f)) flags = [...flags, f];
  }
  return inventory === state.inventory && flags === state.flags
    ? state
    : { inventory, flags };
}

/** State after arriving on a node (its onEnter effects applied). */
export function enterNode(story, nodeId, state) {
  return applyEffects(state, story.nodes.get(nodeId)?.onEnter);
}

// ── Conditions ────────────────────────────────────────────────

/** Card conditions: requiresItem / hideIfItem / requiresFlag / hideIfFlag. */
export function isCardVisible(card, state) {
  if (card.requiresItem && !hasItem(state, card.requiresItem)) return false;
  if (card.hideIfItem && hasItem(state, card.hideIfItem)) return false;
  if (card.requiresFlag && !hasFlag(state, card.requiresFlag)) return false;
  if (card.hideIfFlag && hasFlag(state, card.hideIfFlag)) return false;
  return true;
}

export const visibleCards = (node, state) =>
  (node.cards ?? []).filter((c) => isCardVisible(c, state));

export const findDiceRule = (node, roll) =>
  (node.dice ?? []).find((r) => roll >= r.range[0] && roll <= r.range[1]);

/** What the player is asked to do on this node. */
export function nodeKind(node) {
  if (node.isEnd) return "end";
  if (node.cards) return "cards";
  if (node.dice) return "dice";
  if (node.pin) return "pin";
  if (node.nextNode != null) return "continue";
  return "none";
}

/**
 * Every way out of `node` given `state`: [{ to, state, label }].
 * Dice: every rule is possible. PIN: the success exit, plus `pin.leave`
 * (put the phone away) when the node offers it.
 */
export function exits(node, state) {
  switch (nodeKind(node)) {
    case "cards":
      return visibleCards(node, state).map((c) => ({
        to: c.nextNode,
        state: applyEffects(state, c),
        label: `carta "${c.textCard}"`,
      }));
    case "dice":
      return node.dice.map((r) => ({
        to: r.nextNode,
        state: applyEffects(state, r),
        label: `dado ${r.range[0]}-${r.range[1]}`,
      }));
    case "pin":
      return [
        { to: node.pin.nextNode, state, label: "PIN corretto" },
        ...(node.pin.leave
          ? [{ to: node.pin.leave.nextNode, state, label: "rimetti via il telefono" }]
          : []),
      ];
    case "continue":
      return [{ to: node.nextNode, state, label: "continua" }];
    default:
      return [];
  }
}

// ── Static view (no game state) ───────────────────────────────

const CONDITION_KEYS = ["requiresItem", "hideIfItem", "requiresFlag", "hideIfFlag"];

/**
 * Every exit `node` could ever offer, conditions ignored: what the story graph
 * draws. [{ to, label, kind, conditions, source }]
 *   conditions: the card's requiresItem/hideIfItem/requiresFlag/hideIfFlag
 *               (empty object when the exit is always available)
 *   source:     the card or dice rule carrying the effects (null otherwise)
 */
export function staticExits(node) {
  switch (nodeKind(node)) {
    case "cards":
      return node.cards.map((c) => ({
        to: c.nextNode,
        label: c.textCard,
        kind: "card",
        conditions: Object.fromEntries(
          CONDITION_KEYS.filter((k) => c[k]).map((k) => [k, c[k]]),
        ),
        source: c,
      }));
    case "dice":
      return node.dice.map((r) => ({
        to: r.nextNode,
        label: r.range[0] === r.range[1] ? `${r.range[0]}` : `${r.range[0]}–${r.range[1]}`,
        kind: "dice",
        conditions: {},
        source: r,
      }));
    case "pin":
      return [
        { to: node.pin.nextNode, label: "PIN corretto", kind: "pin", conditions: {}, source: null },
        ...(node.pin.leave
          ? [{ to: node.pin.leave.nextNode, label: node.pin.leave.label ?? "esci", kind: "leave", conditions: {}, source: null }]
          : []),
      ];
    case "continue":
      return [{ to: node.nextNode, label: node.continueLabel ?? "continua", kind: "continue", conditions: {}, source: null }];
    default:
      return [];
  }
}

// ── Play-through exploration ──────────────────────────────────

/** One key per distinct game situation: node + inventory + flags. */
export const stateKey = (id, st) =>
  `${id}|${st.inventory.map((i) => `${i.id}:${i.quantity ?? 1}`).sort().join(",")}` +
  `|${[...st.flags].sort().join(",")}`;

/**
 * Breadth-first search over EVERY reachable game state, with the same rules
 * as the game. Returns:
 *   states:    Map<key, { id, state, parent, via }>  (parent/via = how we got here)
 *   edges:     Map<key, key[]>  (state graph, for the trap analysis)
 *   endKeys:   states on a final node
 *   deadEnds:  states on a non-final node with no available choice
 *   truncated: true if maxStates was hit (results are partial)
 * Breadth-first means the first state recorded for a node is one reached by
 * a shortest path: the story graph uses it for "play from here".
 */
export function explore(story, maxStates = 50000) {
  const states = new Map();
  const edges = new Map();
  const endKeys = [];
  const deadEnds = [];
  let truncated = false;

  const startState = enterNode(story, story.start, EMPTY_STATE);
  const startKey = stateKey(story.start, startState);
  states.set(startKey, { id: story.start, state: startState, parent: null, via: null });
  const queue = [startKey];

  // Index-based queue: shift() is O(n) and the queue can grow large.
  for (let head = 0; head < queue.length; head++) {
    const k = queue[head];
    const { id, state } = states.get(k);
    const node = story.nodes.get(id);
    const next = [];
    edges.set(k, next);

    if (node.isEnd) {
      endKeys.push(k);
      continue;
    }
    const outs = exits(node, state).filter((o) => story.nodes.has(o.to));
    if (outs.length === 0) deadEnds.push(k);

    for (const o of outs) {
      const st = enterNode(story, o.to, o.state);
      const k2 = stateKey(o.to, st);
      next.push(k2);
      if (!states.has(k2)) {
        if (states.size >= maxStates) {
          truncated = true;
          continue;
        }
        states.set(k2, { id: o.to, state: st, parent: k, via: o.label });
        queue.push(k2);
      }
    }
  }

  return { states, edges, endKeys, deadEnds, truncated };
}
