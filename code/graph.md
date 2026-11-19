# Grafo del Capitolo 1 — Dall'hotel al cliffhanger su Glen

> **Nota (19/11/2026)** — Questa è la bozza di lavoro. La versione giocabile, con i testi rivisti, è in `public/story.json` (controllala con `npm run validate`). Modifiche rispetto alla bozza:
>
> - **S02**: vedi la stanza e il cellulare, con solo l'anteprima della notifica di Ellyn; il messaggio completo arriva in **S09**, dopo il PIN.
> - **S03** (obbligatorio): frughi nella giacca e trovi fiammiferi ×2 (Maisie Kelly, Bridge Street 13), ritaglio e tessera di Dunn, così in hall hai l'indirizzo del pub. Scelta: **S03B** (leggi il ritaglio) oppure scendi subito in **S04**.
> - **Ritaglio**: non dice più l'anno di fondazione. Riporta «Arklow Town, settantacinque anni di passione», Wicklow People, maggio 2023: il **PIN 1948** va ricavato (2023 − 75). Dopo 3 errori arriva un suggerimento che non dà la cifra.
> - **S06 → S07**: dopo la rissa Liam ti manda a pulire il bagno ("se ci tieni ai tuoi pollici…"): la tessera con la G non si può saltare.
> - **S07** diviso in **S07** (bagno, tessera G) e **S07B** (Tadhg McSeagull). **Tadhg è obbligatorio**: puoi incontrarlo prima o dopo Liam, ma il cellulare si sblocca solo dopo averlo ascoltato. La sua leggenda (Glen Bootleg, il patto con alcuni capi della Society of United Irishmen nel 1798, la sconfitta nel sangue — anche qui ad Arklow) ha un tema suo, `legend`: sfondo color sangue, musica cupa.
> - **Dadi** (S01, S04, S06, S10): l'esito mostra un breve **indizio**, poi "Continua". Nuovo dettaglio inventato in S06 (4–6): il compagno di rissa ti teneva un braccio sulle spalle e rideva.
> - **S11**: nella cassetta solo documenti e una rivista di ricette, nessuna ricetta in vista. **S13**: la pagina piegata nel libro di Dunn è la meringata al limone, e Tina dice che è il dolce preferito di Denise.
> - **S13 ↔ S15**: ognuno dei due si visita una volta sola (flag `meringata`, `ristampa`), niente giri a vuoto.
> - **S14**: hai perso la memoria, quindi non "riconosci" Glen. Qualcosa nella memoria si contrae e la didascalia ti dà il nome.
> - Carte: per ora usano le tre illustrazioni esistenti (inventore, caput mundi, libraio), in attesa dei tarocchi.
> - Testi: paragrafi spezzati in frasi, "Dà a Tina" → "Dai", "Collin St street 6" → "Collin Street 6".

## Atto I — Il risveglio al Dorney's Lodge Hotel

### `S01` — Il risveglio (Schermata iniziale)
* **Testo:** Senti il tessuto ruvido stropicciarti la faccia; l'odore di lana umida, polvere e sigaretta ti si inarca per le narici, fondendosi con la tua coscienza. Apri gli occhi impastati, come se non volessero lasciarti svegliare, e la vista si snebbia a poco a poco come una tenda di velluto pesante. Sulla parete, un orologio a cucù segna le 9:06, ma le lancette sembrano lente, come se ogni tic-tac richiedesse uno sforzo disumano ai suoi ingranaggi più vecchi di te. Una fitta ti prende alla tempia: tocchi e senti del sangue ormai rappreso. Ti tasti per assicurarti di essere intero, che ogni pezzo sia al suo posto. Chi sono? Come mi chiamo? E come sono finito qui?
* **Meccanica:** `Dado` — Verifica lucidità / Vertigine (`1d6`: `1-2` una vertigine ti sale dallo stomaco e ti fa sbandare; `3-6` reggi l'urto e metti a fuoco la stanza).
* **Collegamenti:**
  * Qualunque esito $\rightarrow$ `S02`

### `S02` — La stanza di quart'ordine
* **Testo:** Ti alzi, ancora vestito, su un letto dalle coperte pesanti che sanno di muffa. Intorno c'è una stanza da albergo di quart'ordine: carta da parati sbeccata, mobili vetusti con orli e merletti di sessant'anni prima, mai raffinati nemmeno quando erano stati creati. Nella giacca trovi una scatoletta di fiammiferi con il nome del pub e **due fiammiferi**, un **ritaglio di giornale** sulla vittoria e l'anniversario della squadra di calcio di Arklow (fondata nel 1948), una **tessera di biblioteca** non tua intestata a *Patrick Dunn* e il tuo **cellulare**. Il telefono è un guscio morto: niente linea, niente invio, niente app per capire chi sei, solo un SMS di *Ellyn*: *"Non credo di poterci essere, vai tu, Collin St street 6. Denise ti saprà dare una mano, lei ha il libro che cerchi"*.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Esamina meglio i fiammiferi e il ritaglio di giornale"* $\rightarrow$ `S03`
  * *"Esci dalla stanza e vai nella hall da Cillian"* $\rightarrow$ `S04`

### `S03` — Dettagli nella giacca (Micro-scelta)
* **Testo:** Stringi tra le dita la scatoletta con solo due fiammiferi: risorsa scarsa, ma utile se serve luce o fuoco. Sul giornale spicca la squadra di Arklow, fondata nel 1948, con il numero dell'anniversario celebrato. Il cellulare resta bloccato sul PIN e la tempia ti pulsa ancora di adrenalina e dolore.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Scendi nella hall a parlare con Cillian"* $\rightarrow$ `S04`

### `S04` — La hall, la moglie di Cillian e Lady Trish D.
* **Testo:** È un albergo polveroso a due stelle, con poche stanze. Cillian ti guarda storto: ti sei presentato verso le quattro del mattino battendo i pugni sull'uscio, alticcio, puzzando d'alcol. A riceverti era stata **sua moglie**, chiamata da lui perché preoccupata per il tuo stato. Stava per far chiamare la polizia, poi gli hai promesso il doppio in contanti e ti hanno dato una stanza. *"Stamattina è uscita presto"*, borbotta Cillian, *"diceva che ridursi così era un cattivo presagio. È andata da una cartomante, **Lady Trish D.** Cose che non mi convincono... a volte sembra che certe persone si tirino addosso i guai o spariscano proprio quando serve"*. Ti indica dove andare verso il centro.
* **Meccanica:** `Dado` — Ascolto / Acume (`1d6`: `1-3` prendi le parole di Cillian come uno sfogo; `4-6` cogli che sua moglie era inquieta non solo per la tua notte, ma come se avesse sentito odore di guai).
* **Collegamenti:**
  * *"Vai al pub Maisie Kelly in Bridge Street 13"* $\rightarrow$ `S05`

---

## Atto II — Il Pub Maisie Kelly e il telefono

### `S05` — Bridge Street 13: il Maisie Kelly
* **Testo:** Una bettola stretta e sporca, ficcata in un vicolo poco distante dall'hotel. Un tavolo da biliardo, aria pesante, odore di alcol e fumo. Dietro il bancone c'è Liam: abiti stinti, occhi puntuti, gote rubiconde. Ti squadra di cattivo occhio, come un conto rimasto aperto dalla notte prima.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Parla con Liam per sapere cosa è successo la sera prima"* $\rightarrow$ `S06`
  * *"Guardati intorno: noti il bagno sporco e un vecchio nell'angolo"* $\rightarrow$ `S07`

### `S06` — La rissa e il bagno
* **Testo:** Liam ti guarda torvo. La sera prima hai provocato una rissa da ubriaco insieme a un tizio di cui nessuno ricorda il nome, per via del tuo tifo per l'Arklow contro i Wicklow Rovers. Non ha chiamato la polizia perché non gli piacciono gli sbirri e perché stavi simpatico a Ellyn, la cameriera che oggi è a riposo. *"E poi"*, sbotta, *"sei andato in bagno e ci hai vomitato dentro"*. Chiedi l'indirizzo di Ellyn e si incavola, mandandoti a quel paese.
* **Meccanica:** `Dado` — Sangue freddo (`1d6`: `1-3` ti liquida senza aggiungere altro; `4-6` riesci a cogliere un dettaglio in più sul tuo stato prima che ti volti le spalle).
* **Collegamenti:**
  * *"Controlla il ritaglio dell'Arklow e prova a inserire il PIN sul cellulare"* $\rightarrow$ `S08`
  * *"Vai verso il bagno o verso il vecchio nell'angolo"* $\rightarrow$ `S07`

### `S07` — Il bagno e Tadhg McSeagull
* **Testo:** Nel bagno sporco, poggiata sulla tazza, trovi una tessera di cartone della biblioteca comunale: il volto sembra il tuo, ma del nome si legge solo l'iniziale **G**, il resto è grattato via dall'umidità; la prendi e la metti via. Nell'angolo della bettola c'è il vecchio Tadhg McSeagull, lo svitato del villaggio. Ti racconta di *Glen Bootleg*: pizzetto, capelli rossi, sorriso sempre smagliante, una leggenda — forse il diavolo o un folletto — che fa patti agli incroci ma dà sempre qualcosa di diverso da ciò che le persone vogliono. *"Ti ho visto con un tizio che me lo ricordava"*, dice il vecchio. *"Affabile, brillante, faceva ridere tutti... strano che nessuno si ricordi di lui"*.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Ora che conosci il legame con l'Arklow, prova a sbloccare il cellulare"* $\rightarrow$ `S08`
  * *"Torna a parlare con Liam"* $\rightarrow$ `S06`

### `S08` — Il PIN del telefono (Schermata PIN)
* **Testo:** Hai il cellulare bloccato e tra le mani il ritaglio sull'anniversario e la fondazione dell'Arklow (1948). Provi a inserire il numero legato alla squadra per sbloccarlo.
* **Meccanica:** `PIN` — Codice a 4 cifre legato all'anno di fondazione (`1948`) o al numero dell'anniversario riportato sull'articolo.
* **Collegamenti:**
  * *PIN corretto* $\rightarrow$ `S09`
  * *PIN errato* $\rightarrow$ resta su `S08` (*"Non si sblocca. Ricontrolla la data o il numero dell'anniversario sull'articolo dell'Arklow"*).

### `S09` — Gli SMS di Ellyn
* **Testo:** Il telefono si sblocca, ma resta inutile per capire chi sei: non ha linea, non permette di inviare messaggi e non ci sono app con tuoi dati o un nome. Restano solo gli SMS di Ellyn: *"Non credo di poterci essere, vai tu, Collin St street 6. Denise ti saprà dare una mano, lei ha il libro che cerchi"*.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Vai in Collin St street 6 a cercare Denise"* $\rightarrow$ `S10`

---

## Atto III — Collin St street 6, la biblioteca e il cliffhanger su Glen

### `S10` — Collin St street 6: la porta e il sangue
* **Testo:** Suoni, ma non risponde nessuno. Controlli sotto il tappeto e provi ad aprire la porta, ma un cane da dentro non ti fa entrare e ti costringe a restare fuori. Noti però delle **tracce di sangue** sulla porta: Denise non sembra semplicemente uscita. Ti verrebbe da andare dalla polizia, ma ti fermi: non hai documenti, hai fatto una rissa la sera prima e sai che in queste zone certe cose con gli sbirri non vengono viste di buon occhio.
* **Meccanica:** `Dado` — Istinto / Osservazione (`1d6`: `1-2` pensi soprattutto al rischio di farti notare; `3-6` noti che il sangue è fresco e che qualcuno ha avuto fretta di andarsene).
* **Collegamenti:**
  * *"Controlla la cassetta delle lettere"* $\rightarrow$ `S11`

### `S11` — La cassetta delle lettere
* **Testo:** Nella cassetta delle lettere trovi documenti e una rivista di cucina che vengono dalla **Arklow Library, in 7 Main St**, e capisci che la **meringata al limone** è la ricetta preferita di Denise. Ma di Denise nessuna traccia: è irrintracciabile e quel sangue sulla porta continua a pesarti sullo stomaco.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Vai alla Arklow Library in 7 Main St"* $\rightarrow$ `S12`

### `S12` — Arklow Library (7 Main St)
* **Testo:** Denise non c'è. Trovi una ragazza, Tina, che ti chiede una tessera se ti serve un libro. Hai con te la tessera di *Patrick Dunn* e la tessera con la tua foto e l'iniziale **G**.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Dà a Tina la tessera di Patrick Dunn"* $\rightarrow$ `S13`
  * *"Dà a Tina la tua tessera con la G"* $\rightarrow$ `S14`
  * *"Chiedi a Tina di ristampare la tessera per leggere il nome"* $\rightarrow$ `S15`

### `S13` — La tessera di Patrick Dunn: la meringata al limone
* **Testo:** A quel nome risulta segnato un libro di ricette con una pagina piegata sulla **meringata al limone**, il dolce preferito di Denise. È un dettaglio che potrà tornarti utile più avanti, ma non ti dice dov'è finita Denise.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Chiedi a Tina di cercare con la tua tessera (quella con la G)"* $\rightarrow$ `S14`
  * *"Chiedi a Tina una ristampa della tessera"* $\rightarrow$ `S15`

### `S14` — Il libro del 1798 e l'immagine di Glen (Cliffhanger)
* **Testo:** Con la tua tessera salta fuori a tuo nome un libro esoterico sui patti della **Rivolta irlandese del 1798**, che rimanda alla **St. Saviour's Church** e alla tomba di un certo **Montgomery**. Mentre guardi il libro, ti trovi davanti l'immagine di **Glen**: il respiro ti si ferma. Quel viso, quel pizzetto, quello sguardo sono identici a quelli del tizio con cui eri la sera prima al pub. Un brivido ti corre lungo la schiena mentre ti chiedi cosa significhi davvero quel volto... e chi fossi tu accanto a lui.
* **Meccanica:** `Nessuna` — Chiusura di capitolo.
* **Collegamenti:**
  * **Fine Capitolo 1** $\rightarrow$ `S16` (*Inizio Capitolo 2: St. Saviour's Church e il cimitero di Montgomery*)

### `S15` — Richiesta di ristampa (Micro-scelta)
* **Testo:** Provi a chiedere a Tina una ristampa per leggere il tuo nome, ma lei ti dice che può farlo solo Denise, che per adesso non c'è.
* **Meccanica:** `Scelta`
* **Collegamenti:**
  * *"Usa la tessera con la G per cercare il libro a tuo nome"* $\rightarrow$ `S14`
  * *"Controlla la tessera di Patrick Dunn"* $\rightarrow$ `S13`

---

**Fine Capitolo 1**