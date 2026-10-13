# Riferimento

Ciò che si cerca mentre si lavora: le forme in cui si scrive il copione, le forme di un cue, i tasti, il contenuto di un file spettacolo. Ogni sezione indica la parte della specifica (in inglese) che contiene la regola completa.

## Scrivere il copione

Regole complete: `docs/specs/01-script-text.md`.

```
---
titolo: Il mare
autore: Nome Cognome
personaggi:
  - ANNA/A - la figlia
  - MARCO/M - il pescatore
---
# ATTO PRIMO
## Scena 1

(Buio. Si sente il mare.)

ANNA: Chi è là? (si volta) Rispondi!
MARCO: Sono io.
& ANNA: Non ti credo!

%% Una battuta messa da parte. Non si vede e non si stampa. %%
```

| Scrivi | È |
|---|---|
| `# testo` | Un atto. Comincia una pagina nuova. |
| `## testo` | Una scena |
| `NOME: testo` | Una battuta. Il nome non ha lettere minuscole, a parte `e`, `ed`, `and`, `&` tra due nomi. |
| `ANNA E MARCO: testo` | Una battuta detta da entrambi |
| `& NOME: testo` | Detta insieme alla battuta sopra. Ne possono seguire diverse. |
| `(testo)` su una riga sua | Un'azione |
| `(testo)` dentro una battuta | Una didascalia, in corsivo |
| `NOME (didascalia): testo` | Una battuta con una didascalia dopo il nome |
| Qualsiasi altra riga | Il seguito del blocco sopra |
| `%% testo %%`, o righe tra due righe `%%` | Un commento: resta nel testo, si vede come un piccolo segno, non si stampa mai, non va mai agli attori |

Una riga che comincia con ATTO, SCENA, PROLOGO, EPILOGO, QUADRO, PARTE, INTERVALLO, FINE (o le forme inglesi ACT, SCENE, PROLOGUE, EPILOGUE, PART, INTERVAL, END) è un titolo anche senza `#`.

Una riga che lo strumento non sa collocare resta com'è scritta ed è elencata in Rivedi sotto «Righe non riconosciute».

### La testa del copione

Tra due righe `---`, come primissima cosa. Ogni campo è facoltativo; qualsiasi `chiave: valore` viene mostrato sul frontespizio.

| Campo | Fa |
|---|---|
| `titolo` (o `title`) | Il titolo dello spettacolo; grande sul frontespizio. Vince sul titolo nelle Impostazioni. |
| `personaggi` (o `characters`) | L'elenco dei personaggi: una pagina sua, e il controllo dei nomi in Rivedi |
| qualsiasi altro | Una riga sul frontespizio, nell'ordine scritto |

Un personaggio è `NOME`, `NOME/ALIAS` o `NOME/ALIAS - descrizione`. Una battuta scritta sotto un alias (`A: …`) è mostrata sotto il nome intero. `TUTTI`, `GLI ALTRI`, `TUTTI TRANNE …` (e `ALL`, `OTHERS`, `ALL BUT …`) non vengono mai controllati sull'elenco.

## I cue

Regole complete: `docs/specs/02-cues.md`. Li metti toccando; questo è ciò che viene scritto, per quando lo incontri nel testo.

| Nel testo | È |
|---|---|
| `parola {LX 12}` | Il cue 12 di LX, chiamato su «parola» |
| `{LX 12 \| buio}` | Con un testo a margine, mostrato sull'etichetta |
| `{LX 12 \| buio \| 3 secondi, quando si volta}` | Anche con una descrizione, mostrata solo nella lista cue |
| `{SND \| onda lunga}` | Senza numero |
| Un cue da solo su una riga | Chiamato tra due blocchi |
| `{/SND 5}` | La fine di SND 5 |
| `{/SND}` | La fine dell'ultimo SND ancora aperto |
| `{SND 6 / SND 5 \| nuova traccia}` | Il cue SND 6, che chiude anche SND 5 |
| `{TODO \| controllare l'ingresso}` | Un appunto da fare: un cue di un reparto con la spunta «Da fare» |
| `{NOTE \| più piano}` | Una nota per gli attori, per chi dice la battuta: un cue di un reparto con la spunta «Attori» |
| `{NOTE ANNA, MARCO \| più piano}` | Per i personaggi indicati |
| `{NOTE TUTTI \| note alle cinque}` | Per tutti |
| `{BOARD Atto 1 ingresso}` su una riga sua | Dove si vede una tavola |

Reparti, sigle e colori sono in **Impostazioni**. Uno spettacolo nuovo ha LX (Luci), SND (Audio), VID (Video) e TODO (Da fare).

## Pulsanti e tasti

Nello strumento, **Guida** (H) dà un nome a ogni pulsante e **?** elenca ogni tasto. Regole complete: `docs/specs/09-workbench.md`, `docs/specs/05-input.md`.

I tasti singoli agiscono quando nessun campo ha il cursore e nessun riquadro dei cue è aperto.

| Tasto | Fa |
|---|---|
| H | Guida ai pulsanti |
| ? | L'elenco dei tasti |
| Ctrl+F, `/` | Cerca. Invio successivo, Maiusc+Invio precedente, Esc esce. |
| Ctrl+Z, Ctrl+Y | Annulla, ripeti |
| Ctrl+S | Salva subito |
| Ctrl+P | Stampa |
| 1 2 3 4 | Colore della penna |
| E, F | Gomma; fa disegnare il dito |
| B, C, I | Mostra o nascondi tavole, cue, tratti |
| N | Modalità notte |
| L, R | Lista cue, Rivedi |
| + − 0 | Ingrandisci, riduci, adatta |
| Pag giù, Pag su | Pagina successiva, precedente |
| Home, Fine | Inizio, fine del copione |
| Canc | Elimina il cue o la tavola del riquadro aperto |
| Esc | Chiude il riquadro o il menu |
| S | Modalità spettacolo |
| Ctrl+Invio, Esc | In un editor di testo: salva, annulla |

In modalità spettacolo:

| Tasto | Fa |
|---|---|
| Spazio | Avvia o ferma la riga |
| ↓ ↑ | Riga al blocco successivo o precedente |
| Invio | Torna alla riga |
| `[` `]` | Ritmo della serata: più lento, più veloce |
| C, I, N, L, + − 0, tasti di pagina, Home, Fine, H, ? | Come sopra |
| S, due volte | Esci |

## Il Menu

| Voce | Fa | Guida |
|---|---|---|
| Modifica tutto il testo… | Il testo intero, con i segni dei cue | [Accogliere una riscrittura](how-to/04-take-in-a-rewrite.md) |
| Impostazioni… | Titolo, carta, lingua, reparti, intensità dei modelli, griglia delle tavole, i tempi della modalità spettacolo | |
| Modelli… | Gli sfondi su cui si disegnano le tavole | |
| Cronologia… | Revisioni, varianti, pagine bloccate, modifiche | [Segnare un momento](how-to/05-mark-a-moment.md) |
| Invia agli attori… | Il file per gli attori | [Inviare agli attori](how-to/09-send-to-the-cast.md) |
| Esporta backup, Importa backup… | Lo spettacolo come un solo `.promptbook.json`, senza cronologia | [Spostare e salvare in copia](how-to/12-move-and-back-up.md) |
| Guida ai pulsanti, Scorciatoie da tastiera | Aiuto | [Orientarsi](how-to/02-find-your-way.md) |
| Salva come file spettacolo…, Apri file spettacolo…, Chiudi spettacolo | Il file spettacolo | [Spostare e salvare in copia](how-to/12-move-and-back-up.md) |

## Rivedi

Che cosa elenca il pannello Rivedi. Il primo gruppo conta nel numero sul pulsante.

| Voce | Vuol dire |
|---|---|
| Da fare | I tuoi appunti da fare. Una spunta ne toglie uno. |
| Note per gli attori | Le note che porterà il prossimo file per gli attori |
| Righe non riconosciute | Testo che non è una battuta, un'azione o un titolo |
| «&» senza battuta sopra | Una battuta simultanea senza niente con cui esserlo |
| Non nell'elenco dei personaggi | Chi parla e manca da `personaggi` |
| Inchiostro da controllare | Inchiostro su un blocco le cui parole sono cambiate |
| Inchiostro di testo rimosso | Inchiostro il cui blocco non c'è più |
| Reparti sconosciuti | Cue la cui sigla non è nelle Impostazioni |
| Fine senza cue da chiudere | Una fine, o un collegamento, che non corrisponde a niente |
| Commentati | Blocchi tra `%%` (non contati) |
| Personaggi | Ogni nome e quante volte parla (non contato) |
| In elenco ma senza battute | In `personaggi`, senza battute (non contato) |

## Dentro un file spettacolo

Regole complete: `docs/specs/07-storage.md`. Uno spettacolo è uno `.zip`; lo apre qualunque programma per gli zip.

| Dentro | Contiene |
|---|---|
| `script.md` | Il copione, con i suoi cue. Testo semplice. |
| `script.ink.json` | L'inchiostro sulle pagine del copione |
| `config.json` | Titolo, carta, reparti, modelli in uso, numeri di pagina bloccati, tempi della modalità spettacolo |
| `boards/` | L'immagine e l'inchiostro di ogni tavola |
| `templates/` | Lo stesso per ogni modello |
| `.git/` | La cronologia: revisioni e varianti. Un repository git. |

Altri file che lo strumento scrive:

| File | È |
|---|---|
| `…-cast.html` | Il copione per gli attori, con dentro uno spettacolo |
| `….cast.json` | Solo testo e note, per un lettore già sul dispositivo |
| `….promptbook.json` | Un backup di uno spettacolo: tutto tranne la cronologia |
| `.csv`, o uno `.zip` di csv | Liste cue |

## Le parole usate qui

| Parola | Vuol dire |
|---|---|
| Blocco | Una battuta, un'azione o un titolo. Inchiostro, tempi e spostamenti vanno per blocco. |
| Cue | Un segno dopo una parola, sotto un reparto |
| Fine | Il segno che chiude un cue che dura |
| Testo a margine, descrizione | Il testo breve sull'etichetta; quello lungo nella lista cue |
| Reparto | Per chi è un cue: luci, audio. Anche i tipi di nota: da fare, attori. |
| Tavola | Un disegno o una pianta sulla pagina a fronte |
| Modello | Uno sfondo su cui si disegnano le tavole |
| Revisione | Tutto lo spettacolo in un momento con un nome |
| Variante | Un ramo dello spettacolo con revisioni sue |
| Numeri bloccati | I numeri di pagina fissati alla carta di una revisione |
| File per gli attori | Il copione e le note per gli attori |
| Modalità spettacolo | La vista in sola lettura per chiamare una replica |
| La riga | Il punto dello spettacolo in modalità spettacolo |
