/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Calendar;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeoutException;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.UriBuilder;

import org.apache.log4j.Logger;
import org.jboss.resteasy.client.jaxrs.BasicAuthentication;
import org.jboss.resteasy.client.jaxrs.ResteasyClient;
import org.jboss.resteasy.client.jaxrs.ResteasyClientBuilder;
import org.jboss.resteasy.client.jaxrs.ResteasyWebTarget;

import it.csi.srrqa.airdb.model.DBConstants;
import it.csi.srrqa.airdb.model.DataUtils;
import it.csi.srrqa.airdb.model.Measure;
import it.csi.srrqa.airdb.model.MeasureValue;
import it.csi.srrqa.airdb.model.NameWithKey;
import it.csi.srrqa.airdb.model.Network;
import it.csi.srrqa.airdb.model.NetworkKey;
import it.csi.srrqa.airdb.model.Parameter;
import it.csi.srrqa.airdb.model.Preference;
import it.csi.srrqa.airdb.model.Sensor;
import it.csi.srrqa.airdb.model.Station;
import it.csi.srrqa.airdb.model.StationKey;
import it.csi.srrqa.airdb.model.StationRecord;
import it.csi.srrqa.airdb.rest.client.AirDbRestClient;
import it.csi.srrqa.airvalidsrv.elaboration.ElaborationException;
import it.csi.srrqa.airvalidsrv.rest.SensorId.MatchType;
import it.csi.srrqa.airvalidsrv.solr.FacetFields;
import it.csi.srrqa.airvalidsrv.solr.ParametersStatsFields;
import it.csi.srrqa.airvalidsrv.solr.ResponseHolder;
import it.csi.srrqa.airvalidsrv.solr.SolrAnagraphItem;
import it.csi.srrqa.airvalidsrv.solr.SolrRestClient;
import it.csi.srrqa.airvalidsrv.solr.SolrSensorEvent;
import it.csi.srrqa.airvalidsrv.solr.StationsStatsFields;
import it.csi.srrqa.airvalidsrv.solr.StatsField;
import it.csi.srrqa.reportisticalib.report.DbTree;
import it.csi.srrqa.reportisticalib.report.DetailedReport;
import it.csi.srrqa.reportisticalib.report.MediumDetailedReport;
import it.csi.srrqa.reportisticalib.report.ParamMediumType;
import it.csi.srrqa.reportisticalib.report.ProcOptions;
import it.csi.srrqa.reportisticalib.report.RangeValues;
import it.csi.srrqa.reportisticalib.report.ReportType;
import it.csi.srrqa.reportisticalib.report.ReportUtils;
import it.csi.srrqa.reportisticalib.report.SensorHolder;
import it.csi.srrqa.reportisticalib.report.StationHolder;
import it.csi.srrqa.reportisticalib.report.SyntheticReport;
import it.csi.srrqa.reportisticalib.report.ThresholdObject;
import it.csi.srrqa.reportisticalib.table.HtmlReportRenderer;
import it.csi.srrqa.reportisticalib.table.ReportRenderer;
import it.csi.srrqa.reportisticalib.table.ReportResult;
import it.csi.srrqa.reportisticalib.table.Table;
import it.csi.srrqa.reportisticalib.table.WriterHtml;
import it.csi.webauth.client.AuthDbRestClient;
import it.csi.webauth.db.model.FunctionFlags;
import it.csi.webauth.db.model.Utente;

public abstract class RestService implements AuthClientProvider, AirDbClientProvider, SolrClientProvider {

	private static final String DB_COP = "cop";
	private static final String DB_REG = "reg";
	private static final String UNPARSEABLE_PARAM = "Unparseable parameter";
	private static final String VALUE = "value";
	private static final String USER = "User";
	private static final String DOES_NOT_HAVE_FUNCTION = "does not have function";
	private static final String UNSPECIFIED_USER_ID = "Unspecified user id";
	private static final String UNSPECIFIED_CONTEXT_ID = "Unspecified context id";
	private static final String FUNCTION = "function";
	private static final String ADVANCED = "advanced";
	private static final String WRITE = "write";
	private static final String UNKNOWN_DB_ID = "Unknown DB id";
	private static final String BEGIN_AFTER_END_YEAR = "Begin year is after end year";
	private static final String DATETIME_FMT = "dd/MM/yyyy HH:mm:ss";
	private static final String DEFERRED_TASK = "Deferred task";
	private static Logger lg = Logger.getLogger(AirValidApp.LOGGER_BASENAME + "." + RestService.class.getSimpleName());
	private static ExecutorService executor = Executors.newCachedThreadPool();
	private ServiceConfig airDbServiceCfg;
	private ServiceConfig copDbServiceCfg;
	private ServiceConfig authServiceCfg;
	private ServiceConfig solrServiceCfg;
	private boolean enableShibbolet;
	private ResteasyClientBuilder airDbClientBuilder;
	private ResteasyClientBuilder copDbClientBuilder;
	private ResteasyClientBuilder authClientBuilder;
	private ResteasyClientBuilder solrClientBuilder;
	private Map<String, UserCache> mapUserCache = new HashMap<String, UserCache>();
	private AuthCache authCache;
	private AnagraphCache airDbAnagraphCache;
	private AnagraphCache copDbAnagraphCache;
	private Map<String, YearlyDataLock> mapDataLockAirDb = new HashMap<String, YearlyDataLock>();
	private Map<String, YearlyDataLock> mapDataLockCopDb = new HashMap<String, YearlyDataLock>();
	private int measureLockTimeout_m;
	private List<ThresholdObject> listThresholds;
	private Map<ParamMediumType, List<Double>> mapRangeValues = new HashMap<ParamMediumType, List<Double>>();
	private Map<UUID, Future<Object>> mapDeferredTask = new HashMap<UUID, Future<Object>>();
	private Map<UUID, ProgressTracker> mapProgressTracker = new HashMap<UUID, ProgressTracker>();

	public RestService(ServiceConfig airDbServiceCfg, ServiceConfig copDbServiceCfg, ServiceConfig authServiceCfg,
			ServiceConfig solrServiceCfg, boolean enableShibbolet, int measureLockTimeout_m,
			boolean disableTrustManager, List<ThresholdObject> listThresholds, List<RangeValues> listRangeValues) {
		this.airDbServiceCfg = airDbServiceCfg;
		this.copDbServiceCfg = copDbServiceCfg;
		this.authServiceCfg = authServiceCfg;
		this.solrServiceCfg = solrServiceCfg;
		this.enableShibbolet = enableShibbolet;
		lg.debug("Rest service clients initialization...");
		airDbClientBuilder = new ResteasyClientBuilder();
		copDbClientBuilder = new ResteasyClientBuilder();
		authClientBuilder = new ResteasyClientBuilder();
		solrClientBuilder = new ResteasyClientBuilder();
		if (disableTrustManager) {
			airDbClientBuilder.disableTrustManager();
			copDbClientBuilder.disableTrustManager();
			authClientBuilder.disableTrustManager();
			solrClientBuilder.disableTrustManager();
		}
		lg.debug("Initializing caches...");
		authCache = new AuthCache(this);
		airDbAnagraphCache = new AnagraphCache(this, DB_REG);
		copDbAnagraphCache = new AnagraphCache(this, DB_COP);
		this.measureLockTimeout_m = measureLockTimeout_m;
		this.listThresholds = listThresholds;
		for (RangeValues rv : listRangeValues)
			mapRangeValues.put(rv.getParamMeanType(), rv.getValues());
		lg.debug("Initialization completed");
	}

	protected void runTask(final ServiceTask task) {
		lg.debug(task + " " + FUNCTION + " called");
		executor.submit(new Runnable() {
			public void run() {
				try {
					Object result = task.execute();
					if (result == null)
						task.getAsyncResponse().resume(Response.status(Status.NO_CONTENT).build());
					else
						task.getAsyncResponse().resume(Response.ok(result).build());
				} catch (Exception ex) {
					Throwable e;
					if (ex instanceof ExecutionException)
						e = ex.getCause();
					else
						e = ex;
					lg.error(e.getMessage(), e);
					if (e instanceof BadRequestException || e instanceof IllegalArgumentException)
						task.getAsyncResponse().resume(Response.status(Status.BAD_REQUEST)
								.entity(new ServiceError(ServiceError.Code.INVALID_PARAM, e)).build());
					else if (e instanceof ElaborationException)
						task.getAsyncResponse().resume(Response.status(Status.BAD_REQUEST)
								.entity(new ServiceError(ServiceError.Code.INVALID_TIME_INTERVAL, e)).build());
					else if (e instanceof NotFoundException)
						task.getAsyncResponse().resume(Response.status(Status.NO_CONTENT).build());
					else if (e instanceof LockException)
						task.getAsyncResponse().resume(Response.status(Status.FORBIDDEN)
								.entity(new ServiceError(ServiceError.Code.RESOURCE_LOCKED, e)).build());
					else if (e instanceof AuthException)
						task.getAsyncResponse().resume(Response.status(Status.UNAUTHORIZED)
								.entity(new ServiceError(ServiceError.Code.REQUEST_NOT_AUTHORIZED, e)).build());
					else
						task.getAsyncResponse().resume(Response.status(Status.INTERNAL_SERVER_ERROR)
								.entity(new ServiceError(ServiceError.Code.DATA_SERVICE_ERROR, e)).build());
				} finally {
				}
			}
		});
	}

	protected void runDeferredTask(final ServiceTask task) {
		cancelAbandonedTasks();
		UUID uuid = UUID.randomUUID();
		lg.debug(task + " " + FUNCTION + " called in background with id '" + uuid + "'");
		Future<Object> f = executor.submit(new Callable<Object>() {
			@Override
			public Object call() throws Exception {
				return task.execute();
			}
		});
		synchronized (mapProgressTracker) {
			mapDeferredTask.put(uuid, f);
			mapProgressTracker.put(uuid, task);
		}
		task.getAsyncResponse().resume(Response.ok(new DeferredTaskId(uuid)).build());
	}

	protected Object getDeferredTaskResult(String uuid) throws ExecutionException, InterruptedException {
		cancelAbandonedTasks();
		UUID _uuid;
		try {
			_uuid = UUID.fromString(uuid);
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Unparseable " + DEFERRED_TASK.toLowerCase() + " '" + uuid + "'", e);
		}
		Future<Object> f;
		ProgressTracker pt;
		synchronized (mapProgressTracker) {
			f = mapDeferredTask.get(_uuid);
			if (f == null)
				throw new IllegalArgumentException(
						"Cannot find " + DEFERRED_TASK.toLowerCase() + " with id '" + _uuid + "'");
			pt = mapProgressTracker.get(_uuid);
		}
		boolean waiting = false;
		try {
			return f.get(ServiceTask.DEFERRED_TASK_STATUS_TIMEOUT_S, java.util.concurrent.TimeUnit.SECONDS);
		} catch (TimeoutException e) {
			waiting = true;
			lg.debug(DEFERRED_TASK + " '" + _uuid + "' in progress...");
			return pt == null ? new DeferredStatus(DeferredStatus.Status.RUNNING)
					: new DeferredStatus(DeferredStatus.Status.RUNNING, pt.getProgress(), pt.getActivity());
		} catch (ExecutionException e) {
			if (e.getCause() instanceof DeferredTaskException) {
				lg.info(DEFERRED_TASK + " '" + _uuid + "' cancelled", e);
				return new DeferredStatus(DeferredStatus.Status.CANCELLED);
			}
			lg.error(DEFERRED_TASK + " '" + _uuid + "' failed");
			throw e;
		} catch (CancellationException e) {
			lg.info(DEFERRED_TASK + " '" + _uuid + "' cancelled", e);
			return new DeferredStatus(DeferredStatus.Status.CANCELLED);
		} catch (InterruptedException e) {
			lg.warn(DEFERRED_TASK + " '" + _uuid + "' interrupted", e);
			if (pt != null)
				pt.stop();
			throw e;
		} finally {
			if (!waiting)
				lg.debug(DEFERRED_TASK + " '" + _uuid + "' completed");
		}
	}

	protected DeferredStatus cancelDeferredTask(String uuid) throws InterruptedException {
		cancelAbandonedTasks();
		UUID _uuid;
		try {
			_uuid = UUID.fromString(uuid);
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Unparseable " + DEFERRED_TASK.toLowerCase() + " '" + uuid + "'", e);
		}
		lg.debug(DEFERRED_TASK + " '" + _uuid + "': cancel requested");
		Future<Object> f;
		ProgressTracker pt;
		synchronized (mapProgressTracker) {
			f = mapDeferredTask.get(_uuid);
			if (f == null)
				throw new IllegalArgumentException(
						"Cannot find " + DEFERRED_TASK.toLowerCase() + " with id '" + _uuid + "'");
			if (f.isDone())
				lg.debug(DEFERRED_TASK + " '" + _uuid + "': was done");
			pt = mapProgressTracker.get(_uuid);
		}
		if (pt != null)
			pt.stop();
		boolean cancelled = f.cancel(true);
		if (cancelled)
			lg.debug(DEFERRED_TASK + " '" + _uuid + "': cancelled now");
		return new DeferredStatus(DeferredStatus.Status.CANCELLED);
	}

	private void cancelAbandonedTasks() {
		synchronized (mapProgressTracker) {
			for (UUID uuid : mapProgressTracker.keySet()) {
				ProgressTracker pt = mapProgressTracker.get(uuid);
				if (pt.isCleanupNeeded()) {
					lg.warn("Removing stopped/completed " + DEFERRED_TASK.toLowerCase() + " '" + uuid + "'");
					mapProgressTracker.remove(uuid);
					mapDeferredTask.remove(uuid);
				}
			}
		}
	}

	protected long param2long(String param, String description) throws IllegalArgumentException {
		try {
			return Long.parseLong(param);
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	protected int param2int(String param, String description) throws IllegalArgumentException {
		try {
			return Integer.parseInt(param);
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	protected int param2int(String param, String description, int defaultValue) throws IllegalArgumentException {
		try {
			if (param == null || param.isEmpty())
				return defaultValue;
			return Integer.parseInt(param.trim());
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	protected short param2short(String param, String description) throws IllegalArgumentException {
		try {
			return Short.parseShort(param);
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	protected byte param2byte(String param, String description) throws IllegalArgumentException {
		try {
			return Byte.parseByte(param);
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	protected Short param2ShortObj(String param, String description) throws IllegalArgumentException {
		try {
			if (param == null || param.isEmpty())
				return null;
			return Short.parseShort(param.trim());
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	protected Integer param2IntegerObj(String param, String description) throws IllegalArgumentException {
		try {
			if (param == null || param.isEmpty())
				return null;
			return Integer.parseInt(param.trim());
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	protected Long param2LongObj(String param, String description) throws IllegalArgumentException {
		try {
			if (param == null || param.isEmpty())
				return null;
			return Long.parseLong(param.trim());
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	protected Boolean param2BooleanObj(String param, String description, Boolean defaultValue)
			throws IllegalArgumentException {
		if (param == null || param.trim().isEmpty())
			return defaultValue;
		if (param.trim().equalsIgnoreCase("true"))
			return true;
		if (param.trim().equalsIgnoreCase("false"))
			return false;
		throw new IllegalArgumentException(makeErrMsg(param, description));
	}

	protected boolean param2boolean(String param, String description) throws IllegalArgumentException {
		if (param == null || param.trim().isEmpty())
			throw new IllegalArgumentException(makeErrMsg(param, description));
		if (param.trim().equalsIgnoreCase("true"))
			return true;
		if (param.trim().equalsIgnoreCase("false"))
			return false;
		throw new IllegalArgumentException(makeErrMsg(param, description));
	}

	protected Date param2DateObj(String param, String description) throws IllegalArgumentException {
		try {
			if (param == null || param.isEmpty() || "null".equalsIgnoreCase(param))
				return null;
			return new Date(Long.parseLong(param));
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException(makeErrMsg(param, description), e);
		}
	}

	private String makeErrMsg(String param, String description) {
		return UNPARSEABLE_PARAM + " '" + description + "', " + VALUE + " '" + param + "'";
	}

	protected UserCache getUserCache(String basicAuthHeader, String userCode) {
		return getUserCache(getUserKey(basicAuthHeader, userCode));
	}

	private UserCache getUserCache(String userKey) {
		if (userKey == null) {
			lg.debug("No remote user available");
			return null;
		}
		synchronized (mapUserCache) {
			UserCache pref = mapUserCache.get(userKey);
			if (pref == null) {
				pref = new UserCache(this, userKey, enableShibbolet);
				mapUserCache.put(userKey, pref);
			}
			return pref;
		}
	}

	protected void invalidateUserCaches() {
		synchronized (mapUserCache) {
			for (UserCache cache : mapUserCache.values())
				cache.invalidate();
		}
	}

	protected AuthCache getAuthCache() {
		return authCache;
	}

	protected Integer getUserId(String basicAuthHeader, String userCode) throws AuthException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		UserCache uc = getUserCache(userKey);
		if (uc == null)
			throw new AuthException("Cannot find user cache");
		Utente user = uc.getUser();
		if (user == null)
			throw new AuthException("Cannot find user information");
		Integer userId = user.getIdUtente();
		if (userId == null)
			throw new AuthException("Cannot find user ID");
		return userId;
	}

	private boolean isAuthorized(String userKey, String function, boolean advanced, boolean write)
			throws AuthException {
		UserCache uc = getUserCache(userKey);
		if (uc == null)
			return false;
		FunctionFlags ff = uc.getFunctionFlags(function);
		if (ff == null) {
			lg.debug(USER + " '" + uc.getUserName() + "' " + DOES_NOT_HAVE_FUNCTION + " '" + function + "'");
			return false;
		}
		if (advanced && !ff.getAdvancedFlag()) {
			lg.debug(USER + " '" + uc.getUserName() + "' " + DOES_NOT_HAVE_FUNCTION + " '" + function
					+ "' with advanced flag");
			return false;
		}
		if (write && !ff.getWriteFlag()) {
			lg.debug(USER + " '" + uc.getUserName() + "' " + DOES_NOT_HAVE_FUNCTION + " '" + function
					+ "' with write flag");
			return false;
		}
		return true;
	}

	protected void checkAuthorization(String basicAuthHeader, String userCode, String function, boolean advanced,
			boolean write) throws AuthException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (!isAuthorized(userKey, function, advanced, write))
			throw new AuthException(USER + " '" + userKey + "' not authorized for function '" + function + "', "
					+ ADVANCED + ":" + advanced + ", " + WRITE + ":" + write);
	}

	protected void checkAuthorizationAdvancedOrWrite(String basicAuthHeader, String userCode, String function)
			throws AuthException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (!isAuthorized(userKey, function, true, false) && !isAuthorized(userKey, function, false, true))
			throw new AuthException(USER + " '" + userKey + "' not authorized for function '" + function + "', "
					+ ADVANCED + ":" + false + ", " + WRITE + ":" + false);
	}

	protected UserInfo getCurrentUserInfo(String basicAuthHeader, String userCode) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		return getUserInfo(userKey);
	}

	protected String getUserKey(String basicAuthHeader, String userCode) {
		return enableShibbolet ? encodeSha256(userCode) : getRemoteUser(basicAuthHeader);
	}

	private UserInfo getUserInfo(String userKey) {
		UserCache uc = getUserCache(userKey);
		if (uc == null)
			return new UserInfo();
		Utente user;
		try {
			user = uc.getUser();
		} catch (AuthException e) {
			return new UserInfo();
		}
		if (user == null)
			return new UserInfo();
		return new UserInfo(user.getNome(), user.getCognome());
	}

	private String getRemoteUser(String basicAuthHeader) {
		if (basicAuthHeader == null)
			return null;
		try {
			String[] authParts = basicAuthHeader.split("\\s+");
			String decodedAuth = new String(Base64.getDecoder().decode(authParts[1]));
			String[] credentials = decodedAuth.split(":");
			return credentials[0];
		} catch (Exception e) {
			return null;
		}
	}

	private String encodeSha256(String userCode) {
		if (userCode == null)
			return null;
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(userCode.getBytes(StandardCharsets.UTF_8));
			StringBuilder sb = new StringBuilder();
			for (int i = 0; i < hash.length; i++)
				sb.append(Integer.toString((hash[i] & 0xff) + 0x100, 16).substring(1));
			return sb.toString();
		} catch (Exception e) {
			return null;
		}
	}

	protected Set<SensorId> getAllowedSensorIds(String userKey, boolean advanced, boolean write) throws AuthException {
		Set<SensorId> allowedSensorIds = new HashSet<SensorId>();
		UserCache uc = getUserCache(userKey);
		if (uc != null) {
			Map<Integer, FunctionFlags> mapDF = uc.getSrrqaDomainFlagsMap();
			for (Integer domain : mapDF.keySet()) {
				FunctionFlags ff = mapDF.get(domain);
				if (isAllowed(ff, advanced, write)) {
					Set<SensorId> sensorIds = authCache.getSrrqaDomainSensorIdsMap().get(domain);
					if (sensorIds != null)
						allowedSensorIds.addAll(sensorIds);
				}
			}
		}
		return allowedSensorIds;
	}

	protected Set<String> getAllowedNetworkIds(String userKey, boolean advanced, boolean write) throws AuthException {
		Set<String> allowedNetworkIds = new HashSet<String>();
		for (SensorId sid : getAllowedSensorIds(userKey, advanced, write))
			allowedNetworkIds.add(sid.getNetworkId());
		return allowedNetworkIds;
	}

	protected void checkItemAllowed(String basicAuthHeader, String userCode, MatchType itemType, String itemId,
			boolean advanced, boolean write) throws AuthException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (!isItemAllowed(userKey, itemId, itemType, advanced, write))
			throw new AuthException(USER + " '" + userKey + "' not authorized for " + itemType + " '" + itemId + "', "
					+ FUNCTION + ":" + UserCache.FUNCTION_VALIDAZIONE + "', " + ADVANCED + ":" + advanced + ", " + WRITE
					+ ":" + write);
	}

	protected void checkNetworkAllowed(String basicAuthHeader, String userCode, String networkId, boolean advanced,
			boolean write) throws AuthException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (!isItemAllowed(userKey, networkId, MatchType.NET, advanced, write))
			throw new AuthException(USER + " '" + userKey + "' not authorized for network '" + networkId + "', "
					+ FUNCTION + ":" + UserCache.FUNCTION_VALIDAZIONE + "', " + ADVANCED + ":" + advanced + ", " + WRITE
					+ ":" + write);
	}

	protected void checkStationAllowed(String basicAuthHeader, String userCode, String stationId, boolean advanced,
			boolean write) throws AuthException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (!isItemAllowed(userKey, stationId, MatchType.STATION, advanced, write))
			throw new AuthException(USER + " '" + userKey + "' not authorized for station '" + stationId + "', "
					+ FUNCTION + ":" + UserCache.FUNCTION_VALIDAZIONE + "', " + ADVANCED + ":" + advanced + ", " + WRITE
					+ ":" + write);
	}

	protected void checkSensorAllowed(String basicAuthHeader, String userCode, String sensorId, boolean advanced,
			boolean write) throws AuthException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (!isItemAllowed(userKey, sensorId, MatchType.SENSOR, advanced, write))
			throw new AuthException(USER + " '" + userKey + "' not authorized for sensor '" + sensorId + "', "
					+ FUNCTION + ":" + UserCache.FUNCTION_VALIDAZIONE + "', " + ADVANCED + ":" + advanced + ", " + WRITE
					+ ":" + write);
	}

	protected void checkSensorAllowedAdvancedOrWrite(String basicAuthHeader, String userCode, String sensorId)
			throws AuthException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (!isItemAllowed(userKey, sensorId, MatchType.SENSOR, true, false)
				&& !isItemAllowed(userKey, sensorId, MatchType.SENSOR, false, true))
			throw new AuthException(USER + " '" + userKey + "' not authorized for sensor '" + sensorId + "', "
					+ FUNCTION + ":" + UserCache.FUNCTION_VALIDAZIONE + "', " + ADVANCED + ":" + false + ", " + WRITE
					+ ":" + false);
	}

	private boolean isItemAllowed(String userKey, String itemId, MatchType itemType, boolean advanced, boolean write)
			throws AuthException {
		UserCache uc = getUserCache(userKey);
		if (uc == null)
			return false;
		Map<Integer, FunctionFlags> mapDF = uc.getSrrqaDomainFlagsMap();
		for (Integer domain : mapDF.keySet()) {
			FunctionFlags ff = mapDF.get(domain);
			if (isAllowed(ff, advanced, write)) {
				Set<SensorId> sensorIds = authCache.getSrrqaDomainSensorIdsMap().get(domain);
				if (matchesItem(sensorIds, itemId, itemType))
					return true;
			}
		}
		return false;
	}

	private boolean matchesItem(Set<SensorId> sensorIds, String itemId, MatchType itemType) {
		if (sensorIds != null)
			for (SensorId id : sensorIds)
				if (id.matches(itemId, itemType))
					return true;
		return false;
	}

	private boolean isAllowed(FunctionFlags ff, boolean advanced, boolean write) {
		if (ff == null)
			return false;
		if (advanced && !ff.getAdvancedFlag())
			return false;
		if (write && !ff.getWriteFlag())
			return false;
		return true;
	}

	protected AirDbRestClient getRegionalDbServiceClient() {
		ResteasyClient client = airDbClientBuilder.build();
		ResteasyWebTarget webTaget = client.target(UriBuilder.fromPath(airDbServiceCfg.getUrl()));
		webTaget.register(new BasicAuthentication(airDbServiceCfg.getUser(), airDbServiceCfg.getPassword()));
		return webTaget.proxy(AirDbRestClient.class);
	}

	protected AirDbRestClient getCopDbServiceClient() {
		ResteasyClient client = copDbClientBuilder.build();
		ResteasyWebTarget webTaget = client.target(UriBuilder.fromPath(copDbServiceCfg.getUrl()));
		webTaget.register(new BasicAuthentication(copDbServiceCfg.getUser(), copDbServiceCfg.getPassword()));
		return webTaget.proxy(AirDbRestClient.class);
	}

	protected AnagraphCache getAnagraphCache(String dbId) {
		if (DB_COP.equalsIgnoreCase(dbId))
			return copDbAnagraphCache;
		if (DB_REG.equalsIgnoreCase(dbId))
			return airDbAnagraphCache;
		throw new IllegalStateException(UNKNOWN_DB_ID + " '" + dbId + "'");
	}

	protected synchronized DataLock setLock(String basicAuthHeader, String userCode, String dbId, String contextId,
			String resourceId, int beginYear, int endYear) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		if (contextId == null || contextId.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_CONTEXT_ID + " '" + contextId + "'");
		if (beginYear > endYear)
			throw new IllegalStateException(BEGIN_AFTER_END_YEAR);
		Date now = new Date();
		YearlyDataLock notMyLock = null;
		for (int year = beginYear; year <= endYear; year++) {
			YearlyDataLock lock = getDataLock(dbId, resourceId, year);
			if ((lock != null) && (!userKey.equals(lock.getUserId()) || !contextId.equals(lock.getContextId()))) {
				notMyLock = lock;
				break;
			}
		}
		if (notMyLock != null)
			return new DataLock(resourceId, beginYear, endYear, notMyLock.getUserId(),
					getUserInfo(notMyLock.getUserId()).toString(), notMyLock.getContextId(), notMyLock.getDate(), true,
					false);
		for (int year = beginYear; year <= endYear; year++) {
			YearlyDataLock lock = new YearlyDataLock(resourceId, year, userKey, contextId, now);
			getMapDataLock(dbId).put(resourceId + "@" + year, lock);
		}
		return new DataLock(resourceId, beginYear, endYear, userKey, getUserInfo(userKey).toString(), contextId, now,
				true, true);
	}

	protected synchronized DataLock readLock(String basicAuthHeader, String userCode, String dbId, String contextId,
			String resourceId, int year) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		if (contextId == null || contextId.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_CONTEXT_ID + " '" + contextId + "'");
		YearlyDataLock lock = getDataLock(dbId, resourceId, year);
		if (lock == null) {
			return new DataLock(resourceId, year, year, null, null, null, null, false, false);
		}
		return new DataLock(resourceId, lock.getYear(), lock.getYear(), lock.getUserId(),
				getUserInfo(lock.getUserId()).toString(), lock.getContextId(), lock.getDate(), true,
				userKey.equals(lock.getUserId()) && contextId.equals(lock.getContextId()));
	}

	protected synchronized int clearLock(String basicAuthHeader, String userCode, String dbId, String contextId,
			String resourceId, int beginYear, int endYear) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		if (contextId == null || contextId.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_CONTEXT_ID + " '" + contextId + "'");
		if (beginYear > endYear)
			throw new IllegalStateException(BEGIN_AFTER_END_YEAR);
		int count = 0;
		for (int year = beginYear; year <= endYear; year++) {
			YearlyDataLock lock = getDataLock(dbId, resourceId, year);
			if (lock == null)
				continue;
			if (userKey.equals(lock.getUserId()) && contextId.equals(lock.getContextId())) {
				getMapDataLock(dbId).remove(resourceId + "@" + year);
				count++;
			}
		}
		return count;
	}

	protected synchronized int clearAllLocks(String basicAuthHeader, String userCode, String dbId) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		int count = 0;
		Iterator<YearlyDataLock> itLock = getMapDataLock(dbId).values().iterator();
		while (itLock.hasNext()) {
			if (userKey.equals(itLock.next().getUserId())) {
				count++;
				itLock.remove();
			}
		}
		return count;
	}

	protected synchronized int clearLocks(String basicAuthHeader, String userCode, String dbId, String contextId) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		if (contextId == null || contextId.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_CONTEXT_ID + " '" + contextId + "'");
		int count = 0;
		Iterator<YearlyDataLock> itLock = getMapDataLock(dbId).values().iterator();
		while (itLock.hasNext()) {
			YearlyDataLock lock = itLock.next();
			if (userKey.equals(lock.getUserId()) && contextId.equals(lock.getContextId())) {
				count++;
				itLock.remove();
			}
		}
		return count;
	}

	protected void checkLock(String basicAuthHeader, String userCode, String dbId, String resourceId, long beginDate,
			long endDate) throws AuthException, LockException, IllegalArgumentException {
		if (endDate < beginDate)
			throw new IllegalArgumentException("End date should not be before begin date");
		Calendar cal = new GregorianCalendar();
		cal.setTimeInMillis(beginDate);
		int beginYear = cal.get(Calendar.YEAR);
		if (cal.get(Calendar.MONTH) == Calendar.JANUARY && cal.get(Calendar.HOUR_OF_DAY) == 0
				&& cal.get(Calendar.MINUTE) == 0 && cal.get(Calendar.SECOND) == 0)
			beginYear--;
		cal.setTimeInMillis(endDate);
		int endYear = cal.get(Calendar.YEAR);
		if (cal.get(Calendar.MONTH) == Calendar.JANUARY && cal.get(Calendar.HOUR_OF_DAY) == 0
				&& cal.get(Calendar.MINUTE) == 0 && cal.get(Calendar.SECOND) == 0)
			endYear--;
		for (int year = beginYear; year <= endYear; year++)
			checkLock(basicAuthHeader, userCode, dbId, resourceId, year);
	}

	protected void checkLock(String basicAuthHeader, String userCode, String dbId, String resourceId, int year)
			throws AuthException, LockException {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		YearlyDataLock lock = getDataLock(dbId, resourceId, year);
		if (lock == null)
			throw new LockException("Resource '" + resourceId + "' is not locked for year " + year);
		if (!userKey.equals(lock.getUserId()))
			throw new LockException("Resource '" + resourceId + "' is locked by other user '" + lock.getUserId()
					+ "' for year " + year);
	}

	private YearlyDataLock getDataLock(String dbId, String resourceId, int year) {
		YearlyDataLock lock = getMapDataLock(dbId).get(resourceId + "@" + year);
		if (lock == null)
			return null;
		long lockAge_ms = System.currentTimeMillis() - lock.getDate().getTime();
		if (lockAge_ms > measureLockTimeout_m * 60000) {
			getMapDataLock(dbId).remove(resourceId + "@" + year);
			return null;
		}
		return lock;
	}

	protected List<AppPreference> convert(List<Preference> listPreference) {
		if (listPreference == null)
			return null;
		List<AppPreference> listAppPref = new ArrayList<AppPreference>(listPreference.size());
		for (Preference p : listPreference)
			listAppPref.add(new AppPreference(p.getId_gruppo_informazione(), p.getId_informazione(),
					p.getTipo_informazione(), p.getInformazione()));
		return listAppPref;
	}

	protected Date getFirstCalibrationTimestamp(List<Measure> listMeasure) {
		if (listMeasure == null)
			return null;
		for (Measure m : listMeasure)
			if (DBConstants.TIPOLOGIA_VALIDAZ_OK_CALIB.equals(m.getTipologia_validaz())
					|| DBConstants.TIPOLOGIA_VALIDAZ_KO_CALIB.equals(m.getTipologia_validaz()))
				return m.getTimestamp();
		return null;
	}

	protected Date getLastCalibrationTimestamp(List<Measure> listMeasure) {
		if (listMeasure == null)
			return null;
		Date lastCalDate = null;
		for (Measure m : listMeasure)
			if (DBConstants.TIPOLOGIA_VALIDAZ_OK_CALIB.equals(m.getTipologia_validaz())
					|| DBConstants.TIPOLOGIA_VALIDAZ_KO_CALIB.equals(m.getTipologia_validaz()))
				lastCalDate = m.getTimestamp();
		return lastCalDate;
	}

	@Override
	public AuthDbRestClient getAuthServiceClient() {
		ResteasyClient client = authClientBuilder.build();
		ResteasyWebTarget webTaget = client.target(UriBuilder.fromPath(authServiceCfg.getUrl()));
		webTaget.register(new BasicAuthentication(authServiceCfg.getUser(), authServiceCfg.getPassword()));
		return webTaget.proxy(AuthDbRestClient.class);
	}

	@Override
	public AirDbRestClient getAirDbServiceClient(String dbId) {
		if (DB_COP.equalsIgnoreCase(dbId))
			return getCopDbServiceClient();
		if (DB_REG.equalsIgnoreCase(dbId))
			return getRegionalDbServiceClient();
		throw new IllegalArgumentException(UNKNOWN_DB_ID + " '" + dbId + "'");
	}

	@Override
	public SolrRestClient getSolrServiceClient() {
		ResteasyClient client = solrClientBuilder.build();
		ResteasyWebTarget webTaget = client.target(UriBuilder.fromPath(solrServiceCfg.getUrl()));
		if (solrServiceCfg.getUser() != null && !solrServiceCfg.getUser().isEmpty())
			webTaget.register(new BasicAuthentication(solrServiceCfg.getUser(), solrServiceCfg.getPassword()));
		return webTaget.proxy(SolrRestClient.class);
	}

	private Map<String, YearlyDataLock> getMapDataLock(String dbId) {
		if (DB_COP.equalsIgnoreCase(dbId))
			return mapDataLockCopDb;
		if (DB_REG.equalsIgnoreCase(dbId))
			return mapDataLockAirDb;
		throw new IllegalArgumentException(UNKNOWN_DB_ID + " '" + dbId + "'");
	}

	protected boolean isCop(String dbId) {
		return DB_COP.equalsIgnoreCase(dbId);
	}

	protected List<DayDataHolder> splitByDay(List<MeasureValue> data) {
		List<DayDataHolder> listHolder = new ArrayList<DayDataHolder>();
		if (data == null || data.isEmpty())
			return listHolder;
		Date dayPrevious = null;
		Date day = null;
		DayDataHolder holder = null;
		for (MeasureValue value : data) {
			dayPrevious = day;
			day = DataUtils.isMidnight(value.getTimestamp()) ? DataUtils.previousDay(value.getTimestamp())
					: DataUtils.thisDay(value.getTimestamp());
			if (holder == null || !day.equals(dayPrevious)) {
				holder = new DayDataHolder(day);
				listHolder.add(holder);
			}
			holder.addValue(value);
		}
		return listHolder;
	}

	protected List<NameWithKey> makeParameterNames(String dbId, ParametersStatsFields parametersStatsFields) {
		List<NameWithKey> listNames = new ArrayList<NameWithKey>();
		StatsField fields = parametersStatsFields.getStatsField();
		if (fields != null) {
			List<String> values = fields.getDistinctValues();
			if (values != null) {
				AnagraphCache cache = getAnagraphCache(dbId);
				for (String paramId : values) {
					listNames.add(new NameWithKey(cache.getParameterName(paramId), paramId));
				}
			}
		}
		Collections.sort(listNames);
		return listNames;
	}

	protected List<NameWithKey> makeStationNames(UserCache userCache, String dbId, String parameterId,
			StationsStatsFields stationsStatsFields, Date begin, Date end) throws AuthException {
		List<NameWithKey> listNames = new ArrayList<NameWithKey>();
		StatsField fields = stationsStatsFields.getStatsField();
		if (fields != null) {
			List<String> values = fields.getDistinctValues();
			if (values != null) {
				AnagraphCache cache = getAnagraphCache(dbId);
				for (String stationId : values) {
					String authInfo;
					if (parameterId == null)
						authInfo = cache.getItemAuthInfo(stationId, MatchType.STATION, userCache, authCache, false);
					else
						authInfo = cache.getItemAuthInfo(Utils.makeSensorId(stationId, parameterId), MatchType.SENSOR,
								userCache, authCache, false);
					if (authInfo != null) {
						Station station = cache.getStation(stationId, begin, end);
						String stationName = station == null ? null : station.nameToString();
						boolean active = false;
						if (station != null) {
							List<StationRecord> records = station.getRecords();
							if (records != null && !records.isEmpty()) {
								active = records.get(0).getData_fine() == null;
								String pubName = records.get(0).getNome_pubblico();
								if (pubName != null && !pubName.isEmpty())
									stationName = pubName;
							}
						}
						listNames.add(new NameWithKey(stationName, stationId, active));
					}
				}
			}
		}
		Collections.sort(listNames);
		return listNames;
	}

	protected PaginatedReplyHolder<EventHolder> makeEventsReply(ResponseHolder<SolrSensorEvent, Object> eventHolder)
			throws AppException {
		PaginatedReplyHolder<EventHolder> reply = new PaginatedReplyHolder<EventHolder>();
		it.csi.srrqa.airvalidsrv.solr.Response<SolrSensorEvent> response = eventHolder.getResponse();
		reply.setBegin(response.getStart());
		reply.setCount(response.getDocs().size());
		reply.setTotal(response.getNumFound());
		List<NameCountHolder> listFilters = new ArrayList<>();
		NameCountHolder nchNetwork = new NameCountHolder("networkName");
		NameCountHolder nchStation = new NameCountHolder("stationName");
		NameCountHolder nchSensor = new NameCountHolder("sensorName");
		NameCountHolder nchOrigin = new NameCountHolder("origin");
		listFilters.add(nchNetwork);
		listFilters.add(nchStation);
		listFilters.add(nchSensor);
		listFilters.add(nchOrigin);
		reply.setFilters(listFilters);
		List<EventHolder> listEventHolder = new ArrayList<>();
		for (SolrSensorEvent event : response.getDocs()) {
			String stationId = Utils.makeStationId(event.getRete_id_rete_monit(),
					new StationKey(event.getCodice_istat_comune(), Integer.valueOf(event.getProgr_punto_com())));
			String sensorId = null;
			if (event.getParametro_id_parametro() != null)
				sensorId = Utils.makeSensorId(stationId, event.getParametro_id_parametro());
			listEventHolder.add(new EventHolder(stationId, event.getRete_denominazione(),
					event.getStazione_nome_pubblico(), sensorId, event.getParametro_denominazione(), new Event(event)));
		}
		if (eventHolder.getFacetCounts() != null) {
			FacetFields facetFields = eventHolder.getFacetCounts().getFacetFields();
			if (facetFields != null) {
				addFacetItems(nchNetwork, facetFields.getNetworkName());
				addFacetItems(nchStation, facetFields.getStationName());
				addFacetItems(nchSensor, facetFields.getParameterName());
				addFacetItems(nchOrigin, facetFields.getOrigin());
			}
		}
		reply.setItems(listEventHolder);
		return reply;
	}

	private void addFacetItems(NameCountHolder ncHolder, List<String> listNames) throws AppException {
		if (listNames == null)
			return;
		for (int i = 0; i < listNames.size() - 1; i += 2) {
			try {
				ncHolder.addItem(new NameCount(listNames.get(i), new Integer(listNames.get(i + 1))));
			} catch (NumberFormatException nfe) {
				throw new AppException("Cannot parse quantity '" + listNames.get(i + 1) + "' for facet item '"
						+ listNames.get(i) + "'");
			}
		}
	}

	protected PaginatedReplyHolder<AnagraphHolder> makeAnagraphReply(
			ResponseHolder<SolrAnagraphItem, Object> anagraphHolder) throws AppException {
		PaginatedReplyHolder<AnagraphHolder> reply = new PaginatedReplyHolder<AnagraphHolder>();
		it.csi.srrqa.airvalidsrv.solr.Response<SolrAnagraphItem> response = anagraphHolder.getResponse();
		reply.setBegin(response.getStart());
		reply.setCount(response.getDocs().size());
		reply.setTotal(response.getNumFound());
		List<NameCountHolder> listFilters = new ArrayList<>();
		NameCountHolder nchStation = new NameCountHolder("stationName");
		NameCountHolder nchSensor = new NameCountHolder("sensorName");
		listFilters.add(nchStation);
		listFilters.add(nchSensor);
		reply.setFilters(listFilters);
		List<AnagraphHolder> listAnagraphHolder = new ArrayList<>();
		for (SolrAnagraphItem item : response.getDocs()) {
			AnagraphHolder holder = new AnagraphHolder();
			holder.setTitle(item.getRete_denominazione() + " > " + getStationName(item) + " > "
					+ item.getSensore_parametro_denominazione());
			holder.setBeginDate(item.getSensore_data_inizio());
			holder.setEndDate(item.getSensore_data_fine());
			holder.setAddress(item.getStazione_indirizzo_localita());
			if (item.getStazione_latitudine() != null && item.getStazione_longitudine() != null)
				holder.setMapsUrl("https://www.google.com/maps/search/?api=1&query=" + item.getStazione_latitudine()
						+ "%2C" + item.getStazione_longitudine());
			holder.setAltitude(Utils.toDouble(item.getStazione_quota_stazione()));
			holder.setStationType(item.getStazione_tipologia_staz());
			holder.setStationUrl(item.getStazione_url());
			holder.setNational(DataUtils.isNationalSensor(item.getSensore_flg_ministero()));
			holder.setPublicOwned(DataUtils.isPublicOwnedNet(item.getRete_fl_privata()));
			holder.setPublicManaged(DataUtils.isPublicManagedNet(item.getRete_fl_privata()));
			holder.setToBePublisched(Utils.isToBePublished(item.getSensore_fl_da_pubblicare()));
			listAnagraphHolder.add(holder);
		}
		if (anagraphHolder.getFacetCounts() != null) {
			FacetFields facetFields = anagraphHolder.getFacetCounts().getFacetFields();
			if (facetFields != null) {
				addFacetItems(nchStation, facetFields.getStationName());
				addFacetItems(nchSensor, facetFields.getSensorParamName());
			}
		}
		reply.setItems(listAnagraphHolder);
		return reply;
	}

	private String getStationName(SolrAnagraphItem item) {
		String pubName = item.getStazione_nome_pubblico();
		if (pubName != null && !pubName.isEmpty())
			return pubName;
		return item.getStazione_denominazione();
	}

	protected ReportResult doReport(String dbId, String reportType, boolean validatedData, boolean displayColors,
			boolean showIdReteName, boolean showStInfoForRows, List<Integer> tableIds, List<String> listSensorId,
			Date date, Date beginDate, Date endDate, Integer year, String language) {
		ReportType rt = getReportType(reportType);
		if (rt == null)
			throw new IllegalArgumentException("Unknown report type '" + reportType + "'");
		Locale locale;
		if (language == null || language.isEmpty())
			locale = Locale.ITALIAN;
		else
			locale = new Locale(language);
		String copName = locale.equals(Locale.ENGLISH) ? (isCop(dbId) ? "ARPA Data Base" : "Regional Data Base")
				: (isCop(dbId) ? "Banca Dati ARPA" : "Banca Dati Regionale");
		ProcOptions opt = new ProcOptions(rt, validatedData, displayColors, showIdReteName, showStInfoForRows);
		opt.filterTables(tableIds);
		SimpleDateFormat sdf = new SimpleDateFormat(DATETIME_FMT);
		ReportResult report = new ReportResult();
		List<Table> listTable;
		Table helpTable;
		Date beginDateForDataRead;
		DbTree tree;
		switch (rt) {
		case DAILY:
			if (date == null)
				throw new IllegalArgumentException("Parameter 'date' missing for daily report");
			beginDate = DataUtils.thisDay(date);
			beginDateForDataRead = ReportUtils.addHours(beginDate, -6);
			endDate = DataUtils.nextDay(date);
			lg.debug("Daily report selected: " + sdf.format(beginDate));
			tree = readDbTree(dbId, listSensorId, beginDateForDataRead, endDate, true);
			DetailedReport dr = new DetailedReport(locale, tree, opt, listThresholds, beginDate, copName,
					getMeasureUnitsMap(dbId), mapRangeValues);
			report.setHeader(dr.getHeading());
			listTable = dr.doReport();
			helpTable = dr.getHelpTable();
			break;
		case VARIABLE:
			if (beginDate == null)
				throw new IllegalArgumentException("Parameter 'beginDate' missing for variable report");
			if (endDate == null)
				throw new IllegalArgumentException("Parameter 'endDate' missing for variable report");
			beginDate = DataUtils.thisDay(beginDate);
			beginDateForDataRead = ReportUtils.addHours(beginDate, -6);
			endDate = DataUtils.nextDay(endDate);
			lg.debug("Variable report selected: " + sdf.format(beginDate) + " -> " + sdf.format(endDate));
			tree = readDbTree(dbId, listSensorId, beginDateForDataRead, endDate, false);
			MediumDetailedReport mdr = new MediumDetailedReport(locale, opt, listThresholds, beginDate, endDate,
					copName, getMeasureUnitsMap(dbId), mapRangeValues, tree);
			report.setHeader(mdr.getHeading());
			listTable = new ArrayList<Table>();
			for (StationHolder sh : tree.getListStationHolder()) {
				readData(dbId, sh, beginDateForDataRead, endDate);
				mdr.setStation(sh);
				listTable.addAll(mdr.doReport());
				sh.clearData();
			}
			helpTable = mdr.getHelpTable();
			break;
		case YEARLY:
			if (year == null)
				throw new IllegalArgumentException("Parameter 'year' missing for yearly report");
			lg.debug("Yearly report selected: " + year);
			Calendar cal = new GregorianCalendar();
			int currentYear = cal.get(Calendar.YEAR);
			if (year > currentYear)
				throw new IllegalArgumentException("Parameter 'year' should not be after current year");
			if (year == currentYear)
				endDate = DataUtils.nextDay(cal.getTime());
			cal.set(Calendar.YEAR, year);
			cal.set(Calendar.MONTH, Calendar.JANUARY);
			cal.set(Calendar.DAY_OF_MONTH, 1);
			beginDate = DataUtils.thisDay(cal.getTime());
			beginDateForDataRead = ReportUtils.addHours(beginDate, -6);
			if (year < currentYear) {
				cal.set(Calendar.MONTH, Calendar.DECEMBER);
				cal.set(Calendar.DAY_OF_MONTH, 31);
				endDate = DataUtils.nextDay(cal.getTime());
			}
			tree = readDbTree(dbId, listSensorId, beginDateForDataRead, endDate, false);
			SyntheticReport sr = new SyntheticReport(locale, opt, listThresholds, year, copName,
					getMeasureUnitsMap(dbId), mapRangeValues, tree);
			report.setHeader(sr.getHeading());
			listTable = new ArrayList<Table>();
			for (StationHolder sh : tree.getListStationHolder()) {
				readData(dbId, sh, beginDateForDataRead, endDate);
				sr.setStation(sh);
				listTable.addAll(sr.doReport());
				sh.clearData();
			}
			helpTable = sr.getHelpTable();
			break;
		default:
			throw new IllegalArgumentException("Unknown report type '" + rt + "'");
		}
		if (showStInfoForRows)
			listTable = ReportUtils.mergeTables(listTable);
		if (helpTable != null)
			listTable.add(helpTable);
		report.setTables(listTable);
		return report;
	}

	private ReportType getReportType(String value) {
		if ("daily".equalsIgnoreCase(value))
			return ReportType.DAILY;
		if ("variable".equalsIgnoreCase(value))
			return ReportType.VARIABLE;
		if ("yearly".equalsIgnoreCase(value))
			return ReportType.YEARLY;
		return null;
	}

	protected String renderReportToHtml(ReportResult reportResult, boolean simpleStyle) {
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		PrintStream printStream = new PrintStream(outputStream);
		WriterHtml wh = new WriterHtml(printStream);
		ReportRenderer renderer = new HtmlReportRenderer(wh, simpleStyle);
		wh.writeHead();
		wh.startBody(simpleStyle);
		renderer.render(reportResult);
		wh.endBody();
		return outputStream.toString();
	}

	protected DbTree readDbTree(String dbId, List<String> listSensorId, Date begin, Date end, boolean readData) {
		List<StationHolder> listStationHolder = new ArrayList<StationHolder>();
		Map<String, List<String>> mapSensorId = new HashMap<String, List<String>>();
		for (String sensorId : listSensorId) {
			String stationId = Utils.extractStationId(sensorId);
			List<String> tmpList = mapSensorId.get(stationId);
			if (tmpList == null) {
				tmpList = new ArrayList<String>();
				mapSensorId.put(stationId, tmpList);
			}
			tmpList.add(sensorId);
		}
		Set<String> setNetworkId = new HashSet<String>();
		Map<String, String> mapZona_ue = new HashMap<String, String>();
		Map<String, String> mapNetworkNames = new HashMap<String, String>();
		for (String stationId : mapSensorId.keySet()) {
			Station station = getAnagraphCache(dbId).getStation(stationId, begin, end);
			if (station == null) {
				lg.warn("Skipping not active station '" + stationId + "' in period '" + begin + "' -> '" + end + "'");
				continue;
			}
			NameWithKey cityName = getAnagraphCache(dbId).getCityName(station.getCodice_istat_comune());
			if (cityName != null)
				mapZona_ue.put(station.getCodice_istat_comune(), cityName.getExtraInfo());
			List<SensorHolder> listSensorHolder = new ArrayList<SensorHolder>();
			for (String sensorId : mapSensorId.get(stationId)) {
				Sensor sensor = getAnagraphCache(dbId).getSensor(sensorId, begin, end);
				if (sensor == null) {
					lg.warn("Skipping not active sensor '" + sensorId + "' in period '" + begin + "' -> '" + end + "'");
					continue;
				}
				Parameter param = getAnagraphCache(dbId).getParameter(sensor.getId_parametro());
				List<Measure> listMeasure;
				if (readData) {
					Integer period_m = sensor.getRecords().get(0).getTempo_registrazione();
					Integer numDec = param == null ? null : param.getNum_decimali();
					listMeasure = getAirDbServiceClient(dbId).getData(sensorId, begin.getTime(), end.getTime(),
							period_m);
					doRound(listMeasure, numDec);
					if (lg.isDebugEnabled()) {
						lg.debug("readDbTree: dbId=" + dbId + ", stationId=" + stationId + ", sensorId=" + sensorId
								+ ", regTime=" + period_m + ", begin=" + begin + ", end=" + end + ", num measures="
								+ listMeasure.size());
					}
				} else {
					listMeasure = new ArrayList<Measure>();
				}
				SensorHolder sensorHolder = new SensorHolder(sensor, param, listMeasure);
				listSensorHolder.add(sensorHolder);
			}
			String netId = Utils.extractNetId(stationId);
			setNetworkId.add(netId);
			StationHolder stationHolder = new StationHolder(new NetworkKey(netId), station, listSensorHolder);
			listStationHolder.add(stationHolder);
			Network network = getAnagraphCache(dbId).getNetwork(netId, begin, end);
			if (network != null)
				mapNetworkNames.put(station.key(), network.getRecords().get(0).getDenominazione());
		}
		Map<String, String> mapStationClassification = getAnagraphCache(dbId).getStationClassificationNamesMap();
		Map<String, String> mapAreaClassification = getAnagraphCache(dbId).getAreaClassificationNamesMap();
		DbTree tree = new DbTree(listStationHolder, mapNetworkNames, mapStationClassification, mapAreaClassification,
				mapZona_ue);
		sortDbTree(tree);
		lg.debug(tree.printSummary());
		return tree;
	}

	private void sortDbTree(DbTree tree) {
		List<StationHolder> listStationHolder = tree.getListStationHolder();
		Collections.sort(listStationHolder, new Comparator<StationHolder>() {
			@Override
			public int compare(StationHolder o1, StationHolder o2) {
				Station s1 = o1.getStation();
				Station s2 = o2.getStation();
				int tmp = tree.getNetworkName(s1).toLowerCase().compareTo(tree.getNetworkName(s2).toLowerCase());
				if (tmp != 0)
					return tmp;
				return s1.nameToString().toLowerCase().compareTo(s2.nameToString().toLowerCase());
			}
		});
		for (StationHolder sh : listStationHolder) {
			List<SensorHolder> listSensorHolder = sh.getListSensorHolder();
			Collections.sort(listSensorHolder, new Comparator<SensorHolder>() {
				@Override
				public int compare(SensorHolder o1, SensorHolder o2) {
					Parameter p1 = o1.getParameter();
					Parameter p2 = o2.getParameter();
					return p1.nameToString().toLowerCase().compareTo(p2.nameToString().toLowerCase());
				}
			});
		}
	}

	protected void readData(String dbId, StationHolder stationHolder, Date begin, Date end) {
		for (SensorHolder sh : stationHolder.getListSensorHolder()) {
			Sensor sensor = sh.getSensor();
			Integer period_m = sensor.getRecords().get(0).getTempo_registrazione();
			Integer numDec = sensor.getRecords().get(0).getNum_decimale_mce();
			if (lg.isDebugEnabled()) {
				lg.debug("readDbTree: dbId=" + dbId + ", station=" + stationHolder.getStation().nameToString()
						+ ", sensor=" + sh.getSensor().nameToString() + ", regTime=" + period_m + ", begin=" + begin
						+ ", end=" + end + ", data read started...");
			}
			List<Measure> listMeasure = getAirDbServiceClient(dbId).getData(stationHolder.getKey(sh), begin.getTime(),
					end.getTime(), period_m);
			doRound(listMeasure, numDec);
			if (lg.isDebugEnabled()) {
				lg.debug("readDbTree: data read completed, num measures=" + listMeasure.size());
			}
			sh.setListMeasure(listMeasure);
		}
	}

	protected Map<String, NameWithKey> getMeasureUnitsMap(String dbId) {
		// Nota: nella vecchia reportistica le descrizioni delle unità di misura
		// venivano lette dalla tabella 'traduzioni' in funzione della locale.
		// In questo caso vengono lette tramite il servizio 'airdbservice' che fornisce
		// le descrzioni presenti nella tabella 'unita_misura'.
		Collection<NameWithKey> measureUnits = getAnagraphCache(dbId).getMeasureUnitNames();
		Map<String, NameWithKey> mapMeasureUnits = new HashMap<String, NameWithKey>(measureUnits.size());
		for (NameWithKey item : measureUnits)
			mapMeasureUnits.put(item.getKey(), item);
		return mapMeasureUnits;
	}

	private void doRound(List<Measure> listMeasure, Integer numDec) {
		if (listMeasure == null || numDec == null)
			return;
		for (Measure m : listMeasure) {
			if (m != null) {
				if (m.getValore_originale() != null)
					m.setValore_originale(doRound(m.getValore_originale(), numDec));
				if (m.getValore_validato() != null)
					m.setValore_validato(doRound(m.getValore_validato(), numDec));
			}
		}
	}

	private double doRound(double value, int numDec) {
		if (numDec <= 0)
			return Math.round(value);
		double multiplier = Math.pow(10, numDec);
		return Math.round(value * multiplier) / multiplier;
	}

	protected String printCommonParams(Boolean publicView, Boolean publicOwner, Boolean publicManagement,
			Boolean national, Boolean mobile, List<String> listStationTypeId, List<String> listZoneTypeId) {
		return ", publicView=" + publicView + ", publicOwner=" + publicOwner + ", publicManagement=" + publicManagement
				+ ", national=" + national + ", mobile=" + mobile + ", stationTypeIds=" + listStationTypeId
				+ ", zoneTypeIds=" + listZoneTypeId;
	}

	protected void addCommonParams(StringBuilder q, Boolean publicView, Boolean publicOwner, Boolean publicManagement,
			Boolean national, Boolean mobile, List<String> listStationTypeId, List<String> listZoneTypeId) {
		if (Boolean.TRUE.equals(publicView))
			q.append(" stazione_fl_da_pubblicare:1 rete_fl_da_pubblicare:1 sensore_fl_da_pubblicare:1");
		if (Boolean.FALSE.equals(publicView))
			q.append(" stazione_fl_da_pubblicare:0 rete_fl_da_pubblicare:0 sensore_fl_da_pubblicare:0");
		addCommonParamsCop(q, publicOwner, publicManagement);
		if (Boolean.TRUE.equals(national))
			q.append(" sensore_flg_ministero:1");
		if (Boolean.FALSE.equals(national))
			q.append(" sensore_flg_ministero:0");
		if (Boolean.TRUE.equals(mobile))
			q.append(
					" (stazione_tipologia_staz:\"mezzo mobile\" OR stazione_tipologia_staz:\"stazione trasportabile\")");
		if (Boolean.FALSE.equals(mobile))
			q.append(" stazione_tipologia_staz:\"stazione fissa\"");
		if (listStationTypeId != null && !listStationTypeId.isEmpty()) {
			q.append(" (");
			boolean first = true;
			for (String stTypeId : listStationTypeId) {
				q.append((first ? "" : " OR ") + "stazione_id_tipologia_staz:" + stTypeId);
				first = false;
			}
			q.append(")");
		}
		if (listZoneTypeId != null && !listZoneTypeId.isEmpty()) {
			q.append(" (");
			boolean first = true;
			for (String zTypeId : listZoneTypeId) {
				q.append((first ? "" : " OR ") + "stazione_id_caratt_zona:" + zTypeId);
				first = false;
			}
			q.append(")");
		}
	}

	protected void addCommonParamsCop(StringBuilder q, Boolean publicOwner, Boolean publicManagement) {
		if (Boolean.TRUE.equals(publicOwner)) {
			if (Boolean.FALSE.equals(publicManagement))
				q.append(" (rete_fl_privata:0 AND rete_fl_privata:\"-1\")");
			else
				q.append(" rete_fl_privata:0");
		} else if (Boolean.FALSE.equals(publicOwner)) {
			if (Boolean.TRUE.equals(publicManagement))
				q.append(" rete_fl_privata:1");
			else if (Boolean.FALSE.equals(publicManagement))
				q.append(" rete_fl_privata:\"-1\"");
			else
				q.append(" (rete_fl_privata:1 OR rete_fl_privata:\"-1\")");
		} else {
			if (Boolean.TRUE.equals(publicManagement))
				q.append(" (rete_fl_privata:0 OR rete_fl_privata:1)");
			else if (Boolean.FALSE.equals(publicManagement))
				q.append(" rete_fl_privata:\"-1\"");
		}
	}

}
