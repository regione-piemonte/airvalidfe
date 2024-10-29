# Prodotto
Airvalidfe

# Componente
Airvalidfejs

# Descrizione del prodotto
Software di front-end realizzato in Angular  (https://github.com/angular/angular-cli) version 13.3.10. 
L'interfaccia utente permette la visualizzazione grafica e tabellare delle misure del sistema regionale di rilevamento della qualità dell'aria facilitando l'operatore nell'operazione di validazione e certificazione delle misure.
Permette anche di effettuare reportistiche e visualizzare grafici di un set di elaborazioni. 
E' possibile anche effettaure delle ricerche sugli eventi e sull'anagrafica delle stazioni di rilevamento.


# Configurazioni iniziali 
Configurare l'endpoint sul file `src/environment.ts` di riferimento.
Creare nella cartella `htdocs` di Apache la cartella ariaval che costituirà la location da cui scaricare il front-end.

* Shibboleth
Configurare il VH scelto la protezione con Shibboleth del contesto /ambiente/ariaval: 

```bash
<Location /ambiente/ariaval>
  AuthType shibboleth
  ShibRequireSession On
  ShibUseHeaders On
  Require valid-user
  ShibRequestSetting applicationId XXX
</Location>
```

e configurare il ProxyPass:

```bash
ProxyPass /ambiente/ariaval https://server/ariaval
ProxyPassReverse /ambiente/ariaval https://server/ariaval
```


Sul server su cui si installa il front-end effettuare la seguente configurazione:


```bash
<Directory "/usr/www/htdocs/ariaval">
   Order Deny,Allow
   Deny from All
   Allow from XXX.XXX.XXX.XXX
   Allow from XXX.XXX.XXX.XXX
   Options -Indexes
</Directory>
```


in modo che  l'accesso a questa location sia dedicato soltanto alle richieste provenienti dal VH protetto da Shibboleth.

## Build

Avviare `ng build` per compilare il progetto. Se necessario avviare npm install per scaricare le librerie necessarie. Dopo il buil i file sono salvati nella cartella `dist/`


# Prerequisiti di sistema 
Fare riferimento al file BOM.csv per verificare l'elenco delle librerie esterne utilizzate in questo software.
Deve essere stata configurata la banca dati dell'autenticazione (airauth) dove vengono memorizzati i profili utente.

# Installazione 
Copiare il contenuto della cartella `dist/airvalidfejs` nella cartella `ariaval` di Apache.

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
