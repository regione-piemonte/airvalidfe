/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

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
import it.csi.srrqa.airdb.model.Measure;
import it.csi.srrqa.airdb.model.Preference;
import it.csi.srrqa.airdb.rest.client.AirDbRestClient;
import it.csi.srrqa.airvalidsrv.rest.SensorId.MatchType;
import it.csi.webauth.client.AuthDbRestClient;
import it.csi.webauth.db.model.FunctionFlags;
import it.csi.webauth.db.model.Utente;

public abstract class RestService implements AuthClientProvider, AirDbClientProvider {

	private static final String DB_COP = "cop";
	private static final String DB_REG = "reg";
	private static final String UNPARSEABLE_PARAM = "Unparseable parameter";
	private static final String VALUE = "value";
	private static final String USER = "User";
	private static final String DOES_NOT_HAVE_FUNCTION = "does not have function";
	private static final String UNSPECIFIED_USER_ID = "Unspecified user id";
	private static final String FUNCTION = "function";
	private static final String ADVANCED = "advanced";
	private static final String WRITE = "write";
	private static final String UNKNOWN_DB_ID = "Unknown DB id";
	private static Logger lg = Logger.getLogger(AirValidApp.LOGGER_BASENAME + "." + RestService.class.getSimpleName());
	private static ExecutorService executor = Executors.newCachedThreadPool();
	private ServiceConfig airDbServiceCfg;
	private ServiceConfig copDbServiceCfg;
	private ServiceConfig authServiceCfg;
	private boolean enableShibbolet;
	private ResteasyClientBuilder airDbClientBuilder;
	private ResteasyClientBuilder copDbClientBuilder;
	private ResteasyClientBuilder authClientBuilder;
	private Map<String, UserCache> mapUserCache = new HashMap<String, UserCache>();
	private AuthCache authCache;
	private AnagraphCache airDbAnagraphCache;
	private AnagraphCache copDbAnagraphCache;
	private Map<String, DataLock> mapDataLockAirDb = new HashMap<String, DataLock>();
	private Map<String, DataLock> mapDataLockCopDb = new HashMap<String, DataLock>();
	private int measureLockTimeout_m;

	public RestService(ServiceConfig airDbServiceCfg, ServiceConfig copDbServiceCfg, ServiceConfig authServiceCfg,
			boolean enableShibbolet, int measureLockTimeout_m, boolean disableTrustManager) {
		this.airDbServiceCfg = airDbServiceCfg;
		this.copDbServiceCfg = copDbServiceCfg;
		this.authServiceCfg = authServiceCfg;
		this.enableShibbolet = enableShibbolet;
		lg.debug("Rest service clients initialization...");
		airDbClientBuilder = new ResteasyClientBuilder();
		copDbClientBuilder = new ResteasyClientBuilder();
		authClientBuilder = new ResteasyClientBuilder();
		if (disableTrustManager) {
			airDbClientBuilder.disableTrustManager();
			copDbClientBuilder.disableTrustManager();
			authClientBuilder.disableTrustManager();
		}
		lg.debug("Initializing caches...");
		authCache = new AuthCache(this);
		airDbAnagraphCache = new AnagraphCache(this, DB_REG);
		copDbAnagraphCache = new AnagraphCache(this, DB_COP);
		this.measureLockTimeout_m = measureLockTimeout_m;
		lg.debug("Initialization completed");
	}

	protected void runTask(ServiceTask task) {
		runTask(task, false);
	}

	protected void runTask(final ServiceTask task, final boolean write) {
		lg.debug(task + " " + FUNCTION + " called");
		executor.submit(new Runnable() {
			public void run() {
				try {
					Object result = task.execute();
					if (result == null)
						task.getAsyncResponse().resume(Response.status(Status.NO_CONTENT).build());
					else
						task.getAsyncResponse().resume(Response.ok(result).build());
				} catch (BadRequestException e) {
					lg.debug(e.getMessage(), e);
					task.getAsyncResponse().resume(Response.status(Status.BAD_REQUEST)
							.entity(new ServiceError(ServiceError.Code.INVALID_PARAM, e)).build());
				} catch (NotFoundException e1) {
					lg.debug(e1.getMessage(), e1);
					task.getAsyncResponse().resume(Response.status(Status.NO_CONTENT).build());
				} catch (LockException e2) {
					lg.debug(e2.getMessage(), e2);
					task.getAsyncResponse().resume(Response.status(Status.FORBIDDEN)
							.entity(new ServiceError(ServiceError.Code.RESOURCE_LOCKED, e2)).build());
				} catch (AuthException e3) {
					lg.debug(e3.getMessage(), e3);
					task.getAsyncResponse().resume(Response.status(Status.UNAUTHORIZED)
							.entity(new ServiceError(ServiceError.Code.REQUEST_NOT_AUTHORIZED, e3)).build());
				} catch (Exception e4) {
					lg.error(e4.getMessage(), e4);
					task.getAsyncResponse().resume(Response.status(Status.INTERNAL_SERVER_ERROR)
							.entity(new ServiceError(ServiceError.Code.DATA_SERVICE_ERROR, e4)).build());
				} finally {
				}
			}
		});
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
		UserCache pref = mapUserCache.get(userKey);
		if (pref == null) {
			pref = new UserCache(this, userKey, enableShibbolet);
			mapUserCache.put(userKey, pref);
		}
		return pref;
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

	private String getUserKey(String basicAuthHeader, String userCode) {
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

	protected synchronized DataLock setLock(String basicAuthHeader, String userCode, String dbId, String resourceId,
			int year) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException("Unspecified user id '" + userKey + "'");
		DataLock lock = getDataLock(dbId, resourceId, year);
		if (lock == null) {
			lock = new DataLock(resourceId, year, userKey, getUserInfo(userKey).toString());
			getMapDataLock(dbId).put(resourceId + "@" + year, lock);
			return lock.copy(true);
		}
		if (userKey.equals(lock.getUserId())) {
			lock.setDate(new Date());
			return lock.copy(true);
		}
		return lock.copy(false);
	}

	protected synchronized DataLock readLock(String basicAuthHeader, String userCode, String dbId, String resourceId,
			int year) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		DataLock lock = getDataLock(dbId, resourceId, year);
		if (lock == null) {
			return new DataLock(resourceId, year, null, null, null, false, false);
		}
		return lock.copy(userKey.equals(lock.getUserId()));
	}

	protected synchronized DataLock clearLock(String basicAuthHeader, String userCode, String dbId, String resourceId,
			int year) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		DataLock lock = getDataLock(dbId, resourceId, year);
		if (lock == null)
			return new DataLock(resourceId, year, null, null, null, false, false);
		if (userKey.equals(lock.getUserId())) {
			getMapDataLock(dbId).remove(resourceId + "@" + year);
			return new DataLock(resourceId, year, null, null, null, false, false);
		}
		return lock.copy(false);
	}

	protected synchronized int clearAllLocks(String basicAuthHeader, String userCode, String dbId) {
		String userKey = getUserKey(basicAuthHeader, userCode);
		if (userKey == null || userKey.trim().isEmpty())
			throw new IllegalStateException(UNSPECIFIED_USER_ID + " '" + userKey + "'");
		int count = 0;
		Iterator<DataLock> itLock = getMapDataLock(dbId).values().iterator();
		while (itLock.hasNext()) {
			if (userKey.equals(itLock.next().getUserId())) {
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
		DataLock lock = readLock(basicAuthHeader, userCode, dbId, resourceId, year);
		if (!lock.isLocked())
			throw new LockException("Resource '" + resourceId + "' is not locked for year " + year);
		if (lock.isLocked() && !Boolean.TRUE.equals(lock.getMyLock()))
			throw new LockException("Resource '" + resourceId + "' is locked by other user '" + lock.getUserId()
					+ "' for year " + year);
	}

	private DataLock getDataLock(String dbId, String resourceId, int year) {
		DataLock lock = getMapDataLock(dbId).get(resourceId + "@" + year);
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

	private Map<String, DataLock> getMapDataLock(String dbId) {
		if (DB_COP.equalsIgnoreCase(dbId))
			return mapDataLockCopDb;
		if (DB_REG.equalsIgnoreCase(dbId))
			return mapDataLockAirDb;
		throw new IllegalArgumentException(UNKNOWN_DB_ID + " '" + dbId + "'");
	}

}
