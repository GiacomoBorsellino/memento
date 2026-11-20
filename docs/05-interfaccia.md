# 5. Interfaccia

Tutti i componenti stanno in `src/components/`, ciascuno nella sua cartella con `Nome.jsx` e `Nome.css`.

## `App.jsx`: il regista

- carica `story.json` e lo indicizza con `buildStory`;
- tiene la schermata corrente (`menu`, `settings`, `credits`, `game`, `game-continue`), le impostazioni e il tema dello sfondo;
- rilegge l'autosave a ogni ritorno al menu e decide se mostrare «Continua»;
- su «Nuova partita» cancella i salvataggi; su «Continua» passa a `GameScreen` nodo e stato salvati;
- inoltra le impostazioni al modulo audio (`setAudioSettings`).

Se `story.json` non si carica, al posto del gioco compare il messaggio d'errore.

## `GameScreen`: il loop di gioco

Il componente più ricco. Per ogni nodo:

1. **Testi**: compaiono uno alla volta. Il primo dopo 700 ms, i successivi dopo 2,2 / 1,5 / 0,9 s (velocità Lento / Normale / Veloce). Il paragrafo più recente è chiaro, quelli precedenti si scuriscono; il primo ha un **capolettera** in carattere gotico.
2. **Scelte**: 500 ms dopo l'ultimo testo, con un accordo, compare la meccanica del nodo: `CardFan`, `Dice`, `PinPad`, un pulsante «Continua» o la scritta di fine capitolo.
3. **Transizione**: dissolvenza di 700 ms, poi il nodo nuovo (vedi [Architettura](01-architettura.md#una-partita-passo-per-passo)).

Altri compiti:

- **tema**: quando cambia il tema del nodo, avvisa `App` (sfondo) e chiama `playMusic`;
- **scorrimento**: su schermi piccoli testi e scelte superano l'altezza dello schermo; la schermata scorre e segue automaticamente l'ultimo elemento comparso (`scrollTo` con `behavior: "smooth"`);
- **menu laterale** (pulsante in alto a destra) e **inventario** (pulsante in basso a destra);
- **indicatore del nodo** in basso a sinistra (`§S08`), utile per orientarsi durante i test;
- **riavvio del capitolo** dal menu laterale: azzera stato, interfaccia e autosave.

Piccoli componenti interni: `EndCard` (fine capitolo), `Clue` (riquadro «Indizio» dopo un dado), `ContinueBtn`.

## Le tre meccaniche

### `CardFan`: il ventaglio di carte

Le carte sono disposte a ventaglio: l'angolo dipende dalla posizione e dal numero di carte, e quelle ai lati scendono un po' (calcolato a runtime, quindi applicato come stile inline). Riceve solo le carte già filtrate dal motore.

| | Desktop | Telefono / tablet (`hover: none`) |
| - | ------- | --------------------------------- |
| Anteprima | passando il mouse: la carta si alza e mostra nome ed `effectCard` | primo tocco: la carta si alza e compare il pulsante «Scegli» |
| Scelta | clic | «Scegli»; un tocco sullo sfondo chiude l'anteprima |

Si ascolta solo `onClick` e non `onTouchEnd`: sui touchscreen il browser genera comunque un clic dopo il tocco, e gestirli entrambi selezionerebbe la carta due volte. Una carta con `cardPath` mostra l'immagine; senza, una faccia disegnata in CSS con il nome tra due ornamenti.

### `Dice`: il dado

Un d6 con i puntini in una griglia 3×3. Al lancio la faccia cambia 14 volte, sempre più lentamente (da 40 a 110 ms per faccia), poi si ferma sul risultato, che viene mostrato («Il fato ha parlato: 4»); dopo 1,4 s il risultato passa a `GameScreen`.

- Si lancia **una volta sola** per nodo: un ref, aggiornato subito, blocca un secondo lancio anche se dado e pulsante vengono cliccati nello stesso istante.
- L'unico timer in sospeso (animazione o attesa del risultato) sta in un ref ed è **cancellato allo smontaggio**: se il giocatore riavvia il capitolo o torna al menu mentre il dado gira, il risultato non arriva più a una partita che non lo aspetta.

### `PinPad`: il tastierino

Il blocco schermo di un telefono: pallini, messaggio, tastiera 3×4 con cancella, e facoltativamente il pulsante per andarsene (`leave`).

- Funziona anche con la **tastiera fisica** (cifre e Backspace).
- Errore: vibrazione (dove supportata), suono, pallini svuotati dopo 650 ms. Dopo `hintAfter` errori il messaggio diventa il suggerimento.
- **Un ref come fonte di verità.** Le cifre inserite stanno sia nello stato React (per disegnare) sia in `inputRef` (per decidere). Il motivo: React applica gli aggiornamenti di stato più tardi, quindi due tasti premuti nello stesso istante (digitazione veloce, ripetizione del tasto, test automatici) leggerebbero entrambi il valore vecchio. Il ref è aggiornato subito.
- Allo stesso modo il listener della tastiera viene registrato una volta sola e chiama sempre la versione più recente di `press` tramite `pressRef`.

## Inventario: `InventoryModal`

Un pulsante con lo zaino 🎒 e un contatore degli oggetti. Apre un pannello a tutto schermo con un **carosello** a scorrimento orizzontale (CSS *scroll-snap*: lo scorrimento si ferma sempre su una scheda). Ogni scheda mostra immagine o icona, nome, quantità (se maggiore di 1) e descrizione. I pallini sotto il carosello seguono lo scorrimento e permettono di saltare a un oggetto. Si chiude con ✕, con un clic fuori o con Esc.

## Le altre schermate

| Componente | Contenuto |
| ---------- | --------- |
| `TitleScreen` | «MEMENTO» in gotico, sottotitolo «I DIAVOLI DI ARKLOW», voci del menu che compaiono una dopo l'altra |
| `SettingsScreen` | volume della musica (0–100), effetti sonori sì/no, velocità del testo. «Salva» le passa ad `App`; «Annulla» le scarta |
| `CreditsScreen` | autori, tecnologie, font |
| `SideMenu` | pannello laterale in partita: «Riavvia capitolo», «Menu principale» |

## Lo sfondo: `Background`

Un `<canvas>` a tutto schermo, sempre montato, ridisegnato a ogni frame (`requestAnimationFrame`):

1. sfumatura verticale con i tre colori del tema (`sky`, `fog`, `mist`);
2. vignettatura scura ai bordi;
3. 60 «banchi di nebbia» (gradienti radiali) che salgono lentamente e respirano;
4. una fascia di foschia in basso che pulsa;
5. **pioggia**, solo per i temi con `rain` (oggi `street`): strisce oblique disegnate tutte in un unico percorso e un solo `stroke()`, quindi costano quasi come una linea sola. Su touch le gocce sono la metà.

Al cambio di tema i colori (e l'intensità della pioggia) passano dal vecchio al nuovo in circa due secondi. Se il tema cambia a metà transizione, la nuova parte dai colori **attualmente** sullo schermo, non da quelli del tema precedente: niente salti.

I colori stanno in `themes.js`, separati dal componente perché il validatore li importa in Node e perché React Fast Refresh vuole file che esportino solo componenti.

## Stile e identità visiva

- **Palette**: fondo quasi nero caldo (`#080604`), testo pergamena (`#e8dfc8`), ottone per i dettagli (`#a89870`), oro per indizi e capolettera (`#c8a84b`).
- **Caratteri**: Georgia per i testi; *Elementary Gothic Bookhand* (Bill Roach, licenza SIL OFL, in `src/assets/fonts/` con la licenza accanto) per titoli, titoli dei pannelli, fine capitolo e capolettera, tramite la variabile CSS `--font-title`. Il gotico è usato solo dove si legge bene: nei paragrafi stancherebbe.
- **Grana di carta**: `.app::after` copre tutto con un disturbo generato da un filtro SVG (`feTurbulence`) in un data URI. È statica e senza `mix-blend-mode`, quindi non costa niente a ogni frame.
- **Animazioni**: comparsa dal basso (`mFadeUp`) per testi e scelte, dissolvenze tra nodi.

## Telefoni e tablet

- Con `(max-width: 480px)` o `(max-height: 640px)` testi più piccoli e spaziature ridotte.
- La schermata di gioco scorre, con scorrimento automatico verso l'ultimo elemento.
- Il titolo «MEMENTO» usa `font-size: clamp(34px, 10.5vw, 120px)`: il gotico è largo (circa 8 em per la parola intera) e deve stare in uno schermo da 360 px.
- I dispositivi senza hover (`(hover: none)`) hanno il ventaglio a tocco + conferma, metà gocce di pioggia e la musica in modalità leggera (vedi [Audio](06-audio.md)).
- Testato in emulazione a 360×640 e 390×844; da verificare su telefoni reali.
