# MEMENTO

### Un racconto interattivo — Gamebook engine in React

> _"Non tutto ciò che è dimenticato è perduto."_

---

## Panoramica

**Memento** è un motore per librogame narrativi costruito in React, pensato per il browser e ottimizzato per essere distribuito come **PWA** o app mobile tramite Capacitor. La storia si articola come un **grafo di nodi**: ogni nodo presenta testi, carte selezionabili o lanci di dado che determinano il percorso narrativo. Link al gioco: [Memento](https://mementotest.netlify.app/)

---

## Struttura del progetto

```
memento/
├── public/
│   ├── story.json                  # Grafo narrativo (dati separati dal codice)
│   └── assets/
│       ├── cards/                  # PNG delle carte di gioco
│       │   ├── carta_inventore.png
│       │   ├── carta_re.png
│       │   └── carta_libraio.png
│       └── backgrounds/            # Sfondi opzionali (futuri)
│
└── src/
    ├── App.jsx                     # Root: routing tra schermate
    ├── GameScreen.jsx              # Loop principale di gioco
    ├── audio.js                    # Sound effects (Web Audio API, no file esterni)
    └── components/
        ├── Background.jsx          # Canvas atmosferico con transizioni fluide
        ├── CardFan.jsx             # Ventaglio di carte PNG interattivo
        ├── Dice.jsx                # Dado d6 animato
        ├── SideMenu.jsx            # Menu laterale slide-in
        ├── TitleScreen.jsx         # Schermata titolo con animazioni
        ├── SettingsScreen.jsx      # Impostazioni (volume, velocità testo, SFX)
        └── CreditsScreen.jsx       # Crediti
```

---

## Formato dei nodi (`story.json`)

La storia è un array JSON di nodi. Ogni nodo può avere tre forme:

### Nodo con carte

```json
{
  "indexNode": 0,
  "theme": "forest",
  "texts": ["Testo 1", "Testo 2", "Testo 3"],
  "cardsSelected": [
    {
      "indexCard": 0,
      "cardPath": "./assets/cards/carta_inventore.png",
      "nextNode": 1,
      "textCard": "L'Inventore",
      "effectCard": "La mente che crea ricorda tutto"
    }
  ],
  "dice": false
}
```

### Nodo con dado

```json
{
  "indexNode": 1,
  "theme": "forge",
  "texts": ["Il dado decide il tuo destino..."],
  "cardsSelected": false,
  "dice": [
    { "range": [1, 2], "nextNode": 4 },
    { "range": [3, 4], "nextNode": 5 },
    { "range": [5, 6], "nextNode": 6 }
  ]
}
```

### Nodo di passaggio (testo → avanti automatico)

```json
{
  "indexNode": 3,
  "theme": "library",
  "texts": ["Il libraio apre un tomo immenso..."],
  "cardsSelected": false,
  "dice": false,
  "nextNode": 6
}
```

### Nodo finale

```json
{
  "indexNode": 6,
  "theme": "dawn",
  "texts": ["Fine."],
  "cardsSelected": false,
  "dice": false,
  "isEnd": true
}
```

### Temi di sfondo disponibili

| Chiave    | Palette           | Ispirazione        |
| --------- | ----------------- | ------------------ |
| `title`   | Indaco quasi nero | Schermata iniziale |
| `forest`  | Verde salvia      | L'Inventore        |
| `forge`   | Ambra calda       | Laboratorio        |
| `throne`  | Oliva dorato      | Caput Mundi        |
| `library` | Grigio ardesia    | Il Libraio         |
| `mist`    | Viola freddo      | Nebbia             |
| `dusk`    | Ocra tramonto     | Crepuscolo         |
| `dawn`    | Blu alba          | Rivelazione        |

---

## Come aggiungere nuovi nodi

1. Apri `public/story.json`
2. Aggiungi un nuovo oggetto all'array con un `indexNode` univoco
3. Imposta `theme` con uno dei valori della tabella sopra
4. Collega i nodi tramite `nextNode` nelle carte o negli oggetti `dice`
5. Salva — nessun rebuild necessario

---

## Come aggiungere nuove carte

1. Inserisci il PNG in `public/assets/cards/`
2. Fai riferimento al path nel campo `cardPath` del nodo in `story.json`
3. Il testo della carta (`textCard`) e l'effetto (`effectCard`) appaiono solo all'hover, senza toccare l'immagine

---

## Avvio in sviluppo

```bash
# Installa le dipendenze
npm install

# Avvia il dev server
npm run dev

# Build per produzione
npm run build
```

> Il progetto usa **Vite + React**. Richiede Node.js >= 18.

---

## Distribuzione

### Come PWA (consigliato — zero configurazione extra)

```bash
npm run build
# Carica la cartella dist/ su Netlify, Vercel, o qualsiasi hosting statico
# Gli utenti potranno installarlo come app da browser su iOS e Android
```

### Come app mobile con Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npm run build
npx cap add android   # oppure: npx cap add ios
npx cap sync
npx cap open android  # apre Android Studio
```

---

## Audio

Tutti i suoni sono generati proceduralmente via **Web Audio API** — nessun file audio esterno necessario. Le funzioni sono in `src/audio.js` e includono:

| Funzione        | Evento                 |
| --------------- | ---------------------- |
| `sfxCard`       | Selezione di una carta |
| `sfxCardHover`  | Hover su una carta     |
| `sfxDiceRoll`   | Dado che rotola        |
| `sfxDiceLand`   | Dado che atterra       |
| `sfxTextReveal` | Fine sequenza di testi |
| `sfxTransition` | Transizione tra nodi   |

Per usare file audio reali, sostituisci le chiamate in `audio.js` con `new Audio('./assets/sounds/xxx.mp3').play()`.

---

## Stack tecnico

| Tecnologia       | Uso                               |
| ---------------- | --------------------------------- |
| React 18         | UI e gestione dello stato         |
| Vite             | Build tool e dev server           |
| Web Audio API    | Sound effects procedurali         |
| Canvas 2D API    | Sfondo atmosferico animato        |
| CSS-in-JS inline | Stili senza dipendenze aggiuntive |

---

## Licenza

Progetto personale — tutti i diritti riservati.  
Le illustrazioni delle carte sono opere originali dell'autore.
