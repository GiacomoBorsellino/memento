# MEMENTO

<p align="center">
  <img src="./_material/findyourway.png" width="370">
</p>

### Un librogame interattivo

> _"Non tutto ciò che è dimenticato è perduto."_

<p align="center">
  <a href="https://mementotest.netlify.app/"><strong>▶ Gioca nel browser</strong></a><br>
  <sub>Gratis, senza installare niente. Funziona anche da telefono.</sub>
</p>

---

## Capitolo 1 — I diavoli di Arklow

_Arklow, Irlanda. Mistero, thriller, esoterismo._

Senti il tessuto ruvido stropicciarti la faccia. Un orologio a cucù segna le 9:06. Una fitta alla tempia: la tocchi, ed è sangue rappreso.

**Chi sono? Come mi chiamo? E come sono finito qui?**

Ti svegli ancora vestito in una stanza d'albergo di quart'ordine, senza un nome e senza un ricordo. Nelle tasche della giacca ci sono una scatoletta di fiammiferi di un pub, un ritaglio di giornale sulla squadra di calcio di Arklow e la tessera della biblioteca di uno sconosciuto. Sul cellulare, bloccato, solo l'anteprima di un messaggio di una certa Ellyn: _«Non credo di poterci essere, vai tu…»_

Seguendo quello che hai in tasca ricostruirai la notte appena passata: una rissa da ubriaco, un compagno di bevute di cui nessuno ricorda la faccia, e la leggenda che un vecchio ti racconta sottovoce in fondo a un pub. Quella di **Glen Bootleg**, che stringe patti agli incroci e dà sempre qualcosa di diverso da ciò che la gente vuole.

### Chi incontrerai

| | |
| - | - |
| **Cillian** | Il proprietario dell'albergo. Ti guarda storto: alle quattro del mattino battevi i pugni sul suo uscio. |
| **Liam** | Dietro il bancone del Maisie Kelly: abiti stinti, occhi puntuti, gote rubiconde. Ti squadra come un conto rimasto aperto. |
| **Ellyn** | La cameriera del pub. Ti ha lasciato un messaggio, ma oggi è a riposo. |
| **Tadhg McSeagull** | Lo svitato del villaggio. Ha una storia da raccontarti, se ti siedi accanto a lui. |
| **Glen Bootleg** | Pizzetto, capelli rossi, un sorriso sempre smagliante. Il diavolo, dicono alcuni. Un folletto, dicono altri. |

---

## Come si gioca

- **Leggi.** La scena si svela una frase alla volta.
- **Scegli una carta.** Ogni illustrazione è un modo di agire: fare, parlare con qualcuno, leggere e cercare.
- **Lancia il dado.** Decide quanto riesci a cogliere, e a volte ti lascia un indizio.
- **Raccogli oggetti.** Certe strade si aprono solo se hai in tasca la cosa giusta.
- **Risolvi gli enigmi.** La soluzione è sempre nella storia, per chi sa dove guardare.
- **Ricostruisci la mappa.** Arklow è avvolta nella nebbia della tua memoria: ogni luogo che visiti torna a inchiostro sulla carta, quelli di cui senti parlare restano a matita.

La partita si salva da sola a ogni scena: puoi chiudere e riprendere più tardi con «Continua».

## L'atmosfera

Ogni luogo ha i suoi colori e la sua musica: un pianoforte stanco e un orologio a cucù nell'albergo, violino e bodhrán al pub, la pioggia sulle strade di Arklow. La colonna sonora è composta al momento, mentre giochi: nessuna partita suona uguale a un'altra.

## Prossimamente

- **Capitolo 2.**
- **I tarocchi**: illustrazioni originali dell'autore al posto delle carte attuali.
- **Versione installabile** su telefono.

---

## Per chi sviluppa

Memento è un'app web (React + Vite) senza server: la storia è un file di dati separato dal motore, i salvataggi restano nel browser, la musica è sintetizzata al momento.

```bash
cd code
npm install
npm run dev
```

Tutta la documentazione tecnica è in **[`docs/`](docs/README.md)**: architettura, formato della storia, motore, salvataggi, audio, strumenti e un'analisi del codice.

---

## Crediti

- **Storia, narrazione e illustrazioni delle carte**: Giacomo Borsellino
- **Font dei titoli**: _Elementary Gothic Bookhand_ di Bill Roach (SIL Open Font License)
- **Musica ed effetti**: generati con la Web Audio API

## Licenza

Progetto personale — tutti i diritti riservati.
Le illustrazioni delle carte sono opere originali dell'autore.
