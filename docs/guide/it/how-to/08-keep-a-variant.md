# Come tenere una versione per un altro teatro

Lo spettacolo va in un secondo teatro con un impianto diverso, o a un festival che lo vuole più corto. Vuoi quella versione accanto a quella principale, ognuna per la sua strada.

## Prima, decidi se ti serve

Una variante è per una differenza che **resterà**. Le modifiche fatte in una variante non arrivano all'altra: una battuta che l'autore corregge la settimana prossima va corretta in entrambe.

| Situazione | Usa |
|---|---|
| Provare un taglio per qualche prova | Una revisione prima; ripristina se non funziona ([come](05-mark-a-moment.md)) |
| Lo stesso testo, altri numeri di cue per i tecnici del teatro | Una variante |
| Una versione da quaranta minuti per un concorso | Una variante |
| Un secondo cast con lo stesso testo | Nessuna delle due: è lo stesso spettacolo |

Falla il più tardi possibile, quando il testo principale si è assestato.

## Fare la variante

1. Porta lo spettacolo principale allo stato da cui la nuova versione deve partire, e **salva una revisione** («Principale, prima della versione Verdi»).
2. **☰** → **Cronologia…**
3. Sotto **Variante**, scrivi il nome in «Nome di una nuova variante» (per esempio «Teatro Verdi») e premi **Nuova variante**.

Ora stai lavorando in «Teatro Verdi». Parte come copia esatta: testo, cue, inchiostro, tavole, pagine bloccate.

4. Fai le modifiche per quel teatro. Salva revisioni man mano; appartengono a questa variante.

## Passare dall'una all'altra

1. **☰** → **Cronologia…**
2. Scegli la variante nell'elenco **Variante**.

Lo spettacolo passa all'ultimo stato di quella variante. Ciò che avevi aperto viene prima tenuto, come revisione della variante che lasci.

Controlla sempre in quale variante sei prima di lavorare. Il riquadro Cronologia lo dice in alto.

## Una correzione che serve a entrambe

Falla in ciascuna:

1. Nella variante in cui sei, fai la modifica. Se è lunga, copia il testo corretto.
2. Cambia variante.
3. Trova lo stesso punto, fai la stessa modifica.
4. Salva una revisione in ciascuna, con lo stesso nome («Correzioni dell'autore, 20 ottobre»), così più tardi vedi che ce l'hanno entrambe.

Per più di una manciata di correzioni, chi usa git può fonderle: la cronologia è un vero repository git dentro il file spettacolo. I passi sono in `docs/specs/08-history.md` (HIS-11), in inglese.

## Che cosa ha di suo ogni variante

Testo, cue e loro numeri, inchiostro, tavole e modelli, i numeri di pagina bloccati e quindi la carta, i tempi imparati in modalità spettacolo, le impostazioni dello spettacolo (reparti, carta).

Che cosa hanno in comune: nient'altro che il loro passato, fino al momento in cui la variante è stata fatta.

## Se qualcosa non va

- **Ho fatto modifiche nella variante sbagliata.** Apri la Cronologia, trova la revisione di questa variante precedente alle tue modifiche e ripristinala; le tue modifiche restano come «Prima di passare a …». Poi cambia variante e rifalle in quella giusta.
- **Voglio togliere o rinominare una variante.** Dallo strumento non si può. Una variante non usata non fa danni.
- **Un file per gli attori dell'altra variante.** Ogni variante fa i suoi file per gli attori. Un attore che ne apre uno dopo l'altro si sente dire che il secondo è «più vecchio», o vede modifiche che non sono modifiche. Manda i file di una variante solo a chi recita quella variante.
