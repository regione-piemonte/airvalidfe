// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  //apiEndpoint:"https://tst-aria.csi.it/ariaweb/airvalidsrv/",
  /*apiEndpoint:"https://tst-secure.sistemapiemonte.it/ambiente/aria/airvalidsrv2/",*/
  basicAuth: {
    username: 'csi.demo 20',
    password: 'Pi$Mont!2022',
  },

  // apiEndpoint:'https://tst-secure.regione.piemonte.it/ambiente/ariaval',
  apiEndpoint:'http://localhost:8000/',
  /*basicAuth:{
    username:"test",
    password:"B%16d%4@J"
  },*/
  baseUrl: 'http://localhost:3000',
  logout: '/srpie_liv1_WRUP/Shibboleth.sso/Logout',

  timerPollingDataLock: 1 * 60 * 1000, //ms
  version: '0.26.2',
  path_new_tab: '',
  // Per la disabilitazione del wizard iniziale
  wizard: {
    validazione: false,
    reportistica: false,
    elaborazione: false
  },

  scelta_reportistica : {
    standard: false,
    specialistica: true,
    controlli: false
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
