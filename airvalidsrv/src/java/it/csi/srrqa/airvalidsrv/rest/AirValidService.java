/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.AsyncResponse;
import javax.ws.rs.container.Suspended;
import javax.ws.rs.core.MediaType;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import it.csi.srrqa.airdb.model.Calibration;
import it.csi.srrqa.airdb.model.DBConstants;
import it.csi.srrqa.airdb.model.DataUtils;
import it.csi.srrqa.airdb.model.Measure;
import it.csi.srrqa.airdb.model.MeasureKey;
import it.csi.srrqa.airdb.model.MeasureValue;
import it.csi.srrqa.airdb.model.Preference;
import it.csi.srrqa.airdb.model.Sensor;
import it.csi.srrqa.airvalidsrv.elaboration.AbsMaximumElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.AbsMinimumElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DailyDifferencesElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DailyMaximumElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DailyMaximumMinimumRatioElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DailyMeanElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DailyMinimumElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DailyScalingElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DailyStdDevElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DailyVarCoeffElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DayTimelyMaximumElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DayTimelyMinimumElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.DifferencesElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.Elaboration;
import it.csi.srrqa.airvalidsrv.elaboration.ElaborationException;
import it.csi.srrqa.airvalidsrv.elaboration.ElaborationGroup;
import it.csi.srrqa.airvalidsrv.elaboration.ElaborationItf;
import it.csi.srrqa.airvalidsrv.elaboration.ElaborationResultHolder;
import it.csi.srrqa.airvalidsrv.elaboration.GlobalMeanElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.HolidayTimelyMeanElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.HourlyMeanElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.HourlyScalingElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.SaturdayTimelyMeanElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.ScalingElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.SlidingMeanElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.TimeSplitElaborationFactory;
import it.csi.srrqa.airvalidsrv.elaboration.TimeSplitElaborationFactory.SplitPeriod;
import it.csi.srrqa.airvalidsrv.elaboration.TimelyFreqElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.TimelyMaximumAbsoluteElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.TimelyMeanElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.TimelyMinimumAbsoluteElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.WeekTimelyMeanElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.WorkingHolidayMaxDailyReductionElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.WorkingHolidayReductionElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.WorkingSatMaxDailyReductionElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.WorkingSatReductionElaboration;
import it.csi.srrqa.airvalidsrv.elaboration.WorkingTimelyMeanElaboration;

@Path("/")
public class AirValidService extends RestService {

	private static final String BASIC_AUTH_HEADER = "Authorization";
	private static final String SHIB_AUTH_ID = "Shib-Identita-CodiceFiscale";
	private static final String PERIOD_MINUTES = "Period [minutes]";
	private static final String PERIOD_M_EQ = "period_m=";
	private static final String YEAR = "anno";
	private static final String END_DATE = "End date";
	private static final String BEGIN_DATE = "Begin date";
	private static final String BEGINDATE_EQ = ", beginDate=";
	private static final String ENDDATE_EQ = ", endDate=";
	private static final String VERIFICATION_LEVEL = "Verification level";
	private static final String VERIFICATIONLEVEL_EQ = "verificationLevel=";
	private static final String DECIMAL_DIGITS = "Cifre decimali";
	private static final String DECIMAL_DIGITS_EQ = "decimalDigits=";
	private static final String GET_PREFERENCES = "GET /preferences/";
	private static final String DELETE_PREFERENCES = "DELETE /preferences/";
	private static final String FN_VALIDAZIONE = UserCache.FUNCTION_VALIDAZIONE;
	private static final Integer APPLICATION_ID = 3;
	private static final String DATASET_CFG_GROUP = "dataset_config";
	private MeasureCorrector corrector;
	private DataCache dataCache;

	public AirValidService(ServiceConfig airDbServiceCfg, ServiceConfig copDbServiceCfg, ServiceConfig authServiceCfg,
			boolean enableShibbolet, int measureLockTimeout_m, boolean disableTrustManager, MeasureCorrector corrector,
			DataCache dataCache) {
		super(airDbServiceCfg, copDbServiceCfg, authServiceCfg, enableShibbolet, measureLockTimeout_m,
				disableTrustManager);
		this.corrector = corrector;
		dataCache.setClientProvider(this);
		this.dataCache = dataCache;

	}

	// Le funzioni che restituiscono elenchi di nomi di oggetti dell'anagrafica,
	// producono liste di oggetti con i seguenti campi:
	// - name (String): nome dell'elemento di anagrafica
	// - key (String): la chiave con cui effettuare operazioni sull'oggetto
	// (lettura, aggiornamento, cancellazione)
	// - active (boolean): dice se l'elemento di anagrafica è ancora attivo, nel
	// caso in cui l'oggetto possa essere valido solo su un periodo di tempo
	// definito
	// - extraInfo (String): eventuali informazioni aggiuntive generiche
	// - flags (String): eventuali informazioni aggiuntive tipo 'flag'
	// - beginDate (Date ms): eventuale data di inizio validità dell'elemento di
	// anagrafica
	// - endDate (Date ms): eventuale data di fine validità dell'elemento di
	// anagrafica

	// Restituisce l'elenco dei nomi dei parametri (meteo, inquinanti) misurati e
	// presenti nella banca dati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/parameternames/cop
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/parameternames/{dbId}")
	public void getParameterNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("GET /parameternames/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getAnagraphCache(dbId).getParameterNames();
			}
		});
	}

	// Restituisce tutti gli oggetti di tipo 'Parameter' presenti nella banca dati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/parameters/cop
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/parameters/{dbId}")
	public void getParameters(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("GET /parameters/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getAnagraphCache(dbId).getParameters();
			}
		});
	}

	// Restituisce l'elenco dei nomi delle unità di misura presenti nella banca dati
	// nel campo extraInfo viene resa disponibile la sigla html dell'unità di misura
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/measureunitnames/cop
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/measureunitnames/{dbId}")
	public void getMeasureUnitsNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("GET /measureunitnames/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getAnagraphCache(dbId).getMeasureUnitNames();
			}
		});
	}

	// Restituisce l'elenco dei nomi delle reti di monitoraggio
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// "beginDate": data di inizio del periodo di ricerca delle informazioni
	// "endDate": data di fine del periodo di ricerca delle informazioni
	// "owner": 'public' -> solo le reti di proprietà pubblica
	// _________'public_managed' -> reti di proprietà pubblica e reti private a
	// _____________________________gestione pubblica
	// _________'private' -> solo le reti private
	// _________non specificato -> tutte le reti
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/networknames/cop
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/networknames/{dbId}")
	public void getNetworkNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @QueryParam("beginDate") final String beginDate,
			@QueryParam("endDate") final String endDate, @QueryParam("owner") final String owner) {
		runTask(new ServiceTask("GET /networknames/" + dbId + BEGINDATE_EQ + beginDate + ENDDATE_EQ + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getAnagraphCache(dbId).getNetworkNames(param2DateObj(beginDate, BEGIN_DATE),
						param2DateObj(endDate, END_DATE), owner, getUserCache(basic, auth), getAuthCache());
			}
		});
	}

	// Restituisce l'oggetto con tutte le informazioni relative ad una rete di
	// monitoraggio
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {netId}: identificatore dell'oggetto rete (come ottenuto nell'elenco dei nomi
	// delle reti)
	// "beginDate": data di inizio del periodo di ricerca delle informazioni
	// "endDate": data di fine del periodo di ricerca delle informazioni
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/networks/cop/13
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/networks/{dbId}/{netId}")
	public void getNetwork(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("netId") final String netId,
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate) {
		runTask(new ServiceTask("GET /networks/" + dbId + "/" + netId + BEGINDATE_EQ + beginDate + ENDDATE_EQ + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkNetworkAllowed(basic, auth, netId, false, false);
				return getAnagraphCache(dbId).getNetwork(netId, param2DateObj(beginDate, BEGIN_DATE),
						param2DateObj(endDate, END_DATE));
			}
		});
	}

	// Restituisce l'elenco dei nomi delle stazioni appartenenti ad una rete di
	// monitoraggio
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {netId}: identificatore dell'oggetto rete
	// "beginDate": data di inizio del periodo di ricerca delle informazioni
	// "endDate": data di fine del periodo di ricerca delle informazioni
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/networks/cop/13/stationnames
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/networks/{dbId}/{netId}/stationnames")
	public void getStationNamesForNetwork(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("netId") final String netId,
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate) {
		runTask(new ServiceTask("GET /networks/" + dbId + "/" + netId + "/stationnames" + BEGINDATE_EQ + beginDate
				+ ENDDATE_EQ + endDate, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkNetworkAllowed(basic, auth, netId, false, false);
				return getAnagraphCache(dbId).getStationNamesForNetwork(netId, param2DateObj(beginDate, BEGIN_DATE),
						param2DateObj(endDate, END_DATE), getUserCache(basic, auth), getAuthCache());
			}
		});
	}

	// Restituisce l'elenco dei nomi dei sensori (ovvero parametri misurati) della
	// stazione specificata
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {stationId}: identificatore dell'oggetto stazione (come ottenuto nell'elenco
	// dei nomi delle stazioni)
	// "beginDate": data di inizio del periodo di ricerca delle informazioni
	// "endDate": data di fine del periodo di ricerca delle informazioni
	// L'elenco dei nomi è completato dalle seguenti informazioni specifiche:
	// "measureUnitId": identificatore dell'unità di misura
	// "measurementPeriod": periodo di aggregazione del dato (tipicmante 60 minuti o
	// 1440 minuti)
	// "decimalDigits": numero di cifre decimali per la visualizzazione delle misure
	// "correctionSupported": true->correzione per taratura supportata, false->non
	// supportata
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/stations/cop/13.001008.801/sensornames
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/stations/{dbId}/{stationId}/sensornames")
	public void getSensorNamesForStation(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("stationId") final String stationId,
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate) {
		runTask(new ServiceTask("GET /stations/" + dbId + "/" + stationId + "/sensornames" + BEGINDATE_EQ + beginDate
				+ ENDDATE_EQ + endDate, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkStationAllowed(basic, auth, stationId, false, false);
				return getAnagraphCache(dbId).getSensorNamesForStation(stationId, param2DateObj(beginDate, BEGIN_DATE),
						param2DateObj(endDate, END_DATE), getUserCache(basic, auth), getAuthCache());
			}
		});
	}

	// Restituisce l'oggetto con tutte le informazioni relative ad una stazione di
	// monitoraggio
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {stationId}: identificatore dell'oggetto stazione
	// "beginDate": data di inizio del periodo di ricerca delle informazioni
	// "endDate": data di fine del periodo di ricerca delle informazioni
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/stations/cop/13.001008.801
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/stations/{dbId}/{stationId}")
	public void getStation(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("stationId") final String stationId,
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate) {
		runTask(new ServiceTask(
				"GET /stations/" + dbId + "/" + stationId + BEGINDATE_EQ + beginDate + ENDDATE_EQ + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkStationAllowed(basic, auth, stationId, false, false);
				return getAnagraphCache(dbId).getStation(stationId, param2DateObj(beginDate, BEGIN_DATE),
						param2DateObj(endDate, END_DATE));
			}
		});
	}

	// Restituisce l'oggetto con tutte le informazioni relative ad un sensore
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// "beginDate": data di inizio del periodo di ricerca delle informazioni
	// "endDate": data di fine del periodo di ricerca delle informazioni
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/sensors/cop/13.001008.801.21
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/sensors/{dbId}/{sensorId}")
	public void getSensor(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate) {
		runTask(new ServiceTask(
				"GET /sensors/" + dbId + "/" + sensorId + BEGINDATE_EQ + beginDate + ENDDATE_EQ + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAnagraphCache(dbId).getSensor(sensorId, param2DateObj(beginDate, BEGIN_DATE),
						param2DateObj(endDate, END_DATE));
			}
		});
	}

	// Restituisce un oggetto con le informazioni di sintesi di rete, stazione e
	// sensore
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/sensors/contextinfo/cop/13.001008.801.21
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/sensors/contextinfo/{dbId}/{sensorId}")
	public void getSensorContextInfo(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId) {
		runTask(new ServiceTask("GET /sensors/contextinfo/" + dbId + "/" + sensorId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAnagraphCache(dbId).getSensorContextInfo(sensorId, getUserCache(basic, auth), getAuthCache());
			}
		});
	}

	// Restituisce l'elenco dei sensori correlati con quello passato come argomento
	// {dbId}: identificatore del data base reg=regionale
	// {sensorId}: identificatore dell'oggetto sensore
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/sensors/related/reg/13.001272.801.01
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/sensors/related/{dbId}/{sensorId}")
	public void getRelatedSensors(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId) {
		runTask(new ServiceTask("GET /sensors/related/" + dbId + "/" + sensorId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAnagraphCache(dbId).getRelatedSensors(sensorId, getUserCache(basic, auth), getAuthCache());
			}
		});
	}

	// Le funzioni "/datalock" servono per gestire la mutua esclusione sulle serie
	// di dati da validare: rendono possibile impostare un oggetto di lock da parte
	// di un utente, per i dati del sensore specificato relativi all'anno
	// specificato. Solo se l'utente è il proprietario dell'oggetto di lock sarà
	// possibile effettuare l'operazione di scrittura dati da parte dell'utente
	// stesso. La presenza o meno di un oggetto di lock per i dati di un sensore non
	// ha implicazioni sulla possibilitàdi leggere tali dati.
	// L'oggetto di lock restituito dalle varie funzioni ha i seguenti campi:
	// - sensorId: identifica in modo univoco il sensore a cui si riferisce il lock
	// - year: identifica l'anno a cui si riferisce il lock
	// - userId: identifica l'utente che possiede il lock, vale null se non c'è il
	// lock
	// - date: la data in cui è stato fatto il lock, espressa in millisicondi
	// - locked: vale 'true' se la risorsa è in stato locked, 'false' altrimenti
	// - myLock: vale 'true' se il lock appartiene all'utente che ha fatto la
	// richiesta, 'false' altrimenti

	// Restituisce lo stato del lock per un dato sensore
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {year}: anno
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21/2022
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datalock/{dbId}/{sensorId}/{year}")
	public void getDataLock(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("year") final String year) {
		runTask(new ServiceTask("GET /datalock/" + dbId + "/" + sensorId + "/" + year, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, true);
				return readLock(basic, auth, dbId, sensorId, param2int(year, YEAR));
			}
		});
	}

	// Cerca di ottenere il lock per un dato sensore
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {year}: anno
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21/2022
	@PUT
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datalock/{dbId}/{sensorId}/{year}")
	public void setDataLock(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("year") final String year) {
		runTask(new ServiceTask("PUT /datalock/" + dbId + "/" + sensorId + "/" + year, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				checkSensorAllowedAdvancedOrWrite(basic, auth, sensorId);
				return setLock(basic, auth, dbId, sensorId, param2int(year, YEAR));
			}
		});
	}

	// Rilascia tutti i lock appartenenti all'utente
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// Esempio: https://<server_name>/ariaweb/airvalidsrv/datalock/cop
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datalock/{dbId}")
	public void deleteDataLock(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("DELETE /datalock/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				return clearAllLocks(basic, auth, dbId);
			}
		});
	}

	// Rilascia il lock per un dato sensore e anno
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {year}: anno
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datalock/cop/13.001272.803.21/2022
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datalock/{dbId}/{sensorId}/{year}")
	public void deleteDataLock(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("year") final String year) {
		runTask(new ServiceTask("DELETE /datalock/" + dbId + "/" + sensorId + "/" + year, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				return clearLock(basic, auth, dbId, sensorId, param2int(year, YEAR));
			}
		});
	}

	// Il formato dei dati previsto dalle funzioni di lettura e scrittura delle
	// misure è il seguente:
	// - timestamp: il timestamp della misura in ms
	// - id_aggregazione:
	// - valore_validato: valore della misura validata, può essere diverso dal
	// valore_originale
	// - valore_originale: valore misurato dallo strumento di misura, non deve mai
	// essere mdificato
	// - tipologia_validaz: codice generato dal software di validazione automatica
	// - flag_validaz_autom: codice che indica se la misura è valida per il
	// validatore automatico ('0' misura valida, '1' misura non valida, null
	// validazione automatica non eseguita)
	// - validity_flag: flag di validità della misura
	// - verification_flag: flag relativo al livello di verifica effettuato sulla
	// misura
	// - da_rivedere: indica se sia necessario ricontrollare la validazione della
	// misura
	// - data_agg: data di ultima modifica della misura, intesa come l'insieme di
	// tutti i campi sopra citati

	// Restituisce le misure presenti nel database per il sensore e il periodo
	// specificati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// "endDate": data di fine del periodo di ricerca delle misure (opzionale)
	// "period_m": periodo di aggregazione delle misure (es. 60 minuti); serve per
	// non leggere eventuali misure con il timestamp incoerente con il periodo di
	// aggregazione e per creare misure fittizie senza valore e con codice dato
	// mancante, qualora non fossero presenti una o più misure nel periodo richiesto
	// (questo garantisce che il numero di misure ottenuto sia coerente con
	// l'ampiezza del periodo richiesto)
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/data/cop/13.001272.803.21/1669762800000?endDate=1669849200000&period_m=60
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/data/{dbId}/{sensorId}/{beginDate}")
	public void getData(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate,
			@QueryParam("period_m") final String period_m) {
		runTask(new ServiceTask("GET /data/" + dbId + "/" + sensorId + "/" + beginDate + ENDDATE_EQ + endDate + ", "
				+ PERIOD_M_EQ + period_m, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAirDbServiceClient(dbId).getData(sensorId, param2LongObj(beginDate, BEGIN_DATE),
						param2LongObj(endDate, END_DATE), param2IntegerObj(period_m, PERIOD_MINUTES));
			}
		});
	}

	// Scrive nella banca fati l'elenco delle misure passato come parametro
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/data/cop/13.001272.803.21
	@PUT
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/data/{dbId}/{sensorId}")
	public void writeData(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			final List<Measure> listMeasure) {
		runTask(new ServiceTask("PUT /data/" + dbId + "/" + sensorId, asyncResponse) {
			@Override
			public Object execute() throws AuthException, LockException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, true);
				if (listMeasure == null || listMeasure.isEmpty())
					return 0;
				boolean advanced = needsAdvancedAttribute(listMeasure);
				checkSensorAllowed(basic, auth, sensorId, advanced, true);
				long begin = -1;
				long end = begin;
				long mTime;
				for (Measure m : listMeasure) {
					mTime = m.getTimestamp().getTime();
					if (begin == -1) {
						begin = mTime;
						end = mTime;
					} else {
						begin = Math.min(mTime, begin);
						end = Math.max(mTime, end);
					}
				}
				checkLock(basic, auth, dbId, sensorId, begin, end);
				return getAirDbServiceClient(dbId).writeData(sensorId, listMeasure);
			}
		});
	}

	private boolean needsAdvancedAttribute(List<Measure> listMeasure) {
		boolean advanced = false;
		for (Measure m : listMeasure) {
			if (m.getVerification_flag() != null && m.getVerification_flag() == DBConstants.VERIFICATION_FINAL) {
				advanced = true;
				break;
			}
		}
		return advanced;
	}

	// Imposta il flag di certificazione per il sensore e il periodo specificati.
	// Una volta che il flag di certificazione è impostato, non può essere più
	// cancellato usando le API di questo webservice.
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure (opzionale)
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/data/certification/cop/13.001272.803.21/1669762800000/1669849200000
	@PUT
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/data/certification/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void setCertification(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask("PUT /data/certification/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException, LockException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, true, false);
				checkSensorAllowed(basic, auth, sensorId, true, false);
				long begin = param2long(beginDate, BEGIN_DATE);
				long end = param2long(endDate, END_DATE);
				checkLock(basic, auth, dbId, sensorId, begin, end);
				return getAirDbServiceClient(dbId).setCertification(sensorId, begin, end, "true");
			}
		});
	}

	// Imposta il flag di dato da rivedere per il sensore e il periodo specificati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/data/toreviewflag/cop/13.001272.803.21/1669762800000/1669849200000
	@PUT
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/data/toreviewflag/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void setToReviewFlag(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate,
			final String review) {
		runTask(new ServiceTask("PUT /data/toreviewflag/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate
				+ ", review=" + review, asyncResponse) {
			@Override
			public Object execute() throws AuthException, LockException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				checkSensorAllowedAdvancedOrWrite(basic, auth, sensorId);
				long begin = param2long(beginDate, BEGIN_DATE);
				long end = param2long(endDate, END_DATE);
				checkLock(basic, auth, dbId, sensorId, begin, end);
				return getCopDbServiceClient().setToReviewFlag(sensorId, begin, end,
						"" + param2boolean(review, "Review"));
			}
		});
	}

	// Restituisce le misure presenti nel database per il sensore e il periodo
	// specificati, utilizzando un oggetto con numero minimo di campi (timestamp e
	// valore_validato).
	// Le misure restituite avranno almeno il livello di 'verifica' richiesto
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// "endDate": data di fine del periodo di ricerca delle misure (opzionale)
	// "period_m": periodo di aggregazione delle misure (es. 60 minuti, ozionale)
	// "verificationLevel": livello minimo di verifica richiesto (opzionale, il
	// livello di default è quello massimo)
	// Esempio
	// https://<server_name>/ariaweb/airvalidsrv/validdata/cop/13.001272.803.21/1669762800000?endDate=1669849200000&period_m=60
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/validdata/{dbId}/{sensorId}/{beginDate}")
	public void getValidData(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate,
			@QueryParam("period_m") final String period_m,
			@QueryParam("verificationLevel") final String verificationLevel) {
		runTask(new ServiceTask("GET /validdata/" + dbId + "/" + sensorId + "/" + beginDate + ENDDATE_EQ + endDate
				+ ", " + PERIOD_M_EQ + period_m + ", " + VERIFICATIONLEVEL_EQ + verificationLevel, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAirDbServiceClient(dbId).getValidData(sensorId, param2LongObj(beginDate, BEGIN_DATE),
						param2LongObj(endDate, END_DATE), param2IntegerObj(period_m, PERIOD_MINUTES),
						param2ShortObj(verificationLevel, VERIFICATION_LEVEL));
			}
		});
	}

	// Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che
	// non hanno il flag di certificazione impostato.
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/notcertified/cop/13.001272.803.21/1669762800000/1669849200000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datatimestamps/notcertified/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void getNotCertifiedDataTimestamps(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask(
				"GET /timestamps/notcertified/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAirDbServiceClient(dbId).getNotCertifiedDataTimestamps(sensorId,
						param2LongObj(beginDate, BEGIN_DATE), param2LongObj(endDate, END_DATE));
			}
		});
	}

	// Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che
	// hanno il flag 'da rivedere' impostato a 'true' per il sensore e periodo
	// specificati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/toreview/cop/13.001272.803.21/1669762800000/1669849200000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datatimestamps/toreview/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void getToReviewDataTimestamps(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask("GET /timestamps/toreview/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAirDbServiceClient(dbId).getToReviewDataTimestamps(sensorId,
						param2LongObj(beginDate, BEGIN_DATE), param2LongObj(endDate, END_DATE));
			}
		});
	}

	// Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che
	// non sono ancora state validate per il sensore e periodo specificati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/notvalidated/cop/13.001272.803.21/1669762800000/1669849200000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datatimestamps/notvalidated/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void getNotValidatedDataTimestamps(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask(
				"GET /timestamps/notvalidated/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAirDbServiceClient(dbId).getNotValidatedDataTimestamps(sensorId,
						param2LongObj(beginDate, BEGIN_DATE), param2LongObj(endDate, END_DATE));
			}
		});
	}

	// Restituisce l'elenco dei timestamp delle misure presenti nella banca dati che
	// sono state validate come valide pur avendo il valore_validato impostato a
	// null, per il sensore e periodo specificati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/validnovalue/cop/13.001272.803.21/1669762800000/1669849200000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datatimestamps/validnovalue/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void getValidNoValueDataTimestamps(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask(
				"GET /timestamps/validnovalue/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAirDbServiceClient(dbId).getValidNoValueDataTimestamps(sensorId,
						param2LongObj(beginDate, BEGIN_DATE), param2LongObj(endDate, END_DATE));
			}
		});
	}

	// Restituisce l'elenco dei timestamp delle misure che non sono presenti nella
	// banca dati (nemmeno come dato di tipo mancante) per il sensore e periodo
	// specificati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure
	// {period_m}: periodo di aggregazione delle misure
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/notcompleted/cop/13.001272.803.21/1669762800000/1669849200000/60
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datatimestamps/notcompleted/{dbId}/{sensorId}/{beginDate}/{endDate}/{period_m}")
	public void getNotCompletedDataTimestamps(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate,
			@PathParam("period_m") final String period_m) {
		runTask(new ServiceTask("GET /timestamps/notcompleted/" + dbId + "/" + sensorId + "/" + beginDate + "/"
				+ endDate + "/" + period_m, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAirDbServiceClient(dbId).getNotCompletedDataTimestamps(sensorId,
						param2LongObj(beginDate, BEGIN_DATE), param2LongObj(endDate, END_DATE),
						param2IntegerObj(period_m, PERIOD_MINUTES));
			}
		});
	}

	// Restituisce l'elenco delle calibrazioni effettuate sullo strumento che misura
	// il sensore specificato
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// NOTA: le informazioni relative alle misure vengono lette dal data base
	// specificato, quelle relative
	// alle calibrazioni vengono lette sempre dal data base regionale
	// {sensorId}: identificatore dell'oggetto sensore
	// "beginDate": data di inizio del periodo di ricerca (opzionale)
	// "endDate": data di fine del periodo di ricerca (opzionale)
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/calibrations/reg/13.001272.803.21?beginDate=1669762800000&endDate=1669849200000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/calibrations/{dbId}/{sensorId}")
	public void getCalibrations(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate) {
		runTask(new ServiceTask(
				"GET /calibrations/" + dbId + "/" + sensorId + BEGINDATE_EQ + beginDate + ENDDATE_EQ + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				List<CalibrationInfo> listResult = new ArrayList<CalibrationInfo>();
				List<Calibration> listCalibrations = getAirDbServiceClient("reg").getCalibrations(
						Utils.removeNetId(sensorId), param2LongObj(beginDate, BEGIN_DATE),
						param2LongObj(endDate, END_DATE));
				for (Calibration cal : listCalibrations) {
					Date begin = DataUtils.thisDay(cal.getBeginDate());
					Date end = DataUtils.thisDay(cal.getEndDate());
					List<Measure> listMeasureBegin = getAirDbServiceClient(dbId).getData(sensorId, begin.getTime(),
							DataUtils.nextDay(begin).getTime(), null);
					List<Measure> listMeasureEnd;
					if (begin.equals(end))
						listMeasureEnd = listMeasureBegin;
					else
						listMeasureEnd = getAirDbServiceClient(dbId).getData(sensorId, end.getTime(),
								DataUtils.nextDay(end).getTime(), null);
					CalibrationInfo calInfo = new CalibrationInfo(cal);
					Date firstCalTs = getFirstCalibrationTimestamp(listMeasureBegin);
					Date lastCalTs = getLastCalibrationTimestamp(listMeasureEnd);
					if (firstCalTs != null)
						calInfo.setBeginDate(firstCalTs);
					if (lastCalTs != null)
						calInfo.setEndDate(lastCalTs);
					calInfo.setTimeFound(firstCalTs != null && lastCalTs != null);
					listResult.add(calInfo);
				}
				return listResult;
			}
		});
	}

	// Effettua la correzione delle misure sul periodo specificato, usando le
	// informazioni delle calibrazioni
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// NOTA: le informazioni relative alle misure vengono lette dal data base
	// specificato, quelle relative
	// alle calibrazioni vengono lette sempre dal data base regionale
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di correzione
	// {endDate}: data di fine del periodo di correzione
	// NOTA: le date di inizo e fine devono essere nello stesso giorno di due
	// calibrazioni distinte e non
	// vi devono essere altre calibrazioni all'interno del periodo specificato
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/calibrations/measurecorrection/cop/13.001272.803.21/1669762800000/1669849200000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/calibrations/measurecorrection/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void doMeasureCorrection(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask(
				"GET /calibrations/measurecorrection/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AppException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				Date begin = param2DateObj(beginDate, BEGIN_DATE);
				Date end = param2DateObj(endDate, END_DATE);
				Calibration calEnd = getEndCalibration(sensorId, begin, end);
				Sensor sensor = getAnagraphCache(dbId).getSensor(sensorId, begin, end);
				Integer regTime_m = sensor.getRecords().get(0).getTempo_registrazione();
				List<Measure> listMeasure = getAirDbServiceClient(dbId).getData(sensorId, begin.getTime(),
						end.getTime(), regTime_m);
				List<MeasureValue> listCorrectedValues = new ArrayList<MeasureValue>(listMeasure.size());
				if (MeasureCorrector.NO2_ID.equals(sensor.getId_parametro())) {
					String noSensorId = new MeasureKey(Utils.extractNetId(sensorId), sensor.getCodice_istat_comune(),
							sensor.getProgr_punto_com(), MeasureCorrector.NO_ID).key();
					Calibration calEndNO = getEndCalibration(noSensorId, begin, end);
					if (!calEndNO.getEndDate().equals(calEnd.getEndDate()))
						throw new AppException("NO and NO2 calibration end date mismatch");
					List<Measure> listMeasureNO = getAirDbServiceClient(dbId).getData(noSensorId, begin.getTime(),
							end.getTime(), regTime_m);
					if (listMeasure.size() != listMeasureNO.size())
						throw new AppException("NO and NO2 measure list size mismatch");
					Iterator<Measure> itNO2 = listMeasure.iterator();
					Iterator<Measure> itNO = listMeasureNO.iterator();
					while (itNO2.hasNext() && itNO.hasNext()) {
						Measure no2 = itNO2.next();
						Measure no = itNO.next();
						listCorrectedValues.add(corrector.applyCorrectionNO2(no2, no, calEnd, calEndNO));
					}
				} else {
					for (Measure m : listMeasure)
						listCorrectedValues.add(corrector.applyCorrection(sensor.getId_parametro(), m, calEnd));
				}
				return listCorrectedValues;
			}
		});
	}

	private Calibration getEndCalibration(String sensorId, Date begin, Date end) throws AppException {
		SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy HH:mm");
		String target = "'" + sensorId + " [" + sdf.format(begin) + " - " + sdf.format(end) + "]'";
		List<Calibration> listCalibrations = getAirDbServiceClient("reg").getCalibrations(Utils.removeNetId(sensorId),
				DataUtils.thisDay(begin).getTime(), end.getTime());
		if (listCalibrations.isEmpty())
			throw new AppException("No calibrations found for the specified sensor and period " + target);
		if (listCalibrations.size() == 1)
			throw new AppException("Only one calibration found for the specified sensor and period " + target);
		if (listCalibrations.size() > 2)
			throw new AppException("More than two calibrations found for the specified sensor and period " + target);
		Calibration calEnd = listCalibrations.get(1);
		if (calEnd.getZero() == null)
			throw new AppException("Calibration information has no zero value " + target);
		if (calEnd.getSpan() == null)
			throw new AppException("Calibration information has no span value " + target);
		if (calEnd.getCylinderConcentration() == null)
			throw new AppException("Calibration information has no cylinder concentration " + target);
		return calEnd;
	}

	// Effettua l'elaborazione specificata utilizzando le misure presenti nel
	// database
	// per il sensore e il periodo specificati
	// {type}: tipologia dell'elaborazione da effettuare
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}": data di fine del periodo di ricerca delle misure
	// "period_m": periodo di aggregazione delle misure (es. 60 minuti); serve per
	// non leggere eventuali misure con il timestamp incoerente con il periodo di
	// aggregazione e per creare misure fittizie senza valore e con codice dato
	// mancante, qualora non fossero presenti una o più misure nel periodo richiesto
	// (questo garantisce che il numero di misure ottenuto sia coerente con
	// l'ampiezza del periodo richiesto)
	// "verificationLevel": livello minimo di verifica richiesto per le misure da
	// utilizzare (opzionale, il livello di default è quello massimo)
	// "decimalDigits": numero di cifre decimali da usare per l'arrotondamento
	// finale dei risultati (opzionale)
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/elaboration/datasplitbyday/cop/13.001272.803.04/1672527600000/1680303600000?period_m=60&verificationLevel=3&decimalDigits=1
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/elaboration/{type}/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void doElaboration(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("type") final String type, @PathParam("dbId") final String dbId,
			@PathParam("sensorId") final String sensorId, @PathParam("beginDate") final String beginDate,
			@PathParam("endDate") final String endDate, @QueryParam("period_m") final String period_m,
			@QueryParam("verificationLevel") final String verificationLevel,
			@QueryParam("decimalDigits") final String decimalDigits) {
		runTask(new ServiceTask("GET /elaboration/" + type + "/" + dbId + "/" + sensorId + "/" + beginDate + ENDDATE_EQ
				+ endDate + ", " + PERIOD_M_EQ + period_m + ", " + VERIFICATIONLEVEL_EQ + verificationLevel
				+ DECIMAL_DIGITS_EQ + decimalDigits, asyncResponse) {
			@Override
			public Object execute() throws AuthException, ElaborationException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				int _period_m = param2IntegerObj(period_m, PERIOD_MINUTES);
				short _verificationLevel = param2ShortObj(verificationLevel, VERIFICATION_LEVEL);
				Integer _decimalDigits = param2IntegerObj(decimalDigits, DECIMAL_DIGITS);
				Date _beginDate = param2DateObj(beginDate, BEGIN_DATE);
				Date _endDate = param2DateObj(endDate, END_DATE);
				ElaborationItf elab;
				switch (type) {
				case DailyMeanElaboration.ID:
					elab = new DailyMeanElaboration("Calcolo media giornaliera");
					break;
				case TimelyMeanElaboration.ID:
					elab = new TimelyMeanElaboration("Calcolo media per ora");
					break;
				case HourlyMeanElaboration.ID:
					elab = new HourlyMeanElaboration("Calcolo media oraria");
					break;
				case SlidingMeanElaboration.ID:
					elab = new SlidingMeanElaboration("Calcolo media mobile");
					break;
				case GlobalMeanElaboration.ID:
					elab = new GlobalMeanElaboration("Calcolo media globale");
					break;
				case DailyMaximumElaboration.ID:
					elab = new DailyMaximumElaboration("Calcolo massimo giornaliero");
					break;
				case DailyMinimumElaboration.ID:
					elab = new DailyMinimumElaboration("Calcolo minimo giornaliero");
					break;
				case DailyMaximumMinimumRatioElaboration.ID:
					elab = new DailyMaximumMinimumRatioElaboration("Calcolo rapporto massimo minimo");
					break;
				case DayTimelyMaximumElaboration.ID:
					elab = new DayTimelyMaximumElaboration("Calcolo massimo orario");
					break;
				case DayTimelyMinimumElaboration.ID:
					elab = new DayTimelyMinimumElaboration("Calcolo minimo orario");
					break;
				case TimelyMaximumAbsoluteElaboration.ID:
					elab = new TimelyMaximumAbsoluteElaboration("Calcolo massimo assoluto per ora");
					break;
				case TimelyMinimumAbsoluteElaboration.ID:
					elab = new TimelyMinimumAbsoluteElaboration("Calcolo minimo assoluto per ora");
					break;
				case AbsMaximumElaboration.ID:
					elab = new AbsMaximumElaboration("Calcolo massimo assoluto");
					break;
				case AbsMinimumElaboration.ID:
					elab = new AbsMinimumElaboration("Calcolo minimo assoluto");
					break;
				case DailyStdDevElaboration.ID:
					elab = new DailyStdDevElaboration("Calcolo deviazione standard giornaliera");
					break;
				case DailyVarCoeffElaboration.ID:
					elab = new DailyVarCoeffElaboration("Calcolo coefficiente di variazione giornaliero");
					break;
				case DailyDifferencesElaboration.ID:
					elab = new DailyDifferencesElaboration("Calcolo differenze giornaliere");
					break;
				case DifferencesElaboration.ID:
					elab = new DifferencesElaboration("Calcolo differenze orarie");
					break;
				case TimelyFreqElaboration.ID:
					elab = new TimelyFreqElaboration("Calcolo frequenza per ora");
					break;
				case ScalingElaboration.ID:
					elab = new ScalingElaboration("Calcolo scalatura");
					break;
				case HourlyScalingElaboration.ID:
					elab = new HourlyScalingElaboration("Calcolo scalatura da medie orarie");
					break;
				case DailyScalingElaboration.ID:
					elab = new DailyScalingElaboration("Calcolo scalatura da medie giornaliere");
					break;
				case WeekTimelyMeanElaboration.ID:
					elab = new WeekTimelyMeanElaboration("Calcolo media per ora sulla settimana");
					break;
				case WorkingTimelyMeanElaboration.ID:
					elab = new WorkingTimelyMeanElaboration("Calcolo media per ora lavorativa");
					break;
				case SaturdayTimelyMeanElaboration.ID:
					elab = new SaturdayTimelyMeanElaboration("Calcolo media per ora del sabato");
					break;
				case HolidayTimelyMeanElaboration.ID:
					elab = new HolidayTimelyMeanElaboration("Calcolo media per ora festiva");
					break;
				case WorkingSatReductionElaboration.ID:
					elab = new WorkingSatReductionElaboration("Calcolo riduzione lavorativo/sabato");
					break;
				case WorkingHolidayReductionElaboration.ID:
					elab = new WorkingHolidayReductionElaboration("Calcolo riduzione lavorativo/festivo");
					break;
				case WorkingSatMaxDailyReductionElaboration.ID:
					elab = new WorkingSatMaxDailyReductionElaboration("Calcolo riduzione massimo lavorativo/sabato");
					break;
				case WorkingHolidayMaxDailyReductionElaboration.ID:
					elab = new WorkingHolidayMaxDailyReductionElaboration(
							"Calcolo riduzione massimo lavorativo/festivo");
					break;
				case "dailymeanmaxmin":
					elab = new ElaborationGroup("dailymeanmaxmin", "Calcolo media,massimo,minimo giornalieri",
							new DailyMeanElaboration("Media giornaliera"),
							new DailyMaximumElaboration("Massimo giornaliero"),
							new DailyMinimumElaboration("Minimo giornaliero"));
					break;
				case "hourlymeanmaxmin":
					elab = new ElaborationGroup("hourlymeanmaxmin", "Calcolo media,massimo,minimo per ora",
							new TimelyMeanElaboration("Media per ora"),
							new TimelyMaximumAbsoluteElaboration("Massimo assoluto per ora"),
							new TimelyMinimumAbsoluteElaboration("Minimo assoluto per ora"));
					break;
				case "meanbyhourforworksaturdayholidaydays":
					elab = new ElaborationGroup("meanbyhourforworksaturdayholidaydays",
							"Media per ora giorni lavorativi,sabato,festivi",
							new WorkingTimelyMeanElaboration("Media per ora lavorativa"),
							new SaturdayTimelyMeanElaboration("Media per ora del sabato"),
							new HolidayTimelyMeanElaboration("Media per ora festiva"));
					break;
				case "datasplitbyday":
					elab = new TimeSplitElaborationFactory("datasplitbyday", "Dati suddivisi per giorno",
							SplitPeriod.DAY);
					break;
				case "datasplitbymonth":
					elab = new TimeSplitElaborationFactory("datasplitbymonth", "Dati suddivisi per mese",
							SplitPeriod.MONTH);
					break;
				case "datasplitbyyear":
					elab = new TimeSplitElaborationFactory("datasplitbyyear", "Dati suddivisi per anno",
							SplitPeriod.YEAR);
					break;
				default:
					throw new ElaborationException("No elaboration available with name '" + type + "'");
				}
				List<MeasureValue> data = dataCache.getData(dbId, sensorId, _beginDate.getTime(), _endDate.getTime(),
						_period_m, _verificationLevel);
				ElaborationResultHolder resultHolder = new ElaborationResultHolder(elab.getId(), elab.getName());
				elab.setTimeInterval(_beginDate, _endDate);
				for (Elaboration e : elab.getElaborations())
					resultHolder.addResult(e.compute(data, _period_m, _decimalDigits));
				return resultHolder;
			}
		});
	}

	// Restituisce una preferenza applicativa memorizzata nella banca dati per
	// l'utente corrente
	// Attualmente le preferenze possono essere memorizzate solo nella banca dati
	// regionale
	// {dbId}: identificatore del data base reg=regionale
	// {group_id}: nome del gruppo a cui appartiene la preferenza
	// {id}: identificatore della preferenza
	// L'oggetto JSON restituito ha i seguenti campi
	// - groupId: nome del gruppo a cui appartiene la preferenza
	// - id: identificatore della preferenza
	// - type: tipo del valore: 1=integer, 2=double, 3=boolean, 4=string
	// - value: valore della preferenza (può essere null)
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova/prova01
	// valore restituito:
	// {"groupId":"gruppo_prova","id":"prova01","type":4,"value":"valore_di_esempio"}
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/preferences/{dbId}/{group_id}/{id}")
	public void getPreference(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("group_id") final String group_id,
			@PathParam("id") final String id) {
		runTask(new ServiceTask(GET_PREFERENCES + dbId + "/" + group_id + "/" + id, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				Preference p = getAirDbServiceClient(dbId).getPreference(APPLICATION_ID, group_id, id, user_id);
				return new AppPreference(p.getId_gruppo_informazione(), p.getId_informazione(),
						p.getTipo_informazione(), p.getInformazione());
			}
		});
	}

	// Restituisce tutte le preferenze applicative memorizzate nella banca dati per
	// l'utente corrente e il gruppo di preferenze specificato
	// Attualmente le preferenze possono essere memorizzate solo nella banca dati
	// regionale
	// {dbId}: identificatore del data base reg=regionale
	// {group_id}: nome del gruppo a cui appartiene la preferenza
	// L'oggetto JSON restituito ha i seguenti campi
	// - groupId: nome del gruppo a cui appartiene la preferenza
	// - id: identificatore della preferenza
	// - type: tipo del valore: 1=integer, 2=double, 3=boolean, 4=string
	// - value: valore della preferenza (può essere null)
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/preferences/{dbId}/{group_id}")
	public void getPreferences(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("group_id") final String group_id) {
		runTask(new ServiceTask(GET_PREFERENCES + dbId + "/" + group_id, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				return convert(getAirDbServiceClient(dbId).getPreferences(APPLICATION_ID, group_id, user_id));
			}
		});
	}

	// Restituisce tutte le preferenze applicative memorizzate nella banca dati per
	// l'utente corrente
	// Attualmente le preferenze possono essere memorizzate solo nella banca dati
	// regionale
	// {dbId}: identificatore del data base reg=regionale
	// L'oggetto JSON restituito ha i seguenti campi
	// - groupId: nome del gruppo a cui appartiene la preferenza
	// - id: identificatore della preferenza
	// - type: tipo del valore: 1=integer, 2=double, 3=boolean, 4=string
	// - value: valore della preferenza (può essere null)
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/preferences/reg
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/preferences/{dbId}")
	public void getPreferences(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask(GET_PREFERENCES + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				return convert(getAirDbServiceClient(dbId).getPreferences(APPLICATION_ID, user_id));
			}
		});
	}

	// Inserisce una preferenza applicativa memorizzata nella banca dati per
	// l'utente corrente
	// Attualmente le preferenze possono essere memorizzate solo nella banca dati
	// regionale
	// {dbId}: identificatore del data base reg=regionale
	// {group_id}: nome del gruppo a cui appartiene la preferenza
	// {id}: identificatore della preferenza
	// L'oggetto JSON da inviare al server deve avere i seguenti campi
	// - type: tipo del valore: 1=integer, 2=double, 3=boolean, 4=string
	// - value: (opzionale) valore della preferenza
	// Esempio:
	// {"type":4,"value":"valore_di_esempio"}
	// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova/prova01
	// valore restituito:
	// numero di oggetti inseriti in banca dati
	@PUT
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/preferences/{dbId}/{group_id}/{id}")
	public void savePreference(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("group_id") final String group_id,
			@PathParam("id") final String id, final AppPreference preference) {
		runTask(new ServiceTask(GET_PREFERENCES + dbId + "/" + group_id + "/" + id, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				Preference p = new Preference(APPLICATION_ID, group_id, id, user_id, preference.getType(),
						preference.getValue());
				return getAirDbServiceClient(dbId).savePreference(p);
			}
		});
	}

	// Cancella una preferenza applicativa memorizzata nella banca dati per
	// l'utente corrente
	// Attualmente le preferenze possono essere memorizzate solo nella banca dati
	// regionale
	// {dbId}: identificatore del data base reg=regionale
	// {group_id}: nome del gruppo a cui appartiene la preferenza
	// {id}: identificatore della preferenza
	// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova/prova01
	// valore restituito:
	// numero di oggetti cancellati dalla banca dati
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/preferences/{dbId}/{group_id}/{id}")
	public void deletePreference(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("group_id") final String group_id,
			@PathParam("id") final String id) {
		runTask(new ServiceTask(DELETE_PREFERENCES + dbId + "/" + group_id + "/" + id, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				return getAirDbServiceClient(dbId).deletePreference(APPLICATION_ID, group_id, id, user_id);
			}
		});
	}

	// Cancella le preferenze applicative memorizzate nella banca dati per
	// l'utente corrente e il gruppo specificato
	// Attualmente le preferenze possono essere memorizzate solo nella banca dati
	// regionale
	// {dbId}: identificatore del data base reg=regionale
	// {group_id}: nome del gruppo a cui appartiene la preferenza
	// https://<server_name>/ariaweb/airvalidsrv/preferences/reg/gruppo_prova
	// valore restituito:
	// numero di oggetti cancellati dalla banca dati
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/preferences/{dbId}/{group_id}")
	public void deletePreferences(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("group_id") final String group_id) {
		runTask(new ServiceTask(DELETE_PREFERENCES + dbId + "/" + group_id, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				return getAirDbServiceClient(dbId).deletePreferences(APPLICATION_ID, group_id, user_id);
			}
		});
	}

	// Cancella le preferenze applicative memorizzate nella banca dati per
	// l'utente corrente
	// Attualmente le preferenze possono essere memorizzate solo nella banca dati
	// regionale
	// {dbId}: identificatore del data base reg=regionale
	// https://<server_name>/ariaweb/airvalidsrv/preferences/reg
	// valore restituito:
	// numero di oggetti cancellati dalla banca dati
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/preferences/{dbId}")
	public void deletePreferences(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask(DELETE_PREFERENCES + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				return getAirDbServiceClient(dbId).deletePreferences(APPLICATION_ID, user_id);
			}
		});
	}

	// Legge la lista delle configurazioni degli insiemi di sensori selezionati per
	// l'utente corrente
	// Attualmente questo tipo di configurazione può essere memorizzato solo nella
	// banca dati regionale
	// {dbId}: identificatore del data base reg=regionale
	// https://<server_name>/ariaweb/airvalidsrv/datasetconfignames/reg
	// valore restituito:
	// La lista dei nomi delle configurazioni salvate
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datasetconfignames/{dbId}")
	public void getDatasetConfigNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("GET /datasetconfignames/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				return getAirDbServiceClient(dbId).getPreferenceNames(APPLICATION_ID, DATASET_CFG_GROUP, user_id);
			}
		});
	}

	// Legge la configurazione dell'insieme di sensori selezionati col nome dato per
	// l'utente corrente
	// Attualmente questo tipo di configurazione può essere memorizzato solo nella
	// banca dati regionale
	// {dbId}: identificatore del data base reg=regionale
	// {name}: nome della configurazione da leggere
	// https://<server_name>/ariaweb/airvalidsrv/datasetconfigs/reg/prova
	// valore restituito:
	// L'oggetto Json contenente la configurazione, i campi sono:
	// - "listSensorId": lista di identificatori dei sensori, nel formato usato
	// dalle altre funzioni del webservice
	// - "timeUnit": (opzionale)
	// - ____ TIMESTAMP (per date assolute espresse in millisecondi)
	// - ____ DAY (per date relative, in numero di giorni dal giorno corrente)
	// - ____ WEEK (per date relative, in numero di settimane dal giorno corrente)
	// - ____ MONTH (per date relative, in numero di mesi dal giorno corrente)
	// - ____ YEAR (per date relative, in numero di anni dal giorno corrente)
	// - ____ per le date in formato relativo usare numeri negativi per andare nel
	// ______ passato, es: beginTime=-3, endTime=-1 per selezionare il periodo che
	// ______ va da 3 giorni prima di oggi a ieri
	// - "beginTime": (opzionale) inizo dell'intervallo temporale
	// - "endTime": (opzionale) fine dell'intervallo temporale
	// - "activityType": (opzionale) tipo di attività es: validazione, export...
	// - "activityOptions": (opzionale) opzioni del tipo di attività
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datasetconfigs/{dbId}/{name}")
	public void getDatasetConfig(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("name") final String name) {
		runTask(new ServiceTask("GET /datasetconfigs/" + dbId + "/" + name, asyncResponse) {
			@Override
			public Object execute() throws AuthException, JsonParseException, JsonMappingException, IOException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				Preference p = getAirDbServiceClient(dbId).getPreference(APPLICATION_ID, DATASET_CFG_GROUP, name,
						user_id);
				if (p == null || p.getInformazione() == null || p.getInformazione().isEmpty())
					throw new NotFoundException(
							"No configuration found with name '" + name + "' for user '" + user_id + "'");
				ObjectMapper mapper = new ObjectMapper();
				return mapper.readValue(p.getInformazione(), DatasetConfig.class);
			}
		});
	}

	// Cancella la configurazione dell'insieme di sensori selezionati col nome dato
	// per l'utente corrente
	// Attualmente questo tipo di configurazione può essere memorizzato solo nella
	// banca dati regionale
	// {dbId}: identificatore del data base reg=regionale
	// {name}: nome della configurazione da cancellare
	// https://<server_name>/ariaweb/airvalidsrv/datasetconfigs/reg/prova
	// valore restituito:
	// numero di oggetti cancellati dalla banca dati
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datasetconfigs/{dbId}/{name}")
	public void deleteDatasetConfig(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("name") final String name) {
		runTask(new ServiceTask("DELETE /datasetconfigs/" + dbId + "/" + name, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				return getAirDbServiceClient(dbId).deletePreference(APPLICATION_ID, DATASET_CFG_GROUP, name, user_id);
			}
		});
	}

	// Salva la configurazione dell'insieme di sensori selezionati col nome dato per
	// l'utente corrente
	// Attualmente questo tipo di configurazione può essere memorizzato solo nella
	// banca dati regionale
	// {dbId}: identificatore del data base reg=regionale
	// {name}: nome della configurazione da salvare
	// La configurazione da salvare va passata nel body in Json, vedere funzione di
	// lettura per i dettagli
	// https://<server_name>/ariaweb/airvalidsrv/datasetconfigs/reg/prova
	// valore restituito:
	// numero di oggetti inseriti nella banca dati
	@PUT
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datasetconfigs/{dbId}/{name}")
	public void saveDatasetConfig(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("name") final String name,
			final DatasetConfig datasetConfig) {
		runTask(new ServiceTask("GET /datasetconfigs/" + dbId + "/" + name, asyncResponse) {
			@Override
			public Object execute() throws AuthException, JsonProcessingException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				String user_id = "" + getUserId(basic, auth);
				ObjectMapper mapper = new ObjectMapper();
				String jsonString = mapper.writeValueAsString(datasetConfig);
				return getAirDbServiceClient(dbId).savePreference(
						new Preference(APPLICATION_ID, DATASET_CFG_GROUP, name, user_id, 4, jsonString));
			}
		});
	}

	// Restituisce l'elenco dei codici di validazione presenti nella banca dati:
	// il campo 'code' contiene il codice di validazione
	// il campo 'description' contiene la descrizione
	// {dbId}: identificatore del data base cop=Arpa per validazione
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/validationcodes/cop
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/validationcodes/{dbId}")
	public void getValidationCodes(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("GET /validationcodes/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getAnagraphCache(dbId).getValidationCodes();
			}
		});
	}

	// Restituisce nome e cognome dell'utente corrente, se disponibile:
	// il campo 'firstName' contiene il nome
	// il campo 'lastName' contiene il cognome
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/userinfo
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/userinfo")
	public void getUsername(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth) {
		runTask(new ServiceTask("GET /userinfo", asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getCurrentUserInfo(basic, auth);
			}
		});
	}

}
