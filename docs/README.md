# Documentazione tecnica di Memento

Questa cartella descrive **come è fatto il codice**: per presentare il gioco c'è il [README principale](../README.md).

L'app vive in `code/` ed è un'applicazione **React 19 + Vite 7** senza backend: la storia è un file JSON statico, i salvataggi stanno nel browser (IndexedDB), musica ed effetti sono sintetizzati al momento con la Web Audio API.

## Indice

| # | Documento | Di cosa parla |
| - | --------- | ------------- |
| 1 | [Architettura](01-architettura.md) | Cartelle, moduli, flusso dei dati, ciclo di vita di una partita |
| 2 | [Formato di `story.json`](02-storia-json.md) | Come si scrive la storia: nodi, meccaniche, effetti, condizioni, temi |
| 3 | [Il motore](03-motore.md) | `engine.js`: stato di gioco, regole, esplorazione di tutte le partite |
| 4 | [Salvataggi con IndexedDB](04-salvataggi-indexeddb.md) | `db.js` spiegato passo per passo, migrazioni, come aggiungere la v3 |
| 5 | [Interfaccia](05-interfaccia.md) | Componenti React, schermate, sfondo, stile, comportamento su telefono |
| 6 | [Audio](06-audio.md) | Effetti sonori e colonna sonora procedurale |
| 7 | [Strumenti](07-strumenti.md) | Comandi, validatore, grafo della storia, build, pubblicazione, verifiche |
| 8 | [Analisi del codice](08-analisi.md) | Punti di forza, problemi trovati, debito tecnico, proposte |

## In una pagina

```
code/
├── index.html            → src/main.jsx → App.jsx         (il gioco)
├── grafo.html            → src/grafo.jsx → StoryGraph     (strumento di sviluppo, non pubblicato)
├── public/story.json     la storia: dati, non codice
├── scripts/validate-story.js   gioca tutte le partite e segnala gli errori
└── src/
    ├── engine.js         regole pure (niente React): le usano gioco, validatore e grafo
    ├── db.js             salvataggi su IndexedDB
    └── components/       una cartella per componente (Nome.jsx + Nome.css)
                          + audio.js, music.js, audioContext.js
```

Tre idee reggono tutto il progetto:

1. **La storia è separata dal codice.** Chi scrive modifica solo `public/story.json`; il motore non sa niente di Arklow.
2. **Le regole stanno in un modulo puro.** `engine.js` non importa React né tocca il DOM, così lo stesso codice muove il gioco nel browser e il validatore in Node: quello che il validatore controlla è esattamente quello che il giocatore vivrà.
3. **Niente server, niente file multimediali obbligatori.** Il sito è statico; la musica è generata, le carte senza immagine sono disegnate in CSS, gli oggetti senza immagine usano un'emoji.
