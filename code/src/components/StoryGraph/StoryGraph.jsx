// StoryGraph/StoryGraph.jsx — Development page (/grafo): the story as a
// flowchart. Nodes coloured by category, arrows labelled with the choice,
// dashed when conditional. Click a node for its texts, effects, shortest path
// and a "play from here" button that writes the autosave.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  BaseEdge,
  Position,
  MarkerType,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { buildStory, staticExits } from "../../engine.js";
import { saveGame } from "../../db.js";
import {
  CATEGORIES,
  MECHANICS,
  analyse,
  buildGraph,
  describeConditions,
  describeEffects,
  pathTo,
  smoothPath,
} from "./graphModel.js";
import "./StoryGraph.css";

const STORY_URL = `${import.meta.env.BASE_URL}story.json`;
const GAME_URL = import.meta.env.BASE_URL;
const ARROW = "#8a7d63";
const ARROW_ACTIVE = "#e8c96b";

// ── Custom nodes ──────────────────────────────────────────────

function StoryNode({ data }) {
  const { node, category, mechanic, isStart, problems, direction, selected } = data;
  const vertical = direction === "TB";
  const badge = isStart ? "inizio" : node.isEnd ? "fine" : null;
  return (
    <div
      className={[
        "story-node",
        selected ? "story-node--selected" : "",
        problems.length ? "story-node--problem" : "",
      ].join(" ")}
      style={{ "--cat": CATEGORIES[category].color }}
    >
      <Handle type="target" position={vertical ? Position.Top : Position.Left} />
      <div className="story-node__head">
        <span className="story-node__id">{node.id}</span>
        {badge && <span className="story-node__badge">{badge}</span>}
        <span className="story-node__icon" title={MECHANICS[mechanic].label}>
          {MECHANICS[mechanic].icon}
        </span>
      </div>
      <div className="story-node__title">{node.title ?? node.texts?.[0] ?? ""}</div>
      {problems.length > 0 && (
        <div className="story-node__problem">⚠ {problems.join(", ")}</div>
      )}
      <Handle type="source" position={vertical ? Position.Bottom : Position.Right} />
    </div>
  );
}

function MissingNode({ id, data }) {
  return (
    <div className="story-node story-node--missing">
      <Handle type="target" position={data.direction === "TB" ? Position.Top : Position.Left} />
      <div className="story-node__head">
        <span className="story-node__id">{id}</span>
      </div>
      <div className="story-node__problem">⚠ nodo inesistente</div>
    </div>
  );
}

// ── Custom edge ───────────────────────────────────────────────

// Draws the route dagre computed (see buildGraph) instead of React Flow's
// default curve from handle to handle, which cuts across nodes on back edges.
function RoutedEdge({ id, label, markerEnd, data, sourceX, sourceY, targetX, targetY }) {
  const path = data?.points
    ? smoothPath(data.points)
    : `M${sourceX},${sourceY} L${targetX},${targetY}`;
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      label={label || undefined}
      labelX={data?.labelX}
      labelY={data?.labelY}
      labelBgPadding={[4, 2]}
      labelBgBorderRadius={3}
    />
  );
}

// Defined once, outside the components: React Flow warns if these objects
// change between renders.
const NODE_TYPES = { story: StoryNode, missing: MissingNode };
const EDGE_TYPES = { routed: RoutedEdge };

// ── Side panel ────────────────────────────────────────────────

function DetailPanel({ story, analysis, id, onSelect, onClose }) {
  const [message, setMessage] = useState(null);
  const node = story.nodes.get(id);
  const items = analysis.items;
  const path = pathTo(analysis, id);
  const firstKey = analysis.firstKey.get(id);
  const arrival = firstKey ? analysis.states.get(firstKey).state : null;

  const playFromHere = async () => {
    try {
      // Same slot and record shape the game writes on every node change,
      // so the title screen's "Continua" picks it up.
      await saveGame("autosave", { nodeId: id, ...arrival });
      window.open(GAME_URL, "memento-gioco");
      setMessage(
        id === story.start
          ? "È il nodo iniziale: nel gioco usa «Nuova partita»."
          : "Autosave scritto: nel gioco premi «Continua».",
      );
    } catch (e) {
      setMessage(`Errore nel salvataggio: ${e.message}`);
    }
  };

  return (
    <aside className="graph-panel">
      <button className="graph-panel__close" onClick={onClose} aria-label="Chiudi">
        ✕
      </button>
      <p className="graph-panel__id">{id}</p>
      <h2 className="graph-panel__title">{node.title ?? "(senza titolo)"}</h2>
      <p className="graph-panel__meta">
        tema <strong>{node.theme ?? "—"}</strong>
        {node.location && (
          <>
            {" · luogo "}
            <strong>{story.map?.locations.get(node.location)?.name ?? node.location}</strong>
          </>
        )}
        {node.reveals && <> · fa scoprire {[].concat(node.reveals).join(", ")}</>}
      </p>

      <button className="graph-panel__play" onClick={playFromHere} disabled={!arrival}>
        ▶ Gioca da qui
      </button>
      {message && <p className="graph-panel__message">{message}</p>}

      <h3 className="graph-panel__section">Testi</h3>
      {(node.texts ?? []).map((t, i) => (
        <p key={i} className="graph-panel__text">
          {t}
        </p>
      ))}

      {describeEffects(node.onEnter, items).length > 0 && (
        <>
          <h3 className="graph-panel__section">All&apos;ingresso</h3>
          <ul className="graph-panel__list">
            {describeEffects(node.onEnter, items).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </>
      )}

      <h3 className="graph-panel__section">Uscite</h3>
      <ul className="graph-panel__list">
        {staticExits(node).map((ex, i) => (
          <li key={i} className="graph-panel__exit">
            <button className="graph-panel__link" onClick={() => onSelect(ex.to)}>
              → {ex.to ?? "∅"}
            </button>{" "}
            {ex.kind === "dice" ? `🎲 ${ex.label}` : ex.label}
            {describeConditions(ex.conditions, items).map((c) => (
              <span key={c} className="graph-panel__cond">
                🔒 {c}
              </span>
            ))}
            {describeEffects(ex.source, items).map((e) => (
              <span key={e} className="graph-panel__effect">
                {e}
              </span>
            ))}
          </li>
        ))}
        {node.isEnd && <li>{node.endLabel ?? "Fine"}</li>}
      </ul>

      {arrival && (
        <>
          <h3 className="graph-panel__section">Percorso più breve</h3>
          <ol className="graph-panel__path">
            {path.map((s, i) => (
              <li key={i}>
                {s.via && <span className="graph-panel__via">{s.via}</span>}
                <button className="graph-panel__link" onClick={() => onSelect(s.id)}>
                  {s.id}
                </button>
              </li>
            ))}
          </ol>
          <h3 className="graph-panel__section">Stato all&apos;arrivo</h3>
          <p className="graph-panel__text">
            Inventario:{" "}
            {arrival.inventory
              .map((it) => `${it.name}${it.quantity ? ` ×${it.quantity}` : ""}`)
              .join(", ") || "vuoto"}
            <br />
            Flag: {arrival.flags.join(", ") || "nessuno"}
          </p>
        </>
      )}
    </aside>
  );
}

// ── Page ──────────────────────────────────────────────────────

function GraphView() {
  const [story, setStory] = useState(null);
  const [error, setError] = useState(null);
  const [direction, setDirection] = useState("LR");
  const [selectedId, setSelectedId] = useState(null);
  const { fitView } = useReactFlow();

  // no-store: "Ricarica" must read the story.json just saved, not a cached one
  const load = useCallback(() => {
    fetch(STORY_URL, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((raw) => {
        setStory(buildStory(raw));
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const analysis = useMemo(() => (story ? analyse(story) : null), [story]);
  const graph = useMemo(
    () => (story ? buildGraph(story, analysis, direction) : { nodes: [], edges: [] }),
    [story, analysis, direction],
  );

  // Selection is drawn by us (not React Flow's own): highlight the node and
  // its arrows, dim the rest.
  const nodes = useMemo(
    () =>
      graph.nodes.map((n) =>
        n.id === selectedId ? { ...n, data: { ...n.data, selected: true } } : n,
      ),
    [graph, selectedId],
  );
  const edges = useMemo(
    () =>
      graph.edges.map((e) => {
        const active = selectedId && (e.source === selectedId || e.target === selectedId);
        return {
          ...e,
          className: [
            "story-edge",
            e.data.conditional || e.data.leave ? "story-edge--dashed" : "",
            active ? "story-edge--active" : selectedId ? "story-edge--dim" : "",
          ].join(" "),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: active ? ARROW_ACTIVE : ARROW,
            width: 18,
            height: 18,
          },
          zIndex: active ? 10 : 0,
        };
      }),
    [graph, selectedId],
  );

  // Re-frame the whole graph when the layout changes
  useEffect(() => {
    const raf = requestAnimationFrame(() => fitView({ duration: 300, padding: 0.1 }));
    return () => cancelAnimationFrame(raf);
  }, [graph, fitView]);

  const select = (id) => {
    if (!story?.nodes.has(id)) return;
    setSelectedId(id);
    fitView({ nodes: [{ id }], duration: 500, maxZoom: 1.1 });
  };

  const problems = graph.nodes.filter(
    (n) => n.type === "missing" || n.data.problems?.length,
  ).length;

  if (error) return <p className="graph-page__error">Impossibile leggere story.json: {error}</p>;
  if (!story) return <p className="graph-page__error">Caricamento…</p>;

  return (
    <div className="graph-page">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        colorMode="dark"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        minZoom={0.15}
        onNodeClick={(_, n) => select(n.id)}
        onPaneClick={() => setSelectedId(null)}
      >
        <Background color="#2a241c" gap={24} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) =>
            n.type === "missing" ? "#d0453a" : CATEGORIES[n.data.category].color
          }
          maskColor="rgba(8, 6, 4, 0.7)"
        />

        <Panel position="top-left" className="graph-toolbar">
          <h1 className="graph-toolbar__title">{story.title || "Memento"}</h1>
          <p className="graph-toolbar__stats">
            {story.nodes.size} nodi · {analysis.states.size} stati di gioco ·{" "}
            <span className={problems ? "graph-toolbar__bad" : "graph-toolbar__ok"}>
              {problems ? `${problems} nodi con problemi` : "nessun problema"}
            </span>
            {analysis.truncated && " · esplorazione parziale"}
          </p>
          <div className="graph-toolbar__actions">
            <button onClick={() => setDirection((d) => (d === "LR" ? "TB" : "LR"))}>
              {direction === "LR" ? "↕ Verticale" : "↔ Orizzontale"}
            </button>
            <button onClick={load}>↻ Ricarica</button>
            <a href={GAME_URL} target="memento-gioco">
              Apri il gioco
            </a>
          </div>
          <ul className="graph-legend">
            {Object.entries(CATEGORIES).map(([k, c]) => (
              <li key={k} style={{ "--cat": c.color }}>
                {c.label}
              </li>
            ))}
            <li className="graph-legend__dashed">Condizionata / uscita</li>
          </ul>
        </Panel>
      </ReactFlow>

      {selectedId && story.nodes.has(selectedId) && (
        <DetailPanel
          key={selectedId}
          story={story}
          analysis={analysis}
          id={selectedId}
          onSelect={select}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default function StoryGraph() {
  // useReactFlow (fitView) needs the provider above the component using it
  return (
    <ReactFlowProvider>
      <GraphView />
    </ReactFlowProvider>
  );
}
