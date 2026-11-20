# 7. Strumenti

## Requisiti e comandi

Serve **Node.js 20.19+ oppure 22.12+** (requisito di Vite 7: `^20.19.0 || >=22.12.0`); il progetto è sviluppato con Node 24. Tutti i comandi si lanciano da `code/`.

```bash
cd code
npm install
npm run dev        # dev server con ricaricamento a caldo: http://localhost:5173
npm run validate   # controlla public/story.json
npm run lint       # ESLint
npm run build      # build di produzione in dist/
npm run preview    # serve dist/ in locale: http://localhost:4173
```

## Il ciclo di lavoro sulla storia

1. Modifica `public/story.json`.
2. `npm run validate`: deve finire con «✔ Nessun errore».
3. Con il dev server aperto, `/grafo` → «↻ Ricarica» per vedere il nuovo grafo.
4. Sul nodo modificato, «▶ Gioca da qui» e poi «Continua» nel gioco.

## Il validatore

```bash
npm run validate                 # controlla public/story.json
npm run validate -- altro.json   # controlla un altro file
```

Esempio di uscita:

```
Storia: public\story.json
  21 nodi · 136 stati di gioco esplorati · finali raggiungibili: S14

✔ Nessun errore.
```

Cosa controlla (dettagli in [Il motore](03-motore.md#come-il-validatore-usa-explore)):

| Tipo | Controlli |
| ---- | --------- |
| Errori statici | id duplicati o mancanti, `texts` vuoto, tema sconosciuto, più meccaniche in un nodo, nodo senza uscite, carta senza `textCard`, immagini mancanti, dadi che non coprono 1–6 o si sovrappongono, PIN non numerico, uscite verso nodi inesistenti, condizioni su oggetti che nessun nodo dà |
| Errori di gioco | vicoli ciechi, trappole (situazioni da cui non si arriva a nessun finale), nessun finale raggiungibile |
| Avvisi | nodo senza tema, `nextNode` ignorato perché il nodo ha un'altra meccanica, nodi irraggiungibili, esplorazione interrotta al limite |

Per ogni errore di gioco stampa l'inventario, i flag e il percorso che ci porta. Esce con codice 1 se ci sono errori.

## Grafo della storia

Con `npm run dev` aperto: **http://localhost:5173/grafo**.

- **Nodi** colorati per categoria: inizio/fine (oro), carte (verde), dado (blu), solo testo (sabbia), interazione speciale (rosa: il PIN e le meccaniche future). Inizio e fine prevalgono sul colore, ma un'icona dice sempre la meccanica (🃏 🎲 🔢 ¶ ⚑).
- **Frecce** con l'etichetta della scelta. **Tratteggiate** se la carta ha una condizione (🔒) o se è l'uscita dal PIN. Più frecce tra gli stessi due nodi diventano una sola con le etichette unite.
- **Problemi**: bordo rosso per nodi irraggiungibili, vicoli ciechi, uscite verso nodi inesistenti (che compaiono come nodi segnaposto rossi). Il conteggio è in alto a sinistra.
- **Clic su un nodo**: si evidenziano le sue frecce e si apre un pannello con:
  - testi;
  - effetti all'ingresso;
  - uscite, con condizioni ed effetti scritti per esteso;
  - percorso più breve dall'inizio;
  - inventario e flag all'arrivo;
  - **▶ Gioca da qui**: scrive l'autosave con quello stato e apre il gioco in un'altra scheda, dove basta premere «Continua».
- Pulsanti: orizzontale/verticale, «↻ Ricarica» (rilegge `story.json` senza cache), «Apri il gioco». Zoom e spostamento con mouse o con i controlli in basso; minimappa in basso a destra.

### Come funziona

| File | Ruolo |
| ---- | ----- |
| `grafo.html` | seconda pagina HTML; Vite la serve su `/grafo` |
| `src/grafo.jsx` | monta `StoryGraph` |
| `components/StoryGraph/graphModel.js` | funzioni pure: categorie, analisi (`explore`), nodi e frecce, disposizione con **dagre** |
| `components/StoryGraph/StoryGraph.jsx` | disegno con **React Flow** (`@xyflow/react`), nodi e frecce personalizzati, pannello |

dagre dispone i nodi a livelli e calcola anche il **percorso delle frecce** e lo spazio per le etichette; il componente `RoutedEdge` disegna quei percorsi (smussati con curve quadratiche) invece della curva predefinita di React Flow, che sulle frecce all'indietro (per esempio `S08B → S08A`) taglierebbe sopra i nodi. I nodi hanno `width` e `height` dichiarati: senza, la minimappa non li disegna, perché i nodi sono «controllati» e le misure di React Flow non tornano negli oggetti.

React Flow e dagre sono `devDependencies`: servono solo in sviluppo.

## Build e pubblicazione

`npm run build` produce `dist/` con:

- `index.html` e un unico bundle JS e CSS (con hash nel nome, per la cache);
- il font, con hash;
- il contenuto di `public/` copiato così com'è (`story.json`, immagini, favicon).

Solo `index.html` è un punto d'ingresso: **il grafo non entra nella build**, così il sito pubblico non rivela la storia. (Resta però pubblico `story.json`, inevitabilmente: il gioco lo scarica.)

Il sito di prova è su Netlify (https://mementotest.netlify.app/) e si aggiorna probabilmente a ogni push su `main`. Nel repository non c'è un `netlify.toml`: comando di build e cartella da pubblicare sono configurati nell'interfaccia di Netlify.

Il gioco è pensato anche come **PWA** o app **Capacitor**, ma manifest, service worker e progetto Capacitor non esistono ancora.

## Verifiche nel browser senza interfaccia

Per controllare a colpo d'occhio layout e grafo si può usare Chrome headless pilotato tramite il **DevTools Protocol**, con il `WebSocket` integrato in Node 24: si apre la pagina, si clicca con `Runtime.evaluate`, si cattura con `Page.captureScreenshot`. Per arrivare a un nodo preciso del gioco basta scrivere l'autosave in IndexedDB e premere «Continua».

Uno script di esempio (screenshot di `/grafo`, clic sui nodi, lettura dell'autosave) è in `.tmp/graph-shots.mjs`, una cartella **non versionata**: se diventa uno strumento stabile, conviene spostarlo in `code/scripts/`.

Attenzione nei test automatici: più clic programmatici nello stesso istante vedono lo stato React non ancora aggiornato (è il motivo per cui `PinPad` usa un ref come fonte di verità).

## Lint

ESLint 9 con configurazione «flat» (`eslint.config.js`): regole raccomandate di JavaScript, regole degli hook di React, controllo di React Fast Refresh (un file `.jsx` deve esportare solo componenti). Le variabili non usate sono errori, tranne quelle che iniziano con maiuscola o `_`. Gli script in `scripts/` hanno i globali di Node.
