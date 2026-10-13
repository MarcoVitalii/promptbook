# Come iniziare uno spettacolo dal testo dell'autore

Hai il copione come file di Word o di testo e lo vuoi in un copione di scena, salvato come file spettacolo, pronto per i cue.

## Prima di cominciare

- Chrome o Edge su un computer. Gli altri browser aprono lo strumento ma non possono salvare i file spettacolo.
- Il copione come testo che puoi copiare. Da Word: seleziona tutto, copia.

## Passi

1. **Apri `promptbook.html`** e premi **Inizia incollando il testo**.
2. **Incolla il copione** nel riquadro e premi **Salva**. Sopra il testo il riquadro mostra la forma attesa; non sistemare prima il copione, incollalo com'è.
3. **Salvalo subito come file:** **☰** → **Salva come file spettacolo…**, scegli un posto e un nome. Finché non lo fai, lo spettacolo vive solo in questo browser e non ha cronologia. Ora lo stato accanto al titolo dice **Salvato** e l'ora; da qui in poi il salvataggio è automatico.
4. **Apri Rivedi** (il pulsante **Rivedi**, o R). Il numero sul pulsante conta ciò che va guardato. Scorrilo; ogni voce porta al suo punto:
   - **Righe non riconosciute**: testo che lo strumento non ha saputo leggere come battuta, azione o titolo. Di solito una battuta con il nome in minuscolo, o una didascalia senza parentesi. Fai doppio tocco sulla riga e correggila: `NOME: testo` per una battuta, `(testo)` per un'azione. A una riga che continua la battuta sopra basta togliere la riga vuota che le separa.
   - **Personaggi**: ogni nome con il numero delle sue battute. Un nome che parla una volta sola è spesso un refuso (`MARCO` e `MARC0`) o un'azione letta come battuta.
5. **Dai allo spettacolo titolo e personaggi.** **☰** → **Modifica tutto il testo…** e metti questo proprio in cima, poi **Salva**:

   ```
   ---
   titolo: Il mare
   autore: Nome Cognome
   personaggi:
     - ANNA/A - la figlia
     - MARCO/M - il pescatore
     - IL GUARDIANO
   ---
   ```

   Il copione ha ora un frontespizio e una pagina dei personaggi. Rivedi ti dice anche chi parla senza essere in elenco, e chi è in elenco e non parla mai. Un alias (`A` per `ANNA`) permette all'autore di continuare a scrivere i nomi brevi.
6. **Imposta i reparti:** **☰** → **Impostazioni…**. Ci sono Luci, Audio, Video e Da fare. Cambia sigle, nomi e colori in quelli che usa la tua compagnia, e aggiungi ciò che manca (macchinisti, attrezzeria). Fallo adesso: cambiare una sigla più tardi non riscrive i cue già messi sotto quella vecchia.
7. **Salva una prima revisione:** **☰** → **Cronologia…**, dalle un nome (per esempio «Come ricevuto dall'autore»), **Salva revisione**. È il testo prima che tu lo toccassi, e il punto da cui può partire ogni confronto futuro.

## Che cosa hai

Un file spettacolo con il copione impaginato come verrà stampato, un Rivedi pulito e una prima revisione. Poi: [Mettere i cue](03-cue-the-script.md).

## Se qualcosa non va

- **Pagine intere sono «non riconosciute».** Probabilmente i nomi non sono in maiuscolo. Lo strumento prende `NOME:` come battuta solo quando il nome non ha lettere minuscole. Chiedi all'autore i nomi in maiuscolo, o correggili con trova e sostituisci in un editor prima di incollare.
- **Una battuta ha inghiottito la successiva.** Una riga che non comincia con `NOME:` continua il blocco sopra. Rimetti nome e due punti.
- **Un atto non comincia su una pagina nuova.** Al suo titolo serve `#` davanti, o una delle parole che lo strumento conosce (ATTO, SCENA, PROLOGO e le forme inglesi) a inizio riga.
- **«Questo browser non può salvare i file dello spettacolo.»** Non sei in Chrome o Edge. Lo spettacolo resta nel browser; usa **Esporta backup** per tirarlo fuori, poi apri lo strumento in Chrome o Edge e **Importa un file di backup…**.

Le forme esatte che lo strumento legge sono nel [Riferimento](../reference.md#scrivere-il-copione).
