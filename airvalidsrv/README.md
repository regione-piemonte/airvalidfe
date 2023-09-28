# Prodotto
Airvalidfe

# Componente
airvalidsrv

# Descrizione del prodotto
Software di back-end realizzato in Java per la gestione delle richieste provenienti dal front-end airvalidfejs.
Utilizza i servizi forniti dal prodotto airauth per la profilazione degli utenti.
Utilizza i servizi di interfacciamento al database del COP e al database regionale descritti nel documento `doc\AIRVALIDFE - Documentazione servizi esterni.docx`.

# Configurazioni iniziali 

Per installare correttamente il war è necessario effettuare le seguenti configurazioni su Apache:

```bash
ProxyPass /ariaval/airvalidsrv/ ajp://localhost:8009/airvalidsrv/
ProxyPassReverse /ariaval/airvalidsrv/ ajp://localhost:8009/airvalidsrv/
```

Inoltre è necessario creare le cartelle per i log dell'applicativo (la cartella specificata nel file log4j.propertis):

```bash
/usr/prod/airvalidfe/rp-01/airvalidsrv/logs/
```

Deve essere stato creato l'utente applicativo **airvalidfe** (definito nel context.xml) sulla banca dati dell'autenticazione. Questo utente deve appartenere ai gruppi **airvalidfe** e **awws**.
Il gruppo **airvalidfe** deve avere le seguenti funzioni:
* anagrafica_cop per leggere anagrafica cop con scrittura no e avanzata no
* anagrafica_srqa per leggere anagrafica regionale con scrittura no e avanzata no
* app_preferences: per scrivere le preferenze utente con scrittura si e avanzata no
* dati_cop con scrittura si (per poter validare e certificare) e avanzata no (se avanzato e' si vuol dire che si puo' decertificare)
* dati_srqa con scrittura no e avanzata no perche' non puo' scrivere i dati sul db regionale

# Getting Started 
Eseguire il target **release** di ANT (tramite OpenJDK 1.8).
Per impostare eventuali parametri tipici di ambienti di test o produzione e' possibile specificare la proprieta':
* `-Dtarget=prod`: per deployare su ambiente di produzione (file di properties `prod.properties`)
* `-Dtarget=tst`: per deployare su ambiente di test (file di properties `tst.properties`)

L'esecuzione di questo target crea un elenco di file tgz nella cartella `dist/prod` del workspace.

# Prerequisiti di sistema 
Fare riferimento al file BOM.csv per verificare l'elenco delle librerie esterne utilizzate in questo software.
Deve essere stata configurata la banca dati dell'autenticazione (airauth) dove vengono memorizzati i profili utente.
Devono essere installati i servizi di interfacciamento alla banca dati dell'anagrafica e delle misure. La descrizione di questi servizi si trova nella cartella `doc\AIRVALIDFE - Documentazione servizi esterni.docx`

# Installazione 
Copiare il war airvalidsrv.war nella cartella webapp di Apache.

# Esecuzione dei test
Sono stati eseguiti test di vulnerabilità DAST e SAST e non sono state rilevate vulnerabilita' gravi.

# Versioning
Per il versionamento del software si usa la tecnica Semantic Versioning (http://semver.org).

# Authors
La lista delle persone che hanno partecipato alla realizzazione del software sono  elencate nel file AUTHORS.txt.

# Copyrights
L'elenco dei titolari del software sono indicati nel file Copyrights.txt

# License 
SPDX-License-Identifier: EUPL-1.2-or-later

Vedere il file LICENSE per i dettagli.







