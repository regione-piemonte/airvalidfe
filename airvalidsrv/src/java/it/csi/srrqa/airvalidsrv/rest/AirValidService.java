/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.ListIterator;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.AsyncResponse;
import javax.ws.rs.container.Suspended;
import javax.ws.rs.core.MediaType;

import org.apache.log4j.Logger;

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
import it.csi.srrqa.airdb.model.NameWithKey;
import it.csi.srrqa.airdb.model.Preference;
import it.csi.srrqa.airdb.model.Sensor;
import it.csi.srrqa.airdb.model.SensorKey;
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
import it.csi.srrqa.airvalidsrv.rest.SensorId.MatchType;
import it.csi.srrqa.airvalidsrv.solr.ParametersStatsFields;
import it.csi.srrqa.airvalidsrv.solr.ResponseHolder;
import it.csi.srrqa.airvalidsrv.solr.Solr;
import it.csi.srrqa.airvalidsrv.solr.SolrAnagraphItem;
import it.csi.srrqa.airvalidsrv.solr.SolrSensorEvent;
import it.csi.srrqa.airvalidsrv.solr.StationsStatsFields;
import it.csi.srrqa.airvalidsrv.solr.Stats;
import it.csi.srrqa.airvalidsrv.specreport.ReportAnagraph;
import it.csi.srrqa.airvalidsrv.specreport.ReportAnagraph.ItemType;
import it.csi.srrqa.airvalidsrv.specreport.ReportFactory;
import it.csi.srrqa.airvalidsrv.specreport.SpecReport;
import it.csi.srrqa.reportisticalib.report.RangeValues;
import it.csi.srrqa.reportisticalib.report.ReportUtils;
import it.csi.srrqa.reportisticalib.report.ThresholdObject;
import it.csi.srrqa.reportisticalib.table.ReportResult;

@Path("/")
public class AirValidService extends RestService {

	private static final String BASIC_AUTH_HEADER = "Authorization";
	private static final String SHIB_AUTH_ID = "Shib-Identita-CodiceFiscale";
	private static final String PERIOD_MINUTES = "Period [minutes]";
	private static final String PERIOD_M_EQ = ", period_m=";
	private static final String BEGIN_YEAR = "Begin year";
	private static final String YEAR = "Year";
	private static final String YEAR_EQ = ", year=";
	private static final String DATE = "Date";
	private static final String END_YEAR = "End year";
	private static final String END_DATE = "End date";
	private static final String BEGIN_DATE = "Begin date";
	private static final String BEGINDATE_EQ = ", beginDate=";
	private static final String ENDDATE_EQ = ", endDate=";
	private static final String VERIFICATION_LEVEL = "Verification level";
	private static final String VERIFICATIONLEVEL_EQ = ", verificationLevel=";
	private static final String VALIDATED_DATA_ONLY_EQ = ", validatedDataOnly=";
	private static final String DECIMAL_DIGITS = "Decimal digits";
	private static final String DECIMAL_DIGITS_EQ = ", decimalDigits=";
	private static final String SENSOR_IDS_EQ = ", sensorIds=";
	private static final String LANGUAGE_EQ = ", language=";
	private static final String ITEM_TYPE_EQ = ", itemType=";
	private static final String ITEM_IDS_EQ = ", itemIds=";
	private static final String GET_PREFERENCES = "GET /preferences/";
	private static final String DELETE_PREFERENCES = "DELETE /preferences/";
	private static final String FN_VALIDAZIONE = UserCache.FUNCTION_VALIDAZIONE;
	private static final String FN_APP_ADMIN = UserCache.FUNCTION_APP_ADMIN;
	private static final Integer APPLICATION_ID = 3;
	private static final String DATASET_CFG_GROUP = "dataset_config";
	private static Logger lg = Logger
			.getLogger(AirValidApp.LOGGER_BASENAME + "." + AirValidService.class.getSimpleName());
	private MeasureCorrector corrector;
	private DataCache dataCache;

	public AirValidService(ServiceConfig airDbServiceCfg, ServiceConfig copDbServiceCfg, ServiceConfig authServiceCfg,
			ServiceConfig solrServiceCfg, boolean enableShibbolet, int measureLockTimeout_m,
			boolean disableTrustManager, MeasureCorrector corrector, List<ThresholdObject> listThresholds,
			List<RangeValues> listRangeValues, DataCache dataCache) {
		super(airDbServiceCfg, copDbServiceCfg, authServiceCfg, solrServiceCfg, enableShibbolet, measureLockTimeout_m,
				disableTrustManager, listThresholds, listRangeValues);
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

	// Restituisce l'elenco delle possibili tipologie di stazione
	// {dbId}: identificatore del data base reg=regionale Nota: cop non supportato
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/stationtypenames/reg
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/stationtypenames/{dbId}")
	public void getStationTypeNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("GET /stationtypenames/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getAnagraphCache(dbId).getStationTypeNames();
			}
		});
	}

	// Restituisce l'elenco delle possibili tipologie di zona in cui si trovano le stazioni
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/zonetypenames/reg
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/zonetypenames/{dbId}")
	public void getZoneTypeNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("GET /stationtypenames/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getAnagraphCache(dbId).getZoneTypeNames();
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
	// "ipaFilter": se vale true restituisce solo i parametri per i controlli IPA
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
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate,
			@QueryParam("ipaFilter") final String ipaFilter) {
		runTask(new ServiceTask("GET /stations/" + dbId + "/" + stationId + "/sensornames" + BEGINDATE_EQ + beginDate
				+ ENDDATE_EQ + endDate, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkStationAllowed(basic, auth, stationId, false, false);
				List<SensorNameWithKeyAndPeriod> listSensors = getAnagraphCache(dbId).getSensorNamesForStation(
						stationId, param2DateObj(beginDate, BEGIN_DATE), param2DateObj(endDate, END_DATE),
						getUserCache(basic, auth), getAuthCache());
				if (!"true".equalsIgnoreCase(ipaFilter))
					return listSensors;
				List<SensorNameWithKeyAndPeriod> filteredList = new ArrayList<>();
				for (SensorNameWithKeyAndPeriod item : listSensors) {
					if (Utils.isDailyDustSensor(item))
						filteredList.add(item);
				}
				return filteredList;
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
	// ha implicazioni sulla possibilità di leggere tali dati.
	// L'oggetto di lock restituito dalle varie funzioni ha i seguenti campi:
	// - sensorId: identifica in modo univoco il sensore a cui si riferisce il lock
	// - beginYear: identifica l'anno di inizio a cui si riferisce il lock
	// - endYear: identifica l'anno di fine a cui si riferisce il lock (può
	// coincidere con quello di inizio)
	// - userId: identifica l'utente che possiede il lock, vale null se non c'è il
	// lock
	// - contextId: identifica il contesto applicativo che possiede il lock, vale
	// null se non c'è il lock
	// - date: la data in cui è stato fatto il lock, espressa in millisicondi
	// - locked: vale 'true' se la risorsa è in stato locked, 'false' altrimenti
	// - myLock: vale 'true' se il lock appartiene all'utente e al contesto
	// applicativo che ha fatto la richiesta, 'false' altrimenti

	// Restituisce lo stato del lock per un dato sensore
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {contextId}: identificatore contesto applicativo
	// {sensorId}: identificatore dell'oggetto sensore
	// {year}: anno
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datalock/cop/xyz123/13.001272.803.21/2022
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datalock/{dbId}/{contextId}/{sensorId}/{year}")
	public void getDataLock(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("contextId") final String contextId,
			@PathParam("sensorId") final String sensorId, @PathParam("year") final String year) {
		runTask(new ServiceTask("GET /datalock/" + dbId + "/" + contextId + "/" + sensorId + "/" + year,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, true);
				return readLock(basic, auth, dbId, contextId, sensorId, param2int(year, YEAR));
			}
		});
	}

	// Cerca di ottenere il lock per un dato sensore
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {contextId}: identificatore contesto applicativo
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginYear}: anno di inizio
	// {endYear}: anno di fine
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datalock/cop/xyz123/13.001272.803.21/2022/2022
	@PUT
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datalock/{dbId}/{contextId}/{sensorId}/{beginYear}/{endYear}")
	public void setDataLock(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("contextId") final String contextId,
			@PathParam("sensorId") final String sensorId, @PathParam("beginYear") final String beginYear,
			@PathParam("endYear") final String endYear) {
		runTask(new ServiceTask(
				"PUT /datalock/" + dbId + "/" + contextId + "/" + sensorId + "/" + beginYear + "/" + endYear,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				checkSensorAllowedAdvancedOrWrite(basic, auth, sensorId);
				return setLock(basic, auth, dbId, contextId, sensorId, param2int(beginYear, BEGIN_YEAR),
						param2int(endYear, END_YEAR));
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

	// Rilascia i lock appartenenti all'utente relativi ad una data
	// applicazione/pagina
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {contextId}: identificatore contesto applicativo
	// Esempio: https://<server_name>/ariaweb/airvalidsrv/datalock/cop/xyz123
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datalock/{dbId}/{contextId}")
	public void deleteDataLock(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("contextId") final String contextId) {
		runTask(new ServiceTask("DELETE /datalock/" + dbId + "/" + contextId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				return clearLocks(basic, auth, dbId, contextId);
			}
		});
	}

	// Rilascia il lock per applicazione/pagina, sensore e anno
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {contextId}: identificatore contesto applicativo
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginYear}: anno di inizio
	// {endYear}: anno di fine
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datalock/cop/xyz123/13.001272.803.21/2022/2022
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/datalock/{dbId}/{contextId}/{sensorId}/{beginYear}/{endYear}")
	public void deleteDataLock(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("contextId") final String contextId,
			@PathParam("sensorId") final String sensorId, @PathParam("beginYear") final String beginYear,
			@PathParam("endYear") final String endYear) {
		runTask(new ServiceTask(
				"DELETE /datalock/" + dbId + "/" + contextId + "/" + sensorId + "/" + beginYear + "/" + endYear,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				return clearLock(basic, auth, dbId, contextId, sensorId, param2int(beginYear, BEGIN_YEAR),
						param2int(endYear, END_YEAR));
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
		runTask(new ServiceTask(
				"GET /data/" + dbId + "/" + sensorId + "/" + beginDate + ENDDATE_EQ + endDate + PERIOD_M_EQ + period_m,
				asyncResponse) {
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
				+ PERIOD_M_EQ + period_m + VERIFICATIONLEVEL_EQ + verificationLevel, asyncResponse) {
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

	// Restituisce le misure presenti nel database per il sensore e il periodo
	// specificati, utilizzando un oggetto con numero minimo di campi (timestamp e
	// valore_validato), suddivise per giorni
	// Le misure restituite avranno almeno il livello di 'verifica' richiesto
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore
	// {beginDate}: data di inizio del periodo di ricerca delle misure, allineata
	// alle 00:00
	// {endDate}": data di fine del periodo di ricerca delle misure, allineata alle
	// 00:00
	// "period_m": periodo di aggregazione delle misure (es. 60 minuti, ozionale)
	// "verificationLevel": livello minimo di verifica richiesto (opzionale, il
	// livello di default è quello massimo)
	// Se le date di inizio e fine non sono allineate alle 00:00 verranno allineate
	// automaticamente
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/validdata/daysplitted/cop/13.001272.803.21/1669762800000/1669849200000?period_m=60
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/validdata/daysplitted/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void getValidDataDaySplitted(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate,
			@QueryParam("period_m") final String period_m,
			@QueryParam("verificationLevel") final String verificationLevel) {
		runTask(new ServiceTask("GET /validdata/daysplitted/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate
				+ PERIOD_M_EQ + period_m + VERIFICATIONLEVEL_EQ + verificationLevel, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				Date begin = param2DateObj(beginDate, BEGIN_DATE);
				begin = DataUtils.thisDay(begin);
				Date end = param2DateObj(endDate, END_DATE);
				end = DataUtils.isMidnight(end) ? end : DataUtils.nextDay(end);
				List<MeasureValue> data = getAirDbServiceClient(dbId).getValidData(sensorId, begin.getTime(),
						end.getTime(), param2IntegerObj(period_m, PERIOD_MINUTES),
						param2ShortObj(verificationLevel, VERIFICATION_LEVEL));

				List<DayDataHolder> listHolder = splitByDay(data);
				return listHolder;
			}
		});
	}

	// Restituisce le misure presenti nel database per i sensori e il periodo
	// specificati, utilizzando un oggetto con numero minimo di campi (timestamp e
	// valore_validato).
	// Le misure restituite avranno almeno il livello di 'verifica' richiesto
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure
	// "sensorId": identificatori degli oggetti sensore, specificarne uno o più
	// "period_m": periodo di aggregazione delle misure (es. 60 minuti, ozionale)
	// "verificationLevel": livello minimo di verifica richiesto (opzionale, il
	// livello di default è quello massimo)
	// Esempio
	// https://<server_name>/ariaweb/airvalidsrv/validdata/multisensor/cop/1669762800000/1669849200000?period_m=60&sensorId=13.001272.803.21&sensorId=13.001272.803.04
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/validdata/multisensor/{dbId}/{beginDate}/{endDate}")
	public void getValidDataMultisensor(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("beginDate") final String beginDate,
			@PathParam("endDate") final String endDate, @QueryParam("sensorId") final List<String> sensorIds,
			@QueryParam("period_m") final String period_m,
			@QueryParam("verificationLevel") final String verificationLevel) {
		runTask(new ServiceTask("GET /validdata/multisensor/" + dbId + "/" + beginDate + "/" + endDate + ", "
				+ "sensorIds=" + sensorIds + PERIOD_M_EQ + period_m + VERIFICATIONLEVEL_EQ + verificationLevel,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				List<MultiSensorDataHolder> listHolder = new ArrayList<MultiSensorDataHolder>();
				for (String sensorId : sensorIds) {
					checkSensorAllowed(basic, auth, sensorId, false, false);
					List<MeasureValue> data = getAirDbServiceClient(dbId).getValidData(sensorId,
							param2LongObj(beginDate, BEGIN_DATE), param2LongObj(endDate, END_DATE),
							param2IntegerObj(period_m, PERIOD_MINUTES),
							param2ShortObj(verificationLevel, VERIFICATION_LEVEL));
					listHolder.add(new MultiSensorDataHolder(sensorId, data));
				}
				return listHolder;
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
				"GET /datatimestamps/notcertified/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
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
		runTask(new ServiceTask(
				"GET /datatimestamps/toreview/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
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
				"GET /datatimestamps/notvalidated/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
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
				"GET /datatimestamps/validnovalue/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
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
		runTask(new ServiceTask("GET /datatimestamps/notcompleted/" + dbId + "/" + sensorId + "/" + beginDate + "/"
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

	// Esegue il controllo dei dati di IPA per verificare che:
	// - per ciascun timestamp sia presente il dato di polveri quando sono presenti i dati di IPA
	// - per ciascun timestamp se il dato di polveri non è valido i dati di IPA siano non validi o
	// non ancora validati
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {sensorId}: identificatore dell'oggetto sensore che corrisponde al filtro da cui sono analizzati
	// gli IPA in laboratorio
	// {beginDate}: data di inizio del periodo di ricerca delle misure
	// {endDate}: data di fine del periodo di ricerca delle misure
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/datatimestamps/ipacheck/reg/13.001272.803.PM10_GBV/1667257200000/1672441200000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/datatimestamps/ipacheck/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void getIpaCheckDataTimestamps(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask(
				"GET /datatimestamps/ipacheck/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				return getAirDbServiceClient(dbId).getIpaCheckDataTimestamps(sensorId,
						param2LongObj(beginDate, BEGIN_DATE), param2LongObj(endDate, END_DATE));
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
	// "mode": modalità correzione 'constant' (default) o 'progressive'
	// NOTA: le date di inizio e fine devono essere nello stesso giorno di due
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
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate,
			@QueryParam("mode") final String mode) {
		runTask(new ServiceTask("GET /calibrations/measurecorrection/" + dbId + "/" + sensorId + "/" + beginDate + "/"
				+ endDate + " mode=" + mode, asyncResponse) {
			@Override
			public Object execute() throws AppException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				checkSensorAllowed(basic, auth, sensorId, false, false);
				Date begin = param2DateObj(beginDate, BEGIN_DATE);
				Date end = param2DateObj(endDate, END_DATE);
				MeasureCorrector.Mode correctorMode;
				if (mode == null || mode.isEmpty() || mode.equalsIgnoreCase("constant"))
					correctorMode = MeasureCorrector.Mode.CONSTANT;
				else if (mode.equalsIgnoreCase("progressive"))
					correctorMode = MeasureCorrector.Mode.PROGRESSIVE;
				else
					throw new IllegalArgumentException("Unsupported correction mode '" + mode + "'");
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
					for (int i = 0; i < listMeasure.size(); i++) {
						Measure no2 = listMeasure.get(i);
						Measure no = listMeasureNO.get(i);
						listCorrectedValues.add(corrector.applyCorrectionNO2(correctorMode, no2, no, calEnd, calEndNO,
								i, listMeasure.size() - 1));
					}
				} else {
					for (int i = 0; i < listMeasure.size(); i++) {
						listCorrectedValues.add(corrector.applyCorrection(correctorMode, sensor.getId_parametro(),
								listMeasure.get(i), calEnd, i, listMeasure.size() - 1));
					}
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
		ListIterator<Calibration> itCalibs = listCalibrations.listIterator();
		while (itCalibs.hasNext()) {
			Calibration cal = itCalibs.next();
			if (!Boolean.TRUE.equals(cal.getCalibrationApplied()))
				itCalibs.remove();
		}
		if (listCalibrations.isEmpty())
			throw new AppException("No applied calibrations found for the specified sensor and period " + target);
		if (listCalibrations.size() == 1)
			throw new AppException("Only one applied calibration found for the specified sensor and period " + target);
		if (listCalibrations.size() > 2)
			throw new AppException(
					"More than two applied calibrations found for the specified sensor and period " + target);
		Calibration calBegin = listCalibrations.get(0);
		if (!DataUtils.thisDay(calBegin.getEndDate()).equals(DataUtils.thisDay(begin)))
			throw new AppException("End day '" + calBegin.getEndDate()
					+ "' of first calibration does not match with correction begin day '" + begin + "'");
		Calibration calEnd = listCalibrations.get(1);
		if (!DataUtils.thisDay(calEnd.getBeginDate()).equals(DataUtils.thisDay(end)))
			throw new AppException("Begin day '" + calEnd.getBeginDate()
					+ "' of second calibration does not match with correction end day '" + end + "'");
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
				+ endDate + PERIOD_M_EQ + period_m + VERIFICATIONLEVEL_EQ + verificationLevel + DECIMAL_DIGITS_EQ
				+ decimalDigits, asyncResponse) {
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
	// - "beginTime": (opzionale) inizio dell'intervallo temporale
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

	// Funzioni basate su SOLR

	// Restituisce l'elenco dei parametri attivi tra due date
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {beginDate}: data di inizio del periodo di ricerca
	// {endDate}: data di fine del periodo di ricerca
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/parameternames/reg/1698793200000/1699959851899
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/parameternames/{dbId}/{beginDate}/{endDate}")
	public void getParameters(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("beginDate") final String beginDate,
			@PathParam("endDate") final String endDate) {
		runTask(new ServiceTask("GET /parameternames/" + dbId + "/" + beginDate + "/" + endDate, asyncResponse) {
			@Override
			public Object execute() throws AuthException, LockException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				Date begin = param2DateObj(beginDate, BEGIN_DATE);
				Date end = param2DateObj(endDate, END_DATE);
				String q = "*" + Solr.addSensorBeginDateConstraint(begin) + Solr.addSensorEndDateConstraint(end);
				ResponseHolder<Object, ParametersStatsFields> paramHolder;
				if (isCop(dbId))
					paramHolder = getSolrServiceClient().getAirnetCopSelectParameters("AND", q, 0, null, "on",
							"sensore_id_parametro", true);
				else
					paramHolder = getSolrServiceClient().getAirnetSelectParameters("AND", q, 0, null, "on",
							"sensore_id_parametro", true);
				List<NameWithKey> listNwk = new ArrayList<NameWithKey>();
				Stats<ParametersStatsFields> stats = paramHolder.getStats();
				if (stats != null) {
					ParametersStatsFields psf = stats.getStatsFields();
					if (psf != null) {
						listNwk = makeParameterNames(dbId, psf);
					}
				}
				return listNwk;
			}
		});
	}

	// Restituisce l'elenco delle stazioni che misurano o hanno misurato il
	// parametro
	// specificato nel periodo compreso tra due date
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {parameter}: identificatore del parametro
	// {beginDate}: data di inizio del periodo di ricerca
	// {endDate}: data di fine del periodo di ricerca
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/stationnames/reg/05_prova/1645311600000/1682892000000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/stationnames/{dbId}/{parameter}/{beginDate}/{endDate}")
	public void getStationNamesWithParameter(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("parameter") final String parameter,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask("GET /stationnames/" + dbId + "/" + parameter + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException, LockException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				Date begin = param2DateObj(beginDate, BEGIN_DATE);
				Date end = param2DateObj(endDate, END_DATE);
				String q = parameter + Solr.addSensorBeginDateConstraint(begin) + Solr.addSensorEndDateConstraint(end);
				ResponseHolder<Object, StationsStatsFields> stationHolder;
				if (isCop(dbId))
					stationHolder = getSolrServiceClient().getAirnetCopSelectStations("AND", q, 0,
							"sensore_id_parametro", "on", "campo_concat_rete_stazione", true);
				else
					stationHolder = getSolrServiceClient().getAirnetSelectStations("AND", q, 0, "sensore_id_parametro",
							"on", "campo_concat_rete_stazione", true);
				List<NameWithKey> listNwk = new ArrayList<NameWithKey>();
				Stats<StationsStatsFields> stats = stationHolder.getStats();
				if (stats != null) {
					StationsStatsFields psf = stats.getStatsFields();
					if (psf != null) {
						listNwk = makeStationNames(getUserCache(basic, auth), dbId, parameter, psf, begin, end);
					}
				}
				return listNwk;
			}
		});
	}

	// Restituisce l'elenco degli eventi relativi ad un dato sensore nel periodo
	// specificato
	// {dbId}: identificatore del data base reg=regionale
	// {sensorId}: identificatore del sensore
	// {beginDate}: data di inizio del periodo di ricerca
	// {endDate}": data di fine del periodo di ricerca
	// Nota: la funzione restituisce al massimo 1024 eventi
	// Gli oggetti dell'elenco restituito hanno i seguenti campi:
	// "origin": fonte dell'evento, es: ticket, note
	// "type": eventuale tipologia dell'evento (vale null se l'informazione non c'è)
	// "beginDate": timestamp di inizio dell'evento, in millisecondi
	// "endDate": timestamp di fine dell'evento, in millisecondi
	// "notes": elenco di stringhe con le note dell'intervento (può essere vuoto)
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/sensorevents/reg/22.004078.800.05/1662933600000/1664575200000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/sensorevents/{dbId}/{sensorId}/{beginDate}/{endDate}")
	public void getSensorEvents(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("sensorId") final String sensorId,
			@PathParam("beginDate") final String beginDate, @PathParam("endDate") final String endDate) {
		runTask(new ServiceTask("GET /sensorevents/" + dbId + "/" + sensorId + "/" + beginDate + "/" + endDate,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException, LockException, AppException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				checkSensorAllowedAdvancedOrWrite(basic, auth, sensorId);
				Date begin = param2DateObj(beginDate, BEGIN_DATE);
				Date end = param2DateObj(endDate, END_DATE);
				SensorKey sk = SensorKey.valueOf(Utils.removeNetId(sensorId));
				String q = Solr.addBeginDateConstraint(begin) + Solr.addEndDateConstraint(end, true)
						+ " parametro_id_parametro:\"" + sk.getId_parametro() + "\" codice_istat_comune:\""
						+ sk.getCodice_istat_comune() + "\" progr_punto_com:" + sk.getProgr_punto_com();
				lg.debug("q -> " + q);
				ResponseHolder<SolrSensorEvent, Object> eventHolder = getSolrServiceClient()
						.getAirgestSensorEvents("AND", q, 1024, "data_inizio desc");
				List<Event> listResult = new ArrayList<Event>();
				for (SolrSensorEvent event : eventHolder.getResponse().getDocs())
					listResult.add(new Event(event));
				return listResult;
			}
		});
	}

	// Restituisce l'elenco delle stazioni il cui nome o una parola del nome inizia
	// con la sequenza di caratteri specificata, nel periodo compreso tra due date
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {userinput}: sequenza di caratteri da usare per la ricerca
	// i parametri seguenti sono opzionali:
	// "beginDate": data di inizio del periodo di ricerca
	// "endDate": data di fine del periodo di ricerca
	// "pIds": identificatori parametri misurati, uno o più ripetendo pIds
	// "publicView": true=stazioni visibili a tutti, false=stazioni riservate, se omesso tutte
	// "publicOwner": true=stazioni di proprietà pubblica, false=stazioni di proprietà privata, se
	// omesso tutte
	// "publicManagement": true=stazioni gestite da Arpa, false=stazioni gestite da privati, se omesso
	// tutte
	// "national": true=stazioni con sensori di interesse nazionale, false=... di interesse locale, se
	// omesso tutte
	// "mobile": true=stazioni mobili, false=stazioni fisse
	// "stationTypeIds": identificatori tipo stazione, uno o più ripetendo stationTypeIds
	// "zoneTypeIds": identificatori tipo zona, uno o più ripetendo zoneTypeIds
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/suggest/stationnames/reg/re*?beginDate=1640991600000&endDate=1643583600000&arpa=true
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/suggest/stationnames/{dbId}/{userinput}")
	public void getSuggestStationNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("userinput") final String userinput,
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate,
			@QueryParam("pIds") final List<String> listParameterId, @QueryParam("publicView") final Boolean publicView,
			@QueryParam("publicOwner") final Boolean publicOwner,
			@QueryParam("publicManagement") final Boolean publicManagement,
			@QueryParam("national") final Boolean national, @QueryParam("mobile") final Boolean mobile,
			@QueryParam("stationTypeIds") final List<String> listStationTypeId,
			@QueryParam("zoneTypeIds") final List<String> listZoneTypeId) {
		runTask(new ServiceTask("GET /suggest/stationnames/" + dbId + "/" + userinput + BEGINDATE_EQ + beginDate
				+ ENDDATE_EQ + endDate + ", pIds=" + listParameterId + printCommonParams(publicView, publicOwner,
						publicManagement, national, mobile, listStationTypeId, listZoneTypeId),
				asyncResponse) {
			@Override
			public Object execute() throws AuthException, LockException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				Date begin = param2DateObj(beginDate, BEGIN_DATE);
				Date end = param2DateObj(endDate, END_DATE);
				Set<String> setParamId = new HashSet<>();
				StringBuilder q = new StringBuilder();
				q.append(userinput);
				q.append(Solr.addSensorBeginDateConstraint(begin));
				q.append(Solr.addSensorEndDateConstraint(end));
				if (listParameterId != null && !listParameterId.isEmpty()) {
					setParamId.addAll(listParameterId);
					q.append(" (");
					boolean first = true;
					for (String paramId : listParameterId) {
						q.append((first ? "" : " OR ") + "sensore_id_parametro:" + paramId);
						first = false;
					}
					q.append(")");
				}
				ResponseHolder<Object, StationsStatsFields> stationHolder;
				if (isCop(dbId)) {
					addCommonParamsCop(q, publicOwner, publicManagement);
					lg.debug("Solr-airnetcop q=" + q);
					stationHolder = getSolrServiceClient().getAirnetCopSelectStations("AND", q.toString(), 0,
							"campo_suggest_stazione", "on", "campo_concat_rete_stazione", true);
				} else {
					addCommonParams(q, publicView, publicOwner, publicManagement, national, mobile, listStationTypeId,
							listZoneTypeId);
					lg.debug("Solr-airnet q=" + q);
					stationHolder = getSolrServiceClient().getAirnetSelectStations("AND", q.toString(), 0,
							"campo_suggest_stazione", "on", "campo_concat_rete_stazione", true);
				}
				List<NameWithKey> listNwk = new ArrayList<>();
				Stats<StationsStatsFields> stats = stationHolder.getStats();
				if (stats != null) {
					StationsStatsFields psf = stats.getStatsFields();
					if (psf != null)
						listNwk = makeStationNames(getUserCache(basic, auth), dbId, null, psf, begin, end);
				}
				if (!setParamId.isEmpty()) {
					ListIterator<NameWithKey> itStationNames = listNwk.listIterator();
					while (itStationNames.hasNext()) {
						NameWithKey nwk = itStationNames.next();
						List<SensorNameWithKeyAndPeriod> listSensorNames = getAnagraphCache(dbId)
								.getSensorNamesForStation(nwk.getKey(), begin, end, getUserCache(basic, auth),
										getAuthCache());
						Set<String> setSensorKeys = new HashSet<>();
						for (SensorNameWithKeyAndPeriod sensor : listSensorNames)
							setSensorKeys.add(Utils.extractParameterId(sensor.getKey()));
						if (!setSensorKeys.containsAll(setParamId))
							itStationNames.remove();
					}
				}
				return NameKey.convert(listNwk);
			}
		});
	}

	// Restituisce l'elenco dei parametri il cui nome o una parola del nome inizia
	// con la sequenza di caratteri specificata, nel periodo compreso tra due date
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {userinput}: sequenza di caratteri da usare per la ricerca
	// i parametri seguenti sono opzionali:
	// "beginDate": data di inizio del periodo di ricerca
	// "endDate": data di fine del periodo di ricerca
	// "sIds": identificatori stazioni di appartenenza, uno o più ripetendo sIds
	// "publicView": true=parametri visibili a tutti, false=parametri riservati, se omesso tutte
	// "publicOwner": true=parametri misurati da stazioni di proprietà pubblica, false=... privata, se
	// omesso tutti
	// "publicManagement": true=parametri misurati da stazioni gestite da Arpa, false=... da privati, se
	// omesso tutti
	// "national": true=parametri relativi a sensori di interesse nazionale, false=... di interesse
	// locale, se omesso tutti
	// "mobile": true=misurati da stazioni mobili, false=misurati da stazioni fisse
	// "stationTypeIds": identificatori tipo stazione (che misura i parametri restituiti), uno o più
	// ripetendo stationTypeIds
	// "zoneTypeIds": identificatori tipo zona, uno o più ripetendo zoneTypeIds
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/suggest/parameternames/reg/bi*?beginDate=1640991600000&endDate=1643583600000
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/suggest/parameternames/{dbId}/{userinput}")
	public void getSuggestParameterNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("userinput") final String userinput,
			@QueryParam("beginDate") final String beginDate, @QueryParam("endDate") final String endDate,
			@QueryParam("sIds") final List<String> listStationId, @QueryParam("publicView") final Boolean publicView,
			@QueryParam("publicOwner") final Boolean publicOwner,
			@QueryParam("publicManagement") final Boolean publicManagement,
			@QueryParam("national") final Boolean national, @QueryParam("mobile") final Boolean mobile,
			@QueryParam("stationTypeIds") final List<String> listStationTypeId,
			@QueryParam("zoneTypeIds") final List<String> listZoneTypeId) {
		runTask(new ServiceTask("GET /suggest/parameternames/" + dbId + "/" + userinput + BEGINDATE_EQ + beginDate
				+ ENDDATE_EQ + endDate + ", stationIds=" + listStationId + printCommonParams(publicView, publicOwner,
						publicManagement, national, mobile, listStationTypeId, listZoneTypeId),
				asyncResponse) {
			@Override
			public Object execute() throws AuthException, LockException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				Date begin = param2DateObj(beginDate, BEGIN_DATE);
				Date end = param2DateObj(endDate, END_DATE);
				Set<String> setSensorId = null;
				StringBuilder q = new StringBuilder();
				q.append(userinput);
				q.append(Solr.addSensorBeginDateConstraint(begin));
				q.append(Solr.addSensorEndDateConstraint(end));
				if (listStationId != null && !listStationId.isEmpty()) {
					setSensorId = new HashSet<>();
					q.append(" (");
					boolean first = true;
					for (String stationId : listStationId) {
						q.append((first ? "" : " OR ") + "campo_concat_rete_stazione:" + stationId);
						first = false;
						List<SensorNameWithKeyAndPeriod> listSensorNames = getAnagraphCache(dbId)
								.getSensorNamesForStation(stationId, begin, end, getUserCache(basic, auth),
										getAuthCache());
						for (SensorNameWithKeyAndPeriod sensor : listSensorNames)
							setSensorId.add(sensor.getKey());
					}
					q.append(")");
				}
				ResponseHolder<Object, ParametersStatsFields> stationHolder;
				if (isCop(dbId)) {
					addCommonParamsCop(q, publicOwner, publicManagement);
					lg.debug("Solr-airnetcop q=" + q);
					stationHolder = getSolrServiceClient().getAirnetCopSelectParameters("AND", q.toString(), 0,
							"campo_suggest_parametro", "on", "sensore_id_parametro", true);
				} else {
					addCommonParams(q, publicView, publicOwner, publicManagement, national, mobile, listStationTypeId,
							listZoneTypeId);
					lg.debug("Solr-airnet q=" + q);
					stationHolder = getSolrServiceClient().getAirnetSelectParameters("AND", q.toString(), 0,
							"campo_suggest_parametro", "on", "sensore_id_parametro", true);
				}
				List<NameWithKey> listNwk = new ArrayList<NameWithKey>();
				Stats<ParametersStatsFields> stats = stationHolder.getStats();
				if (stats != null) {
					ParametersStatsFields psf = stats.getStatsFields();
					if (psf != null) {
						listNwk = makeParameterNames(dbId, psf);
					}
				}
				if (setSensorId != null) {
					ListIterator<NameWithKey> itParamNames = listNwk.listIterator();
					while (itParamNames.hasNext()) {
						NameWithKey nwk = itParamNames.next();
						Set<String> setParamSensorId = new HashSet<>();
						for (String stationId : listStationId)
							setParamSensorId.add(Utils.makeSensorId(stationId, nwk.getKey()));
						if (!setSensorId.containsAll(setParamSensorId))
							itParamNames.remove();
					}
				}
				return NameKey.convert(listNwk);
			}
		});
	}

	// Restituisce l'elenco degli eventi nelle cui note è presente il testo di
	// ricerca specificato
	// {dbId}: identificatore del data base reg=regionale
	// {userinput}: testo da cercare nelle note
	// "count": paginazione, numero massimo di risultati da restituire, se omesso il
	// valore usato è 1024
	// "begin": paginazione, posizione del primo risultato da restituire, se omesso
	// il valore usato è 0
	// "beginDate": data di inizio del periodo di ricerca (opzionale)
	// "endDate": data di fine del periodo di ricerca (opzionale)
	// "origin": filtra la ricerca in base alla fonte dell'evento (opzionale)
	// "networkName": filtra la ricerca per nome rete (opzionale)
	// "stationName": filtra la ricerca per nome stazione (opzionale)
	// "sensorName": filtra la ricerca per nome parametro (opzionale)
	// Gli eventi sono restituiti con lo stesso ordine con cui sono stati organizzati da Solr
	// Gli eventi dell'elenco restituito hanno i seguenti campi:
	// "origin": fonte dell'evento, es: ticket, note
	// "type": eventuale tipologia dell'evento (vale null se l'informazione non c'è)
	// "beginDate": timestamp di inizio dell'evento, in millisecondi
	// "endDate": timestamp di fine dell'evento, in millisecondi
	// "notes": elenco di stringhe con le note dell'intervento (può essere vuoto)
	// È possibile filtrare gli eventi usando i filtri sopra descritti, assegnando un solo valore ad
	// uno o più filtri.
	// I filtri sono restituiti nel campo "filters", per ciascuno si ha un identificatore "id" e
	// l'elenco "items" dei possibili valori, Ciascun valore ha il nome "name" e la quantità di
	// occorrenze negli eventi "count"
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/events/reg/spento?count=5&begin=7
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/events/{dbId}/{userinput}")
	public void getEvents(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("userinput") final String userinput,
			@QueryParam("begin") final String beginStr, @QueryParam("count") final String countStr,
			@QueryParam("beginDate") final String beginDateStr, @QueryParam("endDate") final String endDateStr,
			@QueryParam("origin") final String origin, @QueryParam("networkName") final String networkName,
			@QueryParam("stationName") final String stationName, @QueryParam("sensorName") final String sensorName) {
		runTask(new ServiceTask("GET /events/" + dbId + "/" + userinput + BEGINDATE_EQ + beginDateStr + ENDDATE_EQ
				+ endDateStr + ", begin=" + beginStr + ", count=" + countStr + ", origin=" + origin + ", networkName="
				+ networkName + ", stationName=" + stationName + ", sensorName=" + sensorName, asyncResponse) {
			@Override
			public Object execute() throws LockException, AppException {
				checkAuthorizationAdvancedOrWrite(basic, auth, FN_VALIDAZIONE);
				String userKey = getUserKey(basic, auth);
				Set<String> netIds = getAllowedNetworkIds(userKey, false, true);
				netIds.addAll(getAllowedNetworkIds(userKey, true, false));
				if (netIds.isEmpty())
					throw new AuthException("User '" + userKey + "' is not authorized for any network");
				Integer begin = param2int(beginStr, "Pagination begin", 0);
				Integer count = param2int(countStr, "Pagination count", 1024);
				Date beginDate = param2DateObj(beginDateStr, BEGIN_DATE);
				Date endDate = param2DateObj(endDateStr, END_DATE);
				String q = "(" + userinput + ")";
				if (!netIds.contains(SensorId.WILDCARD)) {
					StringBuilder sb = new StringBuilder();
					sb.append(" AND (");
					String sep = "";
					for (String id : netIds) {
						sb.append(sep + "rete_id_rete_monit:" + id);
						sep = " OR ";
					}
					sb.append(")");
					q = q + sb;
				}
				if (origin != null && !origin.isEmpty())
					q = q + " AND fonte:" + origin;
				if (networkName != null && !networkName.isEmpty())
					q = q + " AND rete_denominazione:\"" + networkName + "\"";
				if (stationName != null && !stationName.isEmpty())
					q = q + " AND stazione_nome_pubblico:\"" + stationName + "\"";
				if (sensorName != null && !sensorName.isEmpty())
					q = q + " AND parametro_denominazione:\"" + sensorName + "\"";
				q += Solr.addBeginDateConstraint(beginDate);
				q += Solr.addEndDateConstraint(endDate, true);
				String[] ff = { "rete_denominazione", "stazione_nome_pubblico", "parametro_denominazione", "fonte" };
				lg.debug("getEvents with q='" + q + "'");
				ResponseHolder<SolrSensorEvent, Object> eventHolder = getSolrServiceClient().getAirgestSelectFacet(q,
						count, begin, "on", 1, ff);
				return makeEventsReply(eventHolder);
			}
		});
	}

	// Restituisce l'elenco delle informazioni anagrafiche in cui è presente il testo di ricerca
	// specificato
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {userinput}: testo da cercare nell'anagrafica
	// "count": paginazione, numero massimo di risultati da restituire, se omesso il
	// valore usato è 1024
	// "begin": paginazione, posizione del primo risultato da restituire, se omesso
	// il valore usato è 0
	// "beginDate": data di inizio del periodo di ricerca (opzionale)
	// "endDate": data di fine del periodo di ricerca (opzionale)
	// "stationName": filtra la ricerca per nome stazione (opzionale)
	// "sensorName": filtra la ricerca per nome parametro (opzionale)
	// Le informazioni sono restituite con lo stesso ordine con cui sono state organizzate da Solr
	// Le informazioni dell'elenco restituito hanno i seguenti campi:
	// "title": rete + stazione + parametro
	// "beginDate": anno inizio funzionamento sensore, formato YYYY-MM-DD
	// "endDate": anno fine funzionamento sensore, formato YYYY-MM-DD, null se ancora in funzione
	// "address": indirizzo stazione
	// "mapsUrl": URL con posizione su Google Maps
	// "altitude": quota stazione
	// "stationType": tipologia stazione
	// "stationUrl": URL anagrafica stazione su server Arpa
	// "national": sensore di interesse nazionale (true | false | null)
	// "publicOwned": stazione di proprietà pubblica (true | false | null)
	// "publicManaged": stazione gestita da ente pubblico (true | false | null)
	// È possibile filtrare gli eventi usando i filtri sopra descritti, assegnando un solo valore ad
	// uno o più filtri.
	// I filtri sono restituiti nel campo "filters", per ciascuno si ha un identificatore "id" e
	// l'elenco "items" dei possibili valori, Ciascun valore ha il nome "name" e la quantità di
	// occorrenze negli eventi "count"
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/anagraph/reg/ozono?count=10&begin=0
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/anagraph/{dbId}/{userinput}")
	public void getAnagraph(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId, @PathParam("userinput") final String userinput,
			@QueryParam("begin") final String beginStr, @QueryParam("count") final String countStr,
			@QueryParam("beginDate") final String beginDateStr, @QueryParam("endDate") final String endDateStr,
			@QueryParam("stationName") final String stationName, @QueryParam("sensorName") final String sensorName) {
		runTask(new ServiceTask("GET /anagraph/" + dbId + "/" + userinput + BEGINDATE_EQ + beginDateStr + ENDDATE_EQ
				+ endDateStr + ", begin=" + beginStr + ", count=" + countStr + ", stationName=" + stationName
				+ ", sensorName=" + sensorName, asyncResponse) {
			@Override
			public Object execute() throws LockException, AppException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				Integer begin = param2int(beginStr, "Pagination begin", 0);
				Integer count = param2int(countStr, "Pagination count", 1024);
				Date beginDate = param2DateObj(beginDateStr, BEGIN_DATE);
				Date endDate = param2DateObj(endDateStr, END_DATE);
				String q = "(" + userinput + ")";
				if (stationName != null && !stationName.isEmpty())
					q = q + " AND stazione_nome_pubblico:\"" + stationName + "\"";
				if (sensorName != null && !sensorName.isEmpty())
					q = q + " AND sensore_parametro_denominazione:\"" + sensorName + "\"";
				q += Solr.addSensorBeginDateConstraint(beginDate);
				q += Solr.addSensorEndDateConstraint(endDate);
				String[] ff = { "stazione_nome_pubblico", "sensore_parametro_denominazione" };
				lg.debug("getAnagraph with q='" + q + "'");
				ResponseHolder<SolrAnagraphItem, Object> eventHolder;
				if (isCop(dbId))
					eventHolder = getSolrServiceClient().getAirnetCopSelectFacet(q, count, begin, "on", 1, ff);
				else
					eventHolder = getSolrServiceClient().getAirnetSelectFacet(q, count, begin, "on", 1, ff);
				return makeAnagraphReply(eventHolder);
			}
		});
	}

	// Funzione di cancellazione delle cache dell'anagrafica
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/cache/anagraph/cop
	@GET
	@Produces(MediaType.TEXT_PLAIN)
	@Path("/cache/anagraph/{dbId}")
	public void deleteAnagraphCache(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("dbId") final String dbId) {
		runTask(new ServiceTask("GET /cache/anagraph/" + dbId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_APP_ADMIN, false, false);
				getAnagraphCache(dbId).invalidate();
				return "OK";
			}
		});
	}

	// Funzione di cancellazione delle cache del data base di gestione
	// dell'autenticazione
	// Esempio:
	// https://<server_name>/ariaweb/airvalidsrv/cache/auth
	@GET
	@Produces(MediaType.TEXT_PLAIN)
	@Path("/cache/auth")
	public void deleteAuthCache(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("cacheId") final String cacheId) {
		runTask(new ServiceTask("GET /cache/" + cacheId, asyncResponse) {
			@Override
			public Object execute() throws AuthException {
				checkAuthorization(basic, auth, FN_APP_ADMIN, false, false);
				getAuthCache().invalidate();
				invalidateUserCaches();
				return "OK";
			}
		});
	}

	// Effettua la reportistica del tipo richiesto e restituisce il risultato in
	// formato Json
	// {type}: tipo di reportistica daily=giornaliera variable=periodo variabile yearly=annuale
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// "date": data del giorno su cui effettuare la reportistica (solo per type=daily)
	// "beginDate": data di inizio (solo per type=variable)
	// "endDate": data di fine (solo per type=variable)
	// "year": anno su cui effettuare la reportistica (solo per type=yearly)
	// "validatedDataOnly": utilizza solo dati validati (default: true)
	// "displayColors": attiva la generazione dei colori di evidenziazione (deafult: false)
	// "displayNetNames": attiva la visualizzazione dei nomi delle reti (default: true)
	// "anagraphInfoByRows": visualizza le informazioni anagrafiche nelle righe (deafult: false)
	// "tableIds": identificatori delle tabelle da generare (default: tutte),
	// dipendono dal tipo di reportistica:
	// - identificatori tabelle per reportistica "periodo variabile"
	// __- SYNTHETIC_TABLE=0 ______Tabella di sistesi
	// __- MEDIUM_PER_HOURS=1 _____Tabella del giorno medio
	// __- MEDIUM_PER_DAYS=2 ______Tabella con statistiche giornaliere
	// __- CHART=3 ________________Matrice oraria
	// - identificatori tabelle per reportistica "annuale"
	// __- SYNTHETIC_TABLE=0 _____ Tabella di sistesi
	// __- MEDIUM_PER_MONTHS=4 ___ Tabella con statistiche mensili
	// __- MEDIUM_PER_HOURS=1 ____ Tabella del giorno medio
	// __- MEDIUM_PER_DAYSWEEK=5 _ Tabella con statistiche per giorni della settimana
	// __- PERCENTILES=6 _________ Tabella dei percentili
	// "language": specifica il linguaggio da utilizzare IT o EN (deafult: IT)
	// Dati della POST: lista identificatori dei sensori su cui effettuare la reportistica, in formato
	// JSON
	// es: ["13.001272.806.PM10_B","13.001270.801.05"]

	// POST
	// https://<server_name>/ariaweb/airvalidsrv/report/daily/reg?date=1696114800000&verificationLevel=3
	// Dati POST: ["13.001270.801.05"]
	// POST
	// https://<server_name>/ariaweb/airvalidsrv/report/variable/reg?beginDate=1696114800000&endDate=1698706800000&verificationLevel=3
	// Dati POST: ["13.001270.801.05"]
	// POST https://<server_name>/ariaweb/airvalidsrv/report/yearly/reg?year=2023&verificationLevel=3
	// Dati POST: ["13.001270.801.05"]
	@POST
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/report/{type}/{dbId}")
	public void doReport(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("type") final String type, @PathParam("dbId") final String dbId,
			@QueryParam("date") final String date, @QueryParam("beginDate") final String beginDate,
			@QueryParam("endDate") final String endDate, @QueryParam("year") final String year,
			@QueryParam("validatedDataOnly") final Boolean validatedDataOnly,
			@QueryParam("displayColors") final Boolean displayColors,
			@QueryParam("displayNetNames") final Boolean displayNetNames,
			@QueryParam("anagraphInfoByRows") final Boolean anagraphInfoByRows,
			@QueryParam("tableIds") final List<Integer> tableIds, @QueryParam("language") final String language,
			final List<String> listSensorId) {
		runTask(new ServiceTask(
				"POST /report/" + type + "/" + dbId + BEGINDATE_EQ + beginDate + ENDDATE_EQ + endDate + YEAR_EQ + year
						+ VALIDATED_DATA_ONLY_EQ + validatedDataOnly + ", displayColors=" + displayColors
						+ ", displayNetNames=" + displayNetNames + ", anagraphInfoByRows=" + anagraphInfoByRows
						+ LANGUAGE_EQ + language + SENSOR_IDS_EQ + listSensorId + ", tableIds=" + tableIds,
				asyncResponse) {
			@Override
			public Object execute() throws AuthException, ElaborationException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				for (String sensorId : listSensorId)
					checkSensorAllowed(basic, auth, sensorId, false, false);
				boolean useValidateData = !Boolean.FALSE.equals(validatedDataOnly);
				lg.debug("Use validated data = " + useValidateData);
				boolean _displayNetNames = displayNetNames == null ? true : displayNetNames;
				lg.debug("Display net names = " + _displayNetNames);
				return doReport(dbId, type, useValidateData, Boolean.TRUE.equals(displayColors), _displayNetNames,
						Boolean.TRUE.equals(anagraphInfoByRows), tableIds, listSensorId, param2DateObj(date, DATE),
						param2DateObj(beginDate, BEGIN_DATE), param2DateObj(endDate, END_DATE),
						param2IntegerObj(year, YEAR), language);
			}
		});
	}

	// Effettua la reportistica del tipo richiesto e restituisce il risultato in
	// formato Html
	// {type}: tipo di reportistica daily=giornaliera variable=periodo variabile yearly=annuale
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// "date": data del giorno su cui effettuare la reportistica (solo per type=daily)
	// "beginDate": data di inizio (solo per type=variable)
	// "endDate": data di fine (solo per type=variable)
	// "year": anno su cui effettuare la reportistica (solo per type=yearly)
	// "validatedDataOnly": utilizza solo dati validati (default: true)
	// "displayColors": attiva la generazione dei colori di evidenziazione (deafult: false)
	// "displayNetNames": attiva la visualizzazione dei nomi delle reti (default: true)
	// "anagraphInfoByRows": visualizza le informazioni anagrafiche nelle righe (deafult: false)
	// "simpleStyle": utilizza stile semplice per l'html (deafult: true)
	// "tableIds": identificatori delle tabelle da generare (default: tutte),
	// dipendono dal tipo di reportistica:
	// - identificatori tabelle per reportistica "periodo variabile"
	// __- SYNTHETIC_TABLE=0 ______Tabella di sistesi
	// __- MEDIUM_PER_HOURS=1 _____Tabella del giorno medio
	// __- MEDIUM_PER_DAYS=2 ______Tabella con statistiche giornaliere
	// __- CHART=3 ________________Matrice oraria
	// - identificatori tabelle per reportistica "annuale"
	// __- SYNTHETIC_TABLE=0 _____ Tabella di sistesi
	// __- MEDIUM_PER_MONTHS=4 ___ Tabella con statistiche mensili
	// __- MEDIUM_PER_HOURS=1 ____ Tabella del giorno medio
	// __- MEDIUM_PER_DAYSWEEK=5 _ Tabella con statistiche per giorni della settimana
	// __- PERCENTILES=6 _________ Tabella dei percentili
	// "language": specifica il linguaggio da utilizzare IT o EN (deafult: IT)
	// Dati della POST: lista identificatori dei sensori su cui effettuare la reportistica, in formato
	// JSON
	// es: ["13.001272.806.PM10_B","13.001270.801.05"]

	// POST
	// https://<server_name>/ariaweb/airvalidsrv/htmlreport/daily/reg?date=1696114800000&verificationLevel=3
	// Dati POST: ["13.001270.801.05"]
	// POST
	// https://<server_name>/ariaweb/airvalidsrv/htmlreport/variable/reg?beginDate=1696114800000&endDate=1698706800000&verificationLevel=3
	// Dati POST: ["13.001270.801.05"]
	// POST
	// https://<server_name>/ariaweb/airvalidsrv/htmlreport/yearly/reg?year=2023&verificationLevel=3
	// Dati POST: ["13.001270.801.05"]
	@POST
	@Produces(MediaType.TEXT_HTML)
	@Path("/htmlreport/{type}/{dbId}")
	public void doHtmlReport(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("type") final String type, @PathParam("dbId") final String dbId,
			@QueryParam("date") final String date, @QueryParam("beginDate") final String beginDate,
			@QueryParam("endDate") final String endDate, @QueryParam("year") final String year,
			@QueryParam("validatedDataOnly") final Boolean validatedDataOnly,
			@QueryParam("displayColors") final Boolean displayColors,
			@QueryParam("displayNetNames") final Boolean displayNetNames,
			@QueryParam("anagraphInfoByRows") final Boolean anagraphInfoByRows,
			@QueryParam("simpleStyle") final Boolean simpleStyle, @QueryParam("tableIds") final List<Integer> tableIds,
			@QueryParam("language") final String language, final List<String> listSensorId) {
		runTask(new ServiceTask("POST /htmlreport/" + type + "/" + dbId + BEGINDATE_EQ + beginDate + ENDDATE_EQ
				+ endDate + YEAR_EQ + year + VALIDATED_DATA_ONLY_EQ + validatedDataOnly + ", displayColors="
				+ displayColors + ", displayNetNames=" + displayNetNames + ", anagraphInfoByRows=" + anagraphInfoByRows
				+ ", simpleStyle=" + simpleStyle + LANGUAGE_EQ + language + SENSOR_IDS_EQ + listSensorId + ", tableIds="
				+ tableIds, asyncResponse) {
			@Override
			public Object execute() throws AuthException, ElaborationException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				for (String sensorId : listSensorId)
					checkSensorAllowed(basic, auth, sensorId, false, false);
				boolean useValidateData = !Boolean.FALSE.equals(validatedDataOnly);
				lg.debug("Use validated data = " + useValidateData);
				boolean _displayNetNames = displayNetNames == null ? true : displayNetNames;
				boolean _simpleStyle = simpleStyle == null ? true : simpleStyle;
				lg.debug("Display net names = " + _displayNetNames);
				ReportResult reportResult = doReport(dbId, type, useValidateData, Boolean.TRUE.equals(displayColors),
						_displayNetNames, Boolean.TRUE.equals(anagraphInfoByRows), tableIds, listSensorId,
						param2DateObj(date, DATE), param2DateObj(beginDate, BEGIN_DATE),
						param2DateObj(endDate, END_DATE), param2IntegerObj(year, YEAR), language);
				return renderReportToHtml(reportResult, _simpleStyle);
			}
		});
	}

	@GET
	@Produces(MediaType.TEXT_PLAIN)
	@Path("/report/version")
	public void getReportlibVersion(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth) {
		runTask(new ServiceTask("GET /report/version", asyncResponse) {
			@Override
			public Object execute() throws AuthException, ElaborationException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return ReportUtils.VER;
			}
		});
	}

	// Restituisce l'elenco dei report specialistici supportati
	// "language": specifica il linguaggio da utilizzare IT o EN (deafult: IT)
	// https://<server_name>/ariaweb/airvalidsrv/specreports?language=IT
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/specreports")
	public void getSpecReportNames(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@QueryParam("language") final String language) {
		runTask(new ServiceTask("GET /specreports " + LANGUAGE_EQ + language, asyncResponse) {
			@Override
			public Object execute() throws AuthException, ElaborationException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				ReportFactory rf = ReportFactory.getInstance(Utils.getMessages(language));
				return rf.listReports();
			}
		});
	}

	// Restituisce le informazioni relative al report specialistico specificato
	// {reportId}: identificatore del report specialistico
	// "language": specifica il linguaggio da utilizzare IT o EN (deafult: IT)
	// https://<server_name>/ariaweb/airvalidsrv/specreports/persistence_analysis?language=IT
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/specreports/{reportId}")
	public void getSpecReport(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("reportId") final String reportId, @QueryParam("language") final String language) {
		runTask(new ServiceTask("GET /specreports " + LANGUAGE_EQ + language, asyncResponse) {
			@Override
			public Object execute() throws AuthException, ElaborationException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				ReportFactory rf = ReportFactory.getInstance(Utils.getMessages(language));
				return rf.getReportDetail(reportId);
			}
		});
	}

	// Restituisce l'anagrafica da selezionare relativa al report specialistico specificato
	// {reportId}: identificatore del report specialistico
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {beginTime}: inizio dell'intervallo temporale
	// {endTime}: fine dell'intervallo temporale
	// "itemType": tipo di oggetto di anagrafica (NETWORK, STATION, PARAMETER, SENSOR)
	// "itemIds": elenco di chiavi del tipo specificato (&itemIds=22.004003.800&itemIds=....)
	// "language": specifica il linguaggio da utilizzare IT o EN (deafult: IT)
	// https://<server_name>/ariaweb/airvalidsrv/specreports/persistence_analysis/anagraph/reg/1704063600000/1706742000000?language=IT
	// https://<server_name>/ariaweb/airvalidsrv/specreports/persistence_analysis/anagraph/reg/1704063600000/1706742000000?itemType=network&itemIds=22&itemIds=50
	// https://<server_name>/ariaweb/airvalidsrv/specreports/persistence_analysis/anagraph/reg/1704063600000/1706742000000?itemType=station&itemIds=22.004003.800&itemIds=50.005120.800
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/specreports/{reportId}/anagraph/{dbId}/{beginTime}/{endTime}")
	public void getSpecReportOptions(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("reportId") final String reportId, @PathParam("dbId") final String dbId,
			@PathParam("beginTime") final Long beginTime, @PathParam("endTime") final Long endTime,
			@QueryParam("itemType") final String itemType, @QueryParam("itemIds") final List<String> listAnagraphIds,
			@QueryParam("language") final String language) {
		runTask(new ServiceTask("GET /specreports/" + reportId + "/anagraph/" + dbId + "/" + beginTime + "/" + endTime
				+ ITEM_TYPE_EQ + itemType + ITEM_IDS_EQ + listAnagraphIds + LANGUAGE_EQ + language, asyncResponse) {
			@Override
			public Object execute() throws AuthException, ElaborationException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				ReportFactory rf = ReportFactory.getInstance(Utils.getMessages(language));
				SpecReport report = rf.newReport(reportId, beginTime, endTime);
				return report.getAnagraph(getAnagraphCache(dbId), getUserCache(basic, auth), getAuthCache(), itemType,
						listAnagraphIds);
			}
		});
	}

	// Esegue in background il report specialistico specificato, restituisce UUID per recupero stato e
	// risultato
	// {reportId}: identificatore del report specialistico
	// {dbId}: identificatore del data base reg=regionale cop=Arpa per validazione
	// {beginTime}: inizio dell'intervallo temporale
	// {endTime}: fine dell'intervallo temporale
	// "itemType": tipo di oggetto di anagrafica (NETWORK, STATION, PARAMETER, SENSOR)
	// "verificationLevel": livello minimo di verifica richiesto (opzionale, default=2 'preliminary')
	// "language": specifica il linguaggio da utilizzare IT o EN (deafult: IT)
	// Dati della POST: lista di chiavi del tipo specificato su cui effettuare il report, in formato
	// JSON
	// es: ["22.004003.800.04","50.005120.800.04"]
	// POST
	// https://<server_name>/ariaweb/airvalidsrv/specreports/persistence_analysis/execute/reg/1672527600000/1704063600000?itemType=sensor&verificationLevel=2
	// Dati POST: ["22.004003.800.04","50.005120.800.04"]
	// POST
	// https://<server_name>/ariaweb/airvalidsrv/specreports/no2_nox_ratio/execute/reg/1704063600000/1706742000000?itemType=station
	// Dati POST: ["22.004003.800","22.004029.801"]
	@POST
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/specreports/{reportId}/execute/{dbId}/{beginTime}/{endTime}")
	public void executeSpecReport(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("reportId") final String reportId, @PathParam("dbId") final String dbId,
			@PathParam("beginTime") final Long beginTime, @PathParam("endTime") final Long endTime,
			@QueryParam("itemType") final String itemType,
			@QueryParam("verificationLevel") final String verificationLevel,
			@QueryParam("language") final String language, final List<String> listAnagraphIds) {
		runDeferredTask(
				new ServiceTask(
						"GET /specreports/" + reportId + "/execute/" + dbId + "/" + beginTime + "/" + endTime
								+ ITEM_TYPE_EQ + itemType + ITEM_IDS_EQ + listAnagraphIds + LANGUAGE_EQ + language,
						asyncResponse) {
					@Override
					public Object execute() throws AuthException, ElaborationException, DeferredTaskException {
						checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
						Short verifLevel = param2ShortObj(verificationLevel, VERIFICATION_LEVEL);
						if (verifLevel == null)
							verifLevel = DBConstants.VERIFICATION_PRELIMINARY;
						ReportFactory rf = ReportFactory.getInstance(Utils.getMessages(language));
						SpecReport report = rf.newReport(reportId, beginTime, endTime);
						String _itemType = report.getExecutionType(itemType);
						MatchType mt = null;
						if (ReportAnagraph.isItemType(ItemType.NETWORK, _itemType))
							mt = MatchType.NET;
						else if (ReportAnagraph.isItemType(ItemType.STATION, _itemType))
							mt = MatchType.STATION;
						else if (ReportAnagraph.isItemType(ItemType.SENSOR, _itemType))
							mt = MatchType.SENSOR;
						// Qualora si dovessero implementare dei report che lavorano per parametro, bisognerà gestire
						// il controllo delle autorizzazioni dopo aver determinato i sensori da utilizzare
						if (listAnagraphIds != null && mt != null)
							for (String itemId : listAnagraphIds)
								checkItemAllowed(basic, auth, mt, itemId, false, false);
						return report.execute(this, getAnagraphCache(dbId), getUserCache(basic, auth), getAuthCache(),
								getAirDbServiceClient(dbId), _itemType, listAnagraphIds, verifLevel);
					}
				});
	}

	// Recupera stato e risultato di un'operazione eseguita in background
	// {uuid} identificativo univoco dell'operazione
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/deferredtask/result/{uuid}")
	public void getDeferredTaskResult(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("uuid") final String uuid) {
		runTask(new ServiceTask("GET /deferredtask/result/" + uuid, asyncResponse) {
			@Override
			public Object execute() throws ExecutionException, InterruptedException, AuthException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return getDeferredTaskResult(uuid);
			}
		});
	}

	// Chiede di interrompere un'operazione eseguita in background
	// {uuid} identificativo univoco dell'operazione
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/deferredtask/cancel/{uuid}")
	public void cancelDeferredTask(final @Suspended AsyncResponse asyncResponse,
			@HeaderParam(BASIC_AUTH_HEADER) final String basic, @HeaderParam(SHIB_AUTH_ID) final String auth,
			@PathParam("uuid") final String uuid) {
		runTask(new ServiceTask("GET /deferredtask/cancel/" + uuid, asyncResponse) {
			@Override
			public Object execute() throws AuthException, InterruptedException {
				checkAuthorization(basic, auth, FN_VALIDAZIONE, false, false);
				return cancelDeferredTask(uuid);
			}
		});
	}

}
