# 8. Analisi del codice

Stato al 20/11/2026, branch `docs/documentazione` (che comprende il grafo della storia, non ancora in `main`).

## Dimensioni

| Tipo | File | Righe |
| ---- | ---- | ----- |
| JavaScript (`.js`) | 8 | ~1 360 |
| React (`.jsx`) | 14 | ~1 610 |
| CSS | 13 | ~1 660 |
| Storia (`story.json`) | 1 | 21 nodi, 136 situazioni di gioco |

Un progetto piccolo e leggibile: nessun file supera le 560 righe (il più lungo è `music.js`).

## Punti di forza

- **Storia separata dal codice, regole separate dall'interfaccia.** `engine.js` è puro e condiviso da gioco, validatore e grafo: un'unica definizione delle regole, controllata da tutti e tre.
- **Validatore esaustivo.** Non si limita a controllare i collegamenti: gioca tutte le partite possibili e trova vicoli ciechi e trappole che a mano sarebbero difficili da vedere.
- **IndexedDB fatto bene.** Connessione condivisa, migrazioni a gradini, `onversionchange` e `onblocked` gestiti, promesse risolte al completamento della transazione.
- **Igiene dei timer in `GameScreen`.** Tutti i ritardi passano da `later()` e vengono cancellati allo smontaggio; lo stato recente è letto da un ref.
- **Attenzione ai casi limite dell'input.** `PinPad` con il ref come fonte di verità; `CardFan` che evita la doppia selezione al tocco.
- **Zero file audio** e una modalità leggera misurata e motivata per i telefoni.
- **Strumenti di sviluppo fuori dalla build**: il grafo non arriva sul sito pubblico.
- Commenti che spiegano il *perché*, non il *cosa*.

## Problemi trovati

Gravità: **alta** = può rompere una partita; **media** = comportamento sbagliato in casi reali; **bassa** = estetica, coerenza, manutenzione.

### Difetti

#### 1. Il dado lascia timer attivi dopo lo smontaggio — alta (finestra stretta) — ✅ corretto

> **Corretto il 20/11/2026** (branch `fix/dado-timer`): l'animazione è una catena di `setTimeout` tenuta in un ref e cancellata allo smontaggio; un secondo ref impedisce due lanci nello stesso istante. Lo scenario qui sotto è stato rieseguito: dopo il riavvio `S01` non mostra più nessun indizio estraneo.

Com'era: `Dice.jsx` non cancellava né l'`setInterval` dell'animazione né il `setTimeout` di 1,4 s che chiama `onResult` quando il componente veniva smontato.

Scenario concreto, **riprodotto con Chrome headless**: in `S10` si lancia il dado e, entro un secondo e mezzo dall'arresto, si apre il menu laterale e si sceglie «Riavvia capitolo». Il timer scatta comunque e chiama la `handleDiceResult` del render vecchio, che conosce ancora `S10`: imposta un esito del dado di `S10` sulla partita appena ricominciata. Quando `S01` (anch'esso un nodo con dado) mostra le scelte, compare l'indizio di `S10` («Pensi soprattutto al rischio di farti notare…») con il pulsante «Alzati», che però porta all'uscita della regola di `S10`, cioè `S11`: metà capitolo saltata. Con «Menu principale» invece l'effetto è solo un suono d'indizio nel menu; ma se una regola del dado non avesse `text`, partirebbe un `goTo` dopo lo smontaggio e un autosave tardivo sovrascriverebbe il salvataggio.

#### 2. L'animazione del dado non rallentava — bassa — ✅ corretto

Com'era: `setInterval(fn, 55 + ticks * 6)` calcolava il ritardo **una volta sola**, quando `ticks` valeva 0, quindi l'intervallo restava fisso a 55 ms e l'effetto «dado che si ferma» non c'era. Ora ogni faccia dura 5 ms più della precedente (da 40 a 110 ms): il dado rallenta visibilmente e si ferma dopo circa 1,1 s invece di 0,8.

#### 3. «Nuova partita» cancella tutti i salvataggi — bassa oggi, media domani

`App.jsx:75` chiama `clearAllSaves()`. Con il solo autosave è corretto; con gli slot manuali previsti cancellerebbe anche quelli. Basta `deleteSave("autosave")`.

#### 4. Le impostazioni non sopravvivono al ricaricamento — media

`App.jsx:14,22`: volume, effetti e velocità del testo vivono solo nello stato di `App`. È già nella lista delle cose da fare (DB v3, vedi [IndexedDB](04-salvataggi-indexeddb.md#esempio-aggiungere-la-v3-con-le-impostazioni)).

#### 5. Il conteggio degli errori del PIN si azzera — da decidere

`PinPad.jsx:28`: uscendo con «Rimetti via il telefono» il componente si smonta e gli errori ripartono da zero, quindi il suggerimento dopo 3 errori si «perde». È una scelta di design ancora aperta; se si vuole un conteggio per tutta la partita, gli errori vanno tenuti in `GameScreen` o salvati come flag.

### Accessibilità

#### 6. Le carte non si possono scegliere da tastiera — media

`CardFan.jsx:83-100`: ogni carta è un `<div>` con `onClick`, senza `tabIndex`, `role` né gestione dei tasti. Chi usa la tastiera o un lettore di schermo non può scegliere una carta, quindi non va oltre `S03`. Correzione: rendere la carta un `<button>` (o `role="button"`, `tabIndex={0}` e `onKeyDown` per Invio/Spazio), con `aria-label` = `textCard` + `effectCard`.

#### 7. I testi nuovi non vengono annunciati — bassa

I paragrafi compaiono uno alla volta, ma il contenitore non ha `aria-live`: un lettore di schermo non li legge da solo. `PinPad` invece lo fa già per il suo messaggio.

#### 8. Nessun rispetto di «riduci movimento» — bassa

Nebbia, pioggia e animazioni ignorano `prefers-reduced-motion`. Si potrebbero fermare pioggia e banchi di nebbia e accorciare le dissolvenze.

### Coerenza e duplicazioni

#### 9. Le uscite di un nodo sono descritte in tre punti — media (manutenzione)

`engine.exits`, `engine.staticExits` e i `targets` statici di `validate-story.js` conoscono tutti le meccaniche. Aggiungendone una nuova è facile aggiornarne due su tre. Proposta: `staticExits` come unica fonte, con `exits(node, state)` derivata (filtra le condizioni con `isCardVisible`, applica `applyEffects` alla `source`) e il validatore che usa `staticExits` per controllare le destinazioni.

#### 10. Il controllo «dispositivo touch» è ripetuto tre volte — bassa

`(hover: none)` è valutato in `audioContext.js:7`, `CardFan.jsx:16` e `Background.jsx` (`RAIN_DROPS`). Un piccolo modulo `src/device.js` con una sola costante eviterebbe che divergano.

#### 11. Tre numeri di versione diversi — bassa

`package.json` dice `0.0.0`, il menu laterale `MEMENTO v0.2` (`SideMenu.jsx:27`), il titolo `© 2026 MEMENTO`. Si può leggere la versione da `package.json` a build time (con `define` in `vite.config.js`) e usarla ovunque.

#### 12. Documenti in contraddizione — bassa, ma da decidere

- **Licenza**: `LICENSE` è MIT (copyright 2023), il README diceva «tutti i diritti riservati». Va scelto: per esempio MIT per il codice e diritti riservati per testi e illustrazioni, scritto esplicitamente.
- **Node**: il vecchio README chiedeva Node ≥ 18, ma Vite 7 richiede `^20.19.0 || >=22.12.0`. `code/README.md` contiene solo «Node Version v24.14.0»: andrebbe eliminato o reso un `.nvmrc` / campo `engines` in `package.json`.

#### 13. Residui del passato — bassa

- Commenti d'intestazione «CSS extracted» in `TitleScreen`, `SideMenu`, `SettingsScreen`, `CreditsScreen` (ricordo di un vecchio refactoring).
- ~~`sfxPageTurn` (`audio.js`) non è usato.~~ Ora suona all'apertura della mappa.
- I temi della demo (`forest`, `forge`, `throne`, `dusk`, `dawn`) sono ancora in `themes.js` e `music.js`.
- `public/assets/inventory/blood.png` e `rolling-chair.png` non sono usati, e in realtà sono JPEG con estensione `.png`.

### Prestazioni

#### 14. Lo sfondo ricalcola 60 gradienti a ogni frame — media sui telefoni

`Background.jsx`: a ogni frame (60 al secondo) crea un `createRadialGradient` per ciascuno dei 60 banchi di nebbia, più tre gradienti di sfondo. Sui telefoni questo lavoro si somma alla musica. Possibili rimedi, in ordine di semplicità:

1. meno banchi di nebbia sui dispositivi touch (come già per la pioggia);
2. disegnare una volta sola la «macchia» di nebbia su un canvas fuori schermo e poi copiarla con `drawImage` e `globalAlpha`;
3. ridurre il frame rate dello sfondo (30 fps bastano per una nebbia lenta).

Il canvas ignora `devicePixelRatio`: sugli schermi ad alta densità è un po' sfocato, ma per nebbia e pioggia è un compromesso ragionevole che risparmia lavoro.

### Qualità e processo

#### 15. Nessun test automatico — media

Il validatore fa da test d'integrazione della storia, ma il motore non ha test unitari. Essendo puro, testarlo costa poco con il test runner integrato di Node (`node --test`), senza dipendenze: `applyEffects` (quantità, oggetti unici, rimozioni), condizioni delle carte, `explore` su piccole storie costruite apposta (un vicolo cieco, una trappola).

#### 16. Nessun controllo prima della pubblicazione — media

Netlify pubblica `main` così com'è. Una GitHub Action che esegua `npm run lint`, `npm run validate` e `npm run build` su ogni push impedirebbe di pubblicare una storia rotta. In alternativa, si può mettere `npm run validate && npm run build` come comando di build su Netlify. Un `netlify.toml` nel repository renderebbe la configurazione visibile e versionata.

#### 17. Dipendenze — bassa

`npm audit` segnala 14 vulnerabilità, tutte negli strumenti di sviluppo (Vite, esbuild, Babel, ESLint e loro dipendenze); `npm audit --omit=dev` ne trova 0, quindi il gioco pubblicato non ne è toccato. Conviene comunque aggiornare periodicamente (`npm update`, `npm audit fix`).

#### 18. Condivisione del link — bassa

`index.html` non ha `meta description` né tag Open Graph: un link al gioco condiviso su un social o in chat appare senza descrizione né immagine.

## Priorità suggerite

| Priorità | Intervento | Problemi |
| -------- | ---------- | -------- |
| ✅ | Pulire i timer del dado (fatto) | 1, 2 |
| 1 | Carte accessibili da tastiera | 6 |
| 2 | Impostazioni in IndexedDB (v3) e `deleteSave("autosave")` | 3, 4 |
| 3 | Test del motore + controllo prima della pubblicazione | 15, 16 |
| 4 | Unificare le uscite dei nodi | 9 |
| 5 | Sfondo più leggero su telefono | 14 |
| 6 | Pulizie: versioni, licenza, Node, residui, `device.js` | 10–13 |
