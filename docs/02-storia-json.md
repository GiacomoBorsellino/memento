# 2. Il formato di `story.json`

La storia è un unico file, `code/public/story.json`. Il motore lo legge all'avvio: per cambiare la storia non serve toccare il codice, ma va sempre lanciato `npm run validate` (vedi [Strumenti](07-strumenti.md)).

## Struttura generale

```json
{
  "title": "Memento — Capitolo 1",
  "start": "S01",
  "nodes": [ { "id": "S01", "...": "..." }, { "id": "S02", "...": "..." } ]
}
```

| Campo | Obbligatorio | Significato |
| ----- | ------------ | ----------- |
| `title` | no | Titolo della storia (lo mostra il grafo) |
| `start` | no | Id del primo nodo; se manca, il primo dell'array |
| `nodes` | sì | Elenco dei nodi; l'ordine non conta, contano gli `id` |

## Il nodo

```json
{
  "id": "S05",
  "title": "Bridge Street 13: il Maisie Kelly",
  "theme": "pub",
  "onEnter": { "setFlags": "pub_visitato" },
  "texts": ["Prima frase.", "Seconda frase.", "Terza frase."],
  "cards": [ ... ]
}
```

| Campo | Obbligatorio | Significato |
| ----- | ------------ | ----------- |
| `id` | sì | Identificatore testuale unico (`"S01"`, `"S08A"`). I salvataggi puntano a questo |
| `title` | no | Nome della scena: non compare nel gioco, ma nel grafo e nei messaggi del validatore |
| `theme` | consigliato | Atmosfera: colori dello sfondo e musica (vedi [Temi](#temi)) |
| `texts` | sì | Paragrafi mostrati uno alla volta; il primo ha il capolettera. Ogni paragrafo è una stringa o un **testo condizionato** (vedi sotto) |
| `onEnter` | no | Effetti applicati appena si entra nel nodo (vedi [Effetti](#effetti)) |
| una meccanica | sì | Esattamente **una** tra `cards`, `dice`, `pin`, `nextNode`, `isEnd` |

### Testi condizionati

Un paragrafo può comparire solo in certe situazioni, con le stesse condizioni delle carte:

```json
"texts": [
  "Ogni passante sembra guardarti le mani, le scarpe, la faccia.",
  { "text": "La mano ferita la tieni in tasca, per nascondere il sangue.", "requiresFlag": "mano_ferita" },
  "Main Street, numero 7: la Arklow Library."
]
```

I paragrafi visibili si decidono **all'arrivo nel nodo**, con lo stato di quel momento: una scelta fatta nel nodo non fa comparire né sparire testi a metà scena. Nel grafo i nodi con testi condizionati hanno il segno 🔒¶, e nel pannello ogni testo condizionato mostra la sua condizione. Il validatore controlla che in nessuna situazione un nodo resti senza paragrafi.

Se per errore un nodo ha più meccaniche, vale quest'ordine: `isEnd` → `cards` → `dice` → `pin` → `nextNode`. Il validatore lo segnala comunque come errore.

## Le meccaniche

### Carte

Il giocatore sceglie una carta dal ventaglio.

```json
"cards": [
  {
    "textCard": "Parla con Liam",
    "effectCard": "Cosa è successo ieri sera?",
    "cardPath": "./assets/cards/card_caput_mundi.png",
    "nextNode": "S06"
  },
  {
    "textCard": "Sblocca il cellulare",
    "effectCard": "Quattro cifre",
    "requiresItem": "tessera_g",
    "nextNode": "S08"
  }
]
```

| Campo | Significato |
| ----- | ----------- |
| `textCard` | Nome della scelta (obbligatorio) |
| `effectCard` | Sottotitolo, mostrato sotto il nome quando la carta è in evidenza |
| `cardPath` | Immagine della carta, relativa a `public/`. Senza immagine la carta è disegnata in CSS con il nome e due ornamenti |
| `nextNode` | Dove porta |
| effetti | `addToInventory`, `removeFromInventory`, `setFlags`, applicati al momento della scelta |
| condizioni | `requiresItem`, `hideIfItem`, `requiresFlag`, `hideIfFlag` (vedi [Condizioni](#condizioni)) |

Le illustrazioni attuali hanno un significato: `card_inventore` = agire, `card_caput_mundi` = parlare con qualcuno, `card_libraio` = leggere o cercare.

### Dado

Il giocatore lancia un d6; il risultato sceglie la regola.

```json
"dice": [
  { "range": [1, 3], "text": "Ti liquida senza aggiungere altro.", "nextNode": "S07" },
  { "range": [4, 6], "text": "Cogli un dettaglio...", "nextNode": "S07" }
],
"continueLabel": "Vai a pulire il bagno"
```

- Gli intervalli devono coprire **tutti** i valori da 1 a 6, **senza sovrapposizioni**.
- Se la regola ha `text`, il gioco lo mostra in un riquadro **Indizio** e aspetta il pulsante «Continua». L'etichetta del pulsante è il `continueLabel` della regola o, se manca, quello del nodo.
- Senza `text`, il gioco passa subito al nodo successivo.
- Ogni regola può avere effetti, come una carta.

Nel Capitolo 1 i dadi non cambiano strada: tutti gli esiti portano allo stesso nodo e cambiano solo l'indizio, cioè quanto il protagonista riesce a cogliere.

### PIN

Un tastierino numerico (anche da tastiera fisica).

```json
"pin": {
  "code": "1234",
  "nextNode": "S09",
  "prompt": "Inserisci il PIN",
  "errorText": "Non si sblocca.",
  "hint": "Un suggerimento che non dà la soluzione",
  "hintAfter": 3,
  "successText": "Sbloccato",
  "leave": { "label": "Rimetti via il telefono", "nextNode": "S08A" }
}
```

| Campo | Significato |
| ----- | ----------- |
| `code` | Le cifre corrette; la loro quantità decide quanti pallini mostrare |
| `nextNode` | Dove si va con il codice giusto |
| `prompt` | Messaggio iniziale (predefinito «Inserisci il PIN») |
| `errorText` | Messaggio dopo un errore (predefinito «PIN errato») |
| `hint`, `hintAfter` | Dopo `hintAfter` errori (predefinito 3) il messaggio diventa `hint` |
| `successText` | Messaggio di sblocco (predefinito «Sbloccato») |
| `leave` | Facoltativo: un pulsante sotto il tastierino per andarsene e tornare più tardi |

Attenzione: `story.json` è un file pubblico del sito, quindi chi lo apre vede il codice. Per un librogame va bene, ma non è un segreto.

### Continua

Un solo pulsante.

```json
{ "id": "S09", "texts": ["..."], "nextNode": "S10", "continueLabel": "Vai in Collin Street 6" }
```

Con `"autoAdvance": true` il nodo passa avanti da solo dopo l'ultimo testo, senza pulsante.

### Fine

```json
{ "id": "S14", "texts": ["..."], "isEnd": true, "endLabel": "Fine Capitolo 1" }
```

Mostra la scritta `endLabel` (predefinita «Fine Capitolo») e il pulsante per il menu.

## Effetti

Valgono su una carta, su una regola del dado e in `onEnter`.

| Campo | Valore | Effetto |
| ----- | ------ | ------- |
| `addToInventory` | un oggetto o un array di oggetti | Aggiunge. Se l'oggetto ha `quantity` ed è già presente, le quantità si sommano; se non ce l'ha, non viene duplicato |
| `removeFromInventory` | `"id"`, `{ "id": "...", "quantity": 1 }` o un array | Con l'id toglie l'oggetto; con la quantità la decrementa (a zero l'oggetto sparisce) |
| `setFlags` | `"flag"` o un array | Registra un fatto accaduto. I flag non si cancellano |

L'ordine è fisso: prima si tolgono gli oggetti, poi si aggiungono, poi si impostano i flag.

### L'oggetto

```json
{
  "id": "fiammiferi",
  "name": "Fiammiferi",
  "description": "Una scatoletta del pub Maisie Kelly, Bridge Street 13.",
  "icon": "🔥",
  "quantity": 2
}
```

`imagePath` (relativo a `public/`) mostra un'immagine nell'inventario; senza, si usa `icon`, e senza nemmeno quella la prima lettera del nome.

## Condizioni

Si mettono sulle **carte** (una carta che non le soddisfa non compare) e sui **testi condizionati**.

| Campo | La carta compare solo se... |
| ----- | --------------------------- |
| `requiresItem` | hai l'oggetto |
| `hideIfItem` | **non** hai l'oggetto |
| `requiresFlag` | il flag è impostato |
| `hideIfFlag` | il flag **non** è impostato |

Si possono combinare: devono valere tutte.

### Schemi utili (dal Capitolo 1)

- **Una scena visitabile una volta sola**: la scena imposta un flag in `onEnter`, la carta che ci porta ha `hideIfFlag` sullo stesso flag (`S08B`, `S08C`, `S08D` con `liam_bis`, `tadhg_bis`, `ubriaco`).
- **Due scene in ordine libero, entrambe obbligatorie**: dal pub si può andare prima da Liam o prima da Tadhg. In `S07` la carta per Tadhg ha `hideIfFlag: "tadhg"` e quella per il telefono `requiresFlag: "tadhg"`; in `S07B` la carta per Liam ha `hideIfItem: "tessera_g"` e quella per il telefono `requiresItem: "tessera_g"`. Così il telefono compare solo dopo aver fatto entrambe le cose.
- **Un luogo da cui si esce e si rientra**: `S08A` è un nodo «snodo» con più carte che riportano a sé stesso o al PIN.

## La mappa della città

Facoltativa: se la storia ha `map`, in partita compare il pulsante 🗺️ accanto allo zaino.

```json
"map": {
  "image": "./assets/map/arklow.png",
  "width": 1000,
  "height": 700,
  "locations": [
    { "id": "pub", "name": "Maisie Kelly", "x": 452, "y": 372, "note": "Bridge Street 13" },
    { "id": "cartomante", "name": "Lady Trish D., la cartomante", "note": "Indirizzo sconosciuto" }
  ]
}
```

| Campo | Significato |
| ----- | ----------- |
| `image` | Facoltativo: un disegno al posto della carta di Arklow disegnata in SVG. Va in `public/`, con le proporzioni di `width` × `height` |
| `width`, `height` | Il sistema di coordinate della mappa (predefinito 1000 × 700) |
| `locations[].id` | Identificatore usato dai nodi |
| `locations[].name`, `note` | Nome sulla mappa e nota nell'elenco sotto la mappa |
| `locations[].x`, `y` | Posizione sulla mappa. Senza coordinate il luogo compare solo nell'elenco (per esempio un indirizzo che non si conosce ancora) |
| `locations[].transit` | `true` per un tratto di strada tra due luoghi (gli intermezzi): dirada la nebbia, allunga il percorso e può essere il «sei qui», ma non ha nome sulla carta, non compare nell'elenco e non accende il puntino «novità» |

Sui nodi:

| Campo | Significato |
| ----- | ----------- |
| `location` | Dove si svolge la scena: il luogo diventa **visitato** (a inchiostro) ed è il «sei qui» |
| `reveals` | Uno o più luoghi di cui il giocatore **sente parlare** (a matita con «?») |

Si assegna il luogo a ogni nodo; un nodo senza `location` lascia il segno «sei qui» sull'ultimo luogo visitato (il validatore lo segnala come avviso). Visitati e sentiti diventano flag automatici, `visitato:<id>` e `sentito:<id>`, quindi si possono usare anche nelle condizioni delle carte (per esempio `"requiresFlag": "visitato:biblioteca"`).

## Temi

`theme` sceglie i colori dello sfondo (`src/components/Background/themes.js`) e la musica (`src/components/music.js`). Le chiavi sono le stesse nei due file.

| Chiave | Colori | Musica | Extra |
| ------ | ------ | ------ | ----- |
| `title` | indaco quasi nero | arpeggi di cimbalom su un bordone | menu principale |
| `hotel` | ambra stanca | pianoforte scordato, orologio a cucù | |
| `pub` | verde scuro e ottone | giga in 6/8: bodhrán, pizzicato, violino | |
| `legend` | buio color sangue | rintocchi gravi, bordone dissonante, lamento di violino | |
| `street` | grigio-blu, mare d'Irlanda | pioggia, battito, ostinato basso | pioggia disegnata sullo sfondo |
| `fog` | grigio freddo | come `street`, ma senza scroscio di pioggia | banchi di nebbia più densi (`haze`) |
| `library` | ardesia | campane, violino lungo, scala ungherese | |
| `mist` | viola freddo | bordone dissonante, campane lontane | |

Restano disponibili i temi della vecchia demo (`forest`, `forge`, `throne`, `dusk`, `dawn`), associati al mood musicale più vicino.

Per aggiungere un tema: una voce in `THEMES` (`themes.js`, con `sky`, `fog`, `mist` come colori RGB e facoltativamente `rain` e `haze` da 0 a 1), un mood in `MOODS` e una riga in `THEME_TO_MOOD` (`music.js`). Il validatore rifiuta i temi che non esistono in `themes.js`.
