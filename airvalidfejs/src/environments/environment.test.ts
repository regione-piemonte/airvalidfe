export const environment = {
  production: true,
  //apiEndpoint:"https://tst-secure.sistemapiemonte.it/ambiente/aria/airvalidsrv2/",
  apiEndpoint: 'https://tst-secure.regione.piemonte.it/ambiente/ariaval/airvalidsrv2/',
  basicAuth: {
    username: '',
    password: '',
  },
  baseUrl: 'https://tst-secure.regione.piemonte.it/',
  logout: 'srpie_liv1_WRUP/Shibboleth.sso/Logout',
  timerPollingDataLock: 1 * 60 * 1000, //ms
  version: '0.26.2',
  path_new_tab: 'https://tst-secure.regione.piemonte.it/ambiente/ariaval',
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
