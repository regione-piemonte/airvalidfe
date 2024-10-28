export const environment = {
  production: true,
  apiEndpoint: 'https://secure.regione.piemonte.it/ambiente/ariaval/airvalidsrv/',
  basicAuth: {
    username: '',
    password: '',
  },
  baseUrl: 'https://secure.regione.piemonte.it/',
  logout: 'srpie_liv1_WRUP/Shibboleth.sso/Logout',
  timerPollingDataLock: 4 * 60 * 1000, //ms
  version: '2.3.0',
  path_new_tab: 'https://secure.regione.piemonte.it/ambiente/ariaval',
  wizard: {
    validazione: false,
    reportistica: false,
    elaborazione: false
  },
  scelta_reportistica : {
    standard: false,
    specialistica: false,
    controlli: false
  }
};
