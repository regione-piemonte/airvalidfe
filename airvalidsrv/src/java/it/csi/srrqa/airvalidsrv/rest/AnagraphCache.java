/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;

import it.csi.srrqa.airdb.model.DBConstants;
import it.csi.srrqa.airdb.model.DBRecordWithHistory;
import it.csi.srrqa.airdb.model.DataUtils;
import it.csi.srrqa.airdb.model.NameWithKey;
import it.csi.srrqa.airdb.model.NameWithKeyAndPeriod;
import it.csi.srrqa.airdb.model.NetSensorKey;
import it.csi.srrqa.airdb.model.Network;
import it.csi.srrqa.airdb.model.NetworkRecord;
import it.csi.srrqa.airdb.model.Parameter;
import it.csi.srrqa.airdb.model.Sensor;
import it.csi.srrqa.airdb.model.SensorRecord;
import it.csi.srrqa.airdb.model.Station;
import it.csi.srrqa.airdb.model.StationRecord;
import it.csi.srrqa.airdb.model.ValidationCode;
import it.csi.srrqa.airvalidsrv.rest.SensorId.MatchType;
import it.csi.webauth.db.model.FunctionFlags;

// Cache delle informazioni di anagrafica
public class AnagraphCache {

	private static final int EXPIRY_TIME_SHORT_MIN = 720;
	private static final int EXPIRY_TIME_LONG_MIN = 1440;
	private static Logger lg = Logger
			.getLogger(AirValidApp.LOGGER_BASENAME + "." + AnagraphCache.class.getSimpleName());

	private AirDbClientProvider clientProvider;
	private String _dbId;
	private CacheItem<Map<String, String>> mapParameterNames;
	private CacheItem<Map<String, Parameter>> mapParameters;
	private CacheItem<List<NameWithKey>> parameterNames;
	private CacheItem<List<NameWithKey>> stationTypeNames;
	private CacheItem<List<NameWithKey>> zoneTypeNames;
	private CacheItem<Map<String, NameWithKey>> mapMeasureUnitNames;
	private CacheItem<List<ValidationCode>> validationCodes;
	private CacheItem<Map<String, Network>> mapNetworks;
	private CacheItem<Map<String, String>> mapStationClassificationNames;
	private CacheItem<Map<String, String>> mapAreaClassificationNames;
	private CacheItem<Map<String, NameWithKey>> mapCityNames;
	private Map<String, CacheItem<List<Station>>> stationsByNetworkMap;
	private Map<String, CacheItem<List<Sensor>>> sensorsByStationMap;
	private Map<String, CacheItem<Set<String>>> srrqaNetworkStationsMap;
	private Map<String, CacheItem<List<NetSensorKey>>> relatedSensorsBySensorMap;
	private MeasureCorrector corrector = new MeasureCorrector();

	public AnagraphCache(AirDbClientProvider airDbRestClientProvider, String dbId) {
		this.clientProvider = airDbRestClientProvider;
		this._dbId = dbId;
		parameterNames = new CacheItem<List<NameWithKey>>(EXPIRY_TIME_SHORT_MIN) {
			@Override
			protected List<NameWithKey> loadItem() {
				return clientProvider.getAirDbServiceClient(_dbId).getParameterNames(null);
			}
		};
		stationTypeNames = new CacheItem<List<NameWithKey>>(EXPIRY_TIME_LONG_MIN) {
			@Override
			protected List<NameWithKey> loadItem() {
				return clientProvider.getAirDbServiceClient(_dbId).getStationTypeNames();
			}
		};
		zoneTypeNames = new CacheItem<List<NameWithKey>>(EXPIRY_TIME_LONG_MIN) {
			@Override
			protected List<NameWithKey> loadItem() {
				return clientProvider.getAirDbServiceClient(_dbId).getCarattZonaNames();
			}
		};
		mapParameterNames = new CacheItem<Map<String, String>>(EXPIRY_TIME_SHORT_MIN) {
			@Override
			protected Map<String, String> loadItem() {
				Map<String, String> map = new HashMap<String, String>();
				for (NameWithKey nwk : parameterNames.getItem())
					map.put(nwk.getKey(), nwk.getName());
				return map;
			}
		};
		mapParameters = new CacheItem<Map<String, Parameter>>(EXPIRY_TIME_SHORT_MIN) {
			@Override
			protected Map<String, Parameter> loadItem() {
				Map<String, Parameter> map = new HashMap<String, Parameter>();
				for (Parameter p : clientProvider.getAirDbServiceClient(_dbId).getParameters())
					map.put(p.keyToString(), p);
				return map;
			}
		};
		mapMeasureUnitNames = new CacheItem<Map<String, NameWithKey>>(EXPIRY_TIME_SHORT_MIN) {
			@Override
			protected Map<String, NameWithKey> loadItem() {
				Map<String, NameWithKey> map = new LinkedHashMap<String, NameWithKey>();
				for (NameWithKey nwk : clientProvider.getAirDbServiceClient(_dbId).getMeasureUnitNames(null))
					map.put(nwk.getKey(), nwk);
				return map;
			}
		};
		validationCodes = new CacheItem<List<ValidationCode>>(EXPIRY_TIME_LONG_MIN) {
			@Override
			protected List<ValidationCode> loadItem() {
				return clientProvider.getAirDbServiceClient(_dbId).getValidationCodes();
			}
		};
		mapNetworks = new CacheItem<Map<String, Network>>(EXPIRY_TIME_SHORT_MIN) {
			@Override
			protected Map<String, Network> loadItem() {
				Map<String, Network> map = new HashMap<String, Network>();
				for (Network n : clientProvider.getAirDbServiceClient(_dbId).getNetworks(true, null, null))
					map.put(n.keyToString(), n);
				return map;
			}
		};
		mapStationClassificationNames = new CacheItem<Map<String, String>>(EXPIRY_TIME_LONG_MIN) {
			@Override
			protected Map<String, String> loadItem() {
				Map<String, String> map = new HashMap<String, String>();
				for (NameWithKey nwk : clientProvider.getAirDbServiceClient(_dbId).getStationClassificationNames())
					map.put(nwk.getKey(), nwk.getName());
				return map;
			}
		};
		mapAreaClassificationNames = new CacheItem<Map<String, String>>(EXPIRY_TIME_LONG_MIN) {
			@Override
			protected Map<String, String> loadItem() {
				Map<String, String> map = new HashMap<String, String>();
				for (NameWithKey nwk : clientProvider.getAirDbServiceClient(_dbId).getAreaClassificationNames())
					map.put(nwk.getKey(), nwk.getName());
				return map;
			}
		};
		mapCityNames = new CacheItem<Map<String, NameWithKey>>(EXPIRY_TIME_LONG_MIN) {
			@Override
			protected Map<String, NameWithKey> loadItem() {
				Map<String, NameWithKey> map = new HashMap<String, NameWithKey>();
				for (NameWithKey nwk : clientProvider.getAirDbServiceClient(_dbId).getCityNames())
					map.put(nwk.getKey(), nwk);
				return map;
			}
		};
		stationsByNetworkMap = new HashMap<String, CacheItem<List<Station>>>();
		sensorsByStationMap = new HashMap<String, CacheItem<List<Sensor>>>();
		srrqaNetworkStationsMap = new HashMap<String, CacheItem<Set<String>>>();
		relatedSensorsBySensorMap = new HashMap<String, CacheItem<List<NetSensorKey>>>();
	}

	public void invalidate() {
		mapParameterNames.invalidate();
		mapParameters.invalidate();
		parameterNames.invalidate();
		stationTypeNames.invalidate();
		zoneTypeNames.invalidate();
		mapMeasureUnitNames.invalidate();
		mapStationClassificationNames.invalidate();
		mapAreaClassificationNames.invalidate();
		mapCityNames.invalidate();
		validationCodes.invalidate();
		mapNetworks.invalidate();
		for (CacheItem<List<Station>> ci : stationsByNetworkMap.values())
			ci.invalidate();
		for (CacheItem<List<Sensor>> ci : sensorsByStationMap.values())
			ci.invalidate();
		for (CacheItem<Set<String>> ci : srrqaNetworkStationsMap.values())
			ci.invalidate();
		for (CacheItem<List<NetSensorKey>> ci : relatedSensorsBySensorMap.values())
			ci.invalidate();
	}

	public String getParameterName(String parameterId) {
		return mapParameterNames.getItem().get(parameterId);
	}

	public List<NameWithKey> getParameterNames() {
		return parameterNames.getItem();
	}

	public List<NameWithKey> getStationTypeNames() {
		return stationTypeNames.getItem();
	}

	public List<NameWithKey> getZoneTypeNames() {
		return zoneTypeNames.getItem();
	}

	public List<NameWithKey> getParameterNames(String nameFilter) {
		if (nameFilter == null || nameFilter.isEmpty())
			return getParameterNames();
		List<NameWithKey> filteredNames = new ArrayList<NameWithKey>();
		for (NameWithKey nwk : getParameterNames())
			if (nwk.getName() != null && nwk.getName().toLowerCase().contains(nameFilter.toLowerCase()))
				filteredNames.add(nwk);
		return filteredNames;
	}

	public Collection<Parameter> getParameters() {
		return mapParameters.getItem().values();
	}

	public Parameter getParameter(String parameterId) {
		return mapParameters.getItem().get(parameterId);
	}

	public String getMeasureUnitId(String parameterId) {
		Parameter param = mapParameters.getItem().get(parameterId);
		return param == null ? null : param.getId_unita_misura();
	}

	public Boolean isVirtual(String parameterId) {
		Parameter param = mapParameters.getItem().get(parameterId);
		return param == null ? null : DBConstants.YES_STR.equals(param.getFlag_virtuale());
	}

	public Collection<NameWithKey> getMeasureUnitNames() {
		return mapMeasureUnitNames.getItem().values();
	}

	public NameWithKey getMeasureUnit(String measureUnitId) {
		return mapMeasureUnitNames.getItem().get(measureUnitId);
	}

	public Map<String, String> getStationClassificationNamesMap() {
		return mapStationClassificationNames.getItem();
	}

	public String getStationClassificationName(String id_tp_stazione) {
		return mapStationClassificationNames.getItem().get(id_tp_stazione);
	}

	public Map<String, String> getAreaClassificationNamesMap() {
		return mapAreaClassificationNames.getItem();
	}

	public String getAreaClassificationName(String id_tp_zona) {
		return mapAreaClassificationNames.getItem().get(id_tp_zona);
	}

	public Map<String, NameWithKey> getCityNamesMap() {
		return mapCityNames.getItem();
	}

	public NameWithKey getCityName(String codice_istat_comune) {
		return mapCityNames.getItem().get(codice_istat_comune);
	}

	public List<ValidationCode> getValidationCodes() {
		return validationCodes.getItem();
	}

	public List<NameWithKeyAndPeriod> getNetworkNames(Date beginDate, Date endDate, String owner, UserCache userCache,
			AuthCache authCache) throws AuthException {
		Collection<Network> listNet = getNetworks(beginDate, endDate);
		List<NameWithKeyAndPeriod> listNames = new ArrayList<NameWithKeyAndPeriod>();
		for (Network net : listNet) {
			String authInfo = getItemAuthInfo(net.key(), MatchType.NET, userCache, authCache, false);
			if (authInfo != null) {
				Date netBeginDate = null;
				Date netEndDate = null;
				String flags = "";
				List<NetworkRecord> listRecords = net.getRecords();
				if (listRecords.size() > 0) {
					NetworkRecord last = listRecords.get(0);
					netBeginDate = listRecords.get(listRecords.size() - 1).getData_inizio();
					netEndDate = last.getData_fine();
					flags = makeFlags(last);
				}
				if (owner == null || owner.contains(flags))
					listNames.add(new NameWithKeyAndPeriod(net.nameToString(), net.key(),
							netBeginDate != null && netEndDate == null, authInfo, flags, netBeginDate, netEndDate));
			}
		}
		Collections.sort(listNames);
		return listNames;
	}

	private String makeFlags(NetworkRecord last) {
		String flags = "";
		if (last.getFl_privata() != null) {
			if (last.getFl_privata() == 0) // rete pubblica
				flags = "public";
			else if (last.getFl_privata() == -1) // rete privata
				flags = "private";
			else if (last.getFl_privata() == 1) // rete privata a gestione pubblica
				flags = "public_managed";
		}
		return flags;
	}

	private Collection<Network> getNetworks(Date beginDate, Date endDate) {
		if (beginDate == null && endDate == null)
			return mapNetworks.getItem().values();
		List<Network> result = new ArrayList<Network>();
		for (Network net : mapNetworks.getItem().values()) {
			Network netTimeFiltered = getNetworkImpl(net, beginDate, endDate);
			if (netTimeFiltered != null)
				result.add(netTimeFiltered);
		}
		return result;
	}

	public Network getNetwork(String networkId, Date beginDate, Date endDate) {
		Network net = mapNetworks.getItem().get(networkId);
		return getNetworkImpl(net, beginDate, endDate);
	}

	private Network getNetworkImpl(Network net, Date beginDate, Date endDate) {
		if (net == null)
			return null;
		if (beginDate == null && endDate == null)
			return net;
		Network netTimeFiltered;
		try {
			netTimeFiltered = (Network) DataUtils.copy(net);
		} catch (Exception e) { // Should never happen
			return net;
		}
		ListIterator<NetworkRecord> li = netTimeFiltered.getRecords().listIterator();
		while (li.hasNext()) {
			NetworkRecord record = li.next();
			if (!isOverlapping(record, beginDate, endDate))
				li.remove();
		}
		if (netTimeFiltered.getRecords().size() > 0)
			return netTimeFiltered;
		return null;
	}

	public List<NameWithKeyAndPeriod> getStationNamesForNetwork(String networkId, Date beginDate, Date endDate,
			UserCache userCache, AuthCache authCache) throws AuthException {
		Collection<Station> listStations = getStationsForNetwork(networkId, beginDate, endDate);
		List<NameWithKeyAndPeriod> listNames = new ArrayList<NameWithKeyAndPeriod>();
		for (Station station : listStations) {
			String authInfo = getItemAuthInfo(Utils.makeStationId(networkId, station), MatchType.STATION, userCache,
					authCache, false);
			if (authInfo != null) {
				Date stationBeginDate = null;
				Date stationEndDate = null;
				List<StationRecord> listRecords = station.getRecords();
				if (listRecords.size() > 0) {
					stationBeginDate = listRecords.get(listRecords.size() - 1).getData_inizio();
					stationEndDate = listRecords.get(0).getData_fine();
					if (listRecords.get(0).getId_tipologia_staz() == 4) // Tipo Magazzino esclusi da validatore
						continue;
				}
				listNames.add(new NameWithKeyAndPeriod(getStationName(station), networkId + "." + station.key(),
						stationBeginDate != null && stationEndDate == null, authInfo, null, stationBeginDate,
						stationEndDate));
			}
		}
		Collections.sort(listNames);
		return listNames;
	}

	private String getStationName(Station station) {
		if (station.getRecords().size() > 0) {
			String pubName = station.getRecords().get(0).getNome_pubblico();
			if (pubName != null && !pubName.isEmpty())
				return pubName;
		}
		return station.nameToString();
	}

	private List<Station> getStationsForNetwork(final String networkId) {
		CacheItem<List<Station>> ci = stationsByNetworkMap.get(networkId);
		if (ci == null) {
			ci = new CacheItem<List<Station>>(EXPIRY_TIME_SHORT_MIN) {
				@Override
				protected List<Station> loadItem() {
					return clientProvider.getAirDbServiceClient(_dbId).getStations(networkId, null, null);
				}
			};
			stationsByNetworkMap.put(networkId, ci);
		}
		return ci.getItem();
	}

	private Collection<Station> getStationsForNetwork(String networkId, Date beginDate, Date endDate) {
		if (beginDate == null && endDate == null)
			return getStationsForNetwork(networkId);
		List<Station> result = new ArrayList<Station>();
		for (Station station : getStationsForNetwork(networkId)) {
			Station stationTimeFiltered = getStationImpl(station, beginDate, endDate);
			if (stationTimeFiltered != null)
				result.add(stationTimeFiltered);
		}
		return result;
	}

	public Station getStation(String stationId, Date beginDate, Date endDate) {
		String networkId = Utils.extractNetId(stationId);
		Collection<Station> listStations = getStationsForNetwork(networkId, beginDate, endDate);
		String stationKey = Utils.removeNetId(stationId);
		for (Station station : listStations) {
			if (stationKey.equals(station.key()))
				return getStationImpl(station, beginDate, endDate);
		}
		return null;
	}

	private Station getStationImpl(Station station, Date beginDate, Date endDate) {
		if (station == null)
			return null;
		if (beginDate == null && endDate == null)
			return station;
		Station stationTimeFiltered;
		try {
			stationTimeFiltered = (Station) DataUtils.copy(station);
		} catch (Exception e) { // Should never happen
			return station;
		}
		ListIterator<StationRecord> li = stationTimeFiltered.getRecords().listIterator();
		while (li.hasNext()) {
			StationRecord record = li.next();
			if (!isOverlapping(record, beginDate, endDate))
				li.remove();
		}
		if (stationTimeFiltered.getRecords().size() > 0)
			return stationTimeFiltered;
		return null;
	}

	public List<SensorNameWithKeyAndPeriod> getSensorNamesForStation(String stationId, Date beginDate, Date endDate,
			UserCache userCache, AuthCache authCache) throws AuthException {
		Collection<Sensor> listSensors = getSensorsForStation(stationId, beginDate, endDate);
		List<SensorNameWithKeyAndPeriod> listNames = new ArrayList<SensorNameWithKeyAndPeriod>();
		String networkId = Utils.extractNetId(stationId);
		for (Sensor sensor : listSensors) {
			Boolean virtual = isVirtual(sensor.getId_parametro());
			boolean forceReadOnly = Boolean.TRUE.equals(virtual);
			String authInfo = getItemAuthInfo(Utils.makeSensorId(networkId, sensor), MatchType.SENSOR, userCache,
					authCache, forceReadOnly);
			if (authInfo != null) {
				Date sensorBeginDate = null;
				Date sensorEndDate = null;
				Integer regTime = null;
				Integer numDec = null;
				List<SensorRecord> listRecords = sensor.getRecords();
				if (listRecords.size() > 0) {
					sensorBeginDate = listRecords.get(listRecords.size() - 1).getData_inizio();
					sensorEndDate = listRecords.get(0).getData_fine();
					regTime = listRecords.get(0).getTempo_registrazione();
					numDec = listRecords.get(0).getNum_decimale_mce();
				}
				String paramId = sensor.getId_parametro();
				listNames.add(new SensorNameWithKeyAndPeriod(getParameterName(paramId),
						Utils.makeSensorId(networkId, sensor), sensorBeginDate != null && sensorEndDate == null,
						authInfo, null, sensorBeginDate, sensorEndDate, getMeasureUnitId(paramId), regTime, numDec,
						virtual, corrector.isSupported(paramId)));
			}
		}
		return listNames;
	}

	private List<Sensor> getSensorsForStation(final String stationId) {
		CacheItem<List<Sensor>> ci = sensorsByStationMap.get(stationId);
		if (ci == null) {
			ci = new CacheItem<List<Sensor>>(EXPIRY_TIME_SHORT_MIN) {
				@Override
				protected List<Sensor> loadItem() {
					return clientProvider.getAirDbServiceClient(_dbId).getSensors(Utils.removeNetId(stationId), null,
							null);
				}
			};
			sensorsByStationMap.put(stationId, ci);
		}
		return ci.getItem();
	}

	private Collection<Sensor> getSensorsForStation(String stationId, Date beginDate, Date endDate) {
		if (beginDate == null && endDate == null)
			return getSensorsForStation(stationId);
		List<Sensor> result = new ArrayList<Sensor>();
		for (Sensor sensor : getSensorsForStation(stationId)) {
			Sensor sensorTimeFiltered = getSensorImpl(sensor, beginDate, endDate);
			if (sensorTimeFiltered != null)
				result.add(sensorTimeFiltered);
		}
		return result;
	}

	public List<NetSensorKey> getRelatedSensors(String sensorId, UserCache userCache, AuthCache authCache)
			throws AuthException {
		List<NetSensorKey> listSensorKeys = getRelatedSensorsForSensor(sensorId);
		List<NetSensorKey> listResult = new ArrayList<NetSensorKey>();
		for (NetSensorKey nsk : listSensorKeys) {
			String authInfo = getItemAuthInfo(nsk.key(), MatchType.SENSOR, userCache, authCache, false);
			if (authInfo != null)
				listResult.add(nsk);
		}
		return listResult;
	}

	private List<NetSensorKey> getRelatedSensorsForSensor(final String sensorId) {
		CacheItem<List<NetSensorKey>> ci = relatedSensorsBySensorMap.get(sensorId);
		if (ci == null) {
			ci = new CacheItem<List<NetSensorKey>>(EXPIRY_TIME_SHORT_MIN) {
				@Override
				protected List<NetSensorKey> loadItem() {
					return clientProvider.getAirDbServiceClient(_dbId).getRelatedSensors(sensorId);
				}
			};
			relatedSensorsBySensorMap.put(sensorId, ci);
		}
		return ci.getItem();
	}

	public Sensor getSensor(String sensorId, Date beginDate, Date endDate) {
		String stationId = Utils.extractStationId(sensorId);
		Collection<Sensor> listSensors = getSensorsForStation(stationId, beginDate, endDate);
		String sensorKey = Utils.removeNetId(sensorId);
		for (Sensor sensor : listSensors) {
			if (sensorKey.equals(sensor.key()))
				return getSensorImpl(sensor, beginDate, endDate);
		}
		return null;
	}

	private Sensor getSensorImpl(Sensor sensor, Date beginDate, Date endDate) {
		if (sensor == null)
			return null;
		if (beginDate == null && endDate == null)
			return sensor;
		Sensor sensorTimeFiltered;
		try {
			sensorTimeFiltered = (Sensor) DataUtils.copy(sensor);
		} catch (Exception e) { // Should never happen
			return sensor;
		}
		ListIterator<SensorRecord> li = sensorTimeFiltered.getRecords().listIterator();
		while (li.hasNext()) {
			SensorRecord record = li.next();
			if (!isOverlapping(record, beginDate, endDate))
				li.remove();
		}
		if (sensorTimeFiltered.getRecords().size() > 0)
			return sensorTimeFiltered;
		return null;
	}

	public Set<String> getStationKeys(final String networkId) {
		CacheItem<Set<String>> ci = srrqaNetworkStationsMap.get(networkId);
		if (ci == null) {
			ci = new CacheItem<Set<String>>(EXPIRY_TIME_SHORT_MIN) {
				@Override
				protected Set<String> loadItem() {
					Set<String> setSK = new HashSet<String>();
					List<NameWithKey> listNWK = clientProvider.getAirDbServiceClient(_dbId)
							.getStationNamesForNetwork(networkId, null);
					for (NameWithKey nwk : listNWK)
						setSK.add(nwk.getKey());
					return setSK;
				}
			};
			srrqaNetworkStationsMap.put(networkId, ci);
		}
		return ci.getItem();
	}

	public List<NameWithKey> getParameterNames(Integer componentNumber) {
		List<NameWithKey> names = new ArrayList<NameWithKey>();
		Map<String, Parameter> mapParams = mapParameters.getItem();
		for (Parameter p : mapParams.values())
			if (p.getComponent_number() != null && p.getComponent_number().equals(componentNumber))
				names.add(new NameWithKey(p.getDenominazione(), p.getId_parametro()));
		return names;
	}

	public SensorContextInfo getSensorContextInfo(String sensorId, UserCache userCache, AuthCache authCache)
			throws AuthException {
		SensorContextInfo info = new SensorContextInfo();
		String networkId = Utils.extractNetId(sensorId);
		String stationId = Utils.extractStationId(sensorId);
		lg.debug("networkId: " + networkId);
		lg.debug("stationId: " + stationId);
		lg.debug("sensorId: " + sensorId);

		Network net = getNetwork(networkId, null, null);
		if (net == null)
			return null;
		String authInfo = getItemAuthInfo(net.key(), MatchType.NET, userCache, authCache, false);
		if (authInfo == null)
			return null;
		Date netBeginDate = null;
		Date netEndDate = null;
		String flags = "";
		List<NetworkRecord> listRecords = net.getRecords();
		if (listRecords.size() > 0) {
			NetworkRecord last = listRecords.get(0);
			netBeginDate = listRecords.get(listRecords.size() - 1).getData_inizio();
			netEndDate = last.getData_fine();
			flags = makeFlags(last);
		}
		info.setNetworkName(new NameWithKeyAndPeriod(net.nameToString(), net.key(),
				netBeginDate != null && netEndDate == null, authInfo, flags, netBeginDate, netEndDate));

		Station station = getStation(stationId, null, null);
		if (station == null)
			return null;
		authInfo = getItemAuthInfo(stationId, MatchType.STATION, userCache, authCache, false);
		if (authInfo == null)
			return null;
		Date stationBeginDate = null;
		Date stationEndDate = null;
		List<StationRecord> listStRecords = station.getRecords();
		if (listStRecords.size() > 0) {
			stationBeginDate = listStRecords.get(listStRecords.size() - 1).getData_inizio();
			stationEndDate = listStRecords.get(0).getData_fine();
			if (listStRecords.get(0).getId_tipologia_staz() == 4) // Tipo Magazzino esclusi da validatore
				return null;
		}
		info.setStationName(new NameWithKeyAndPeriod(station.nameToString(), networkId + "." + station.key(),
				stationBeginDate != null && stationEndDate == null, authInfo, null, stationBeginDate, stationEndDate));

		Sensor sensor = getSensor(sensorId, null, null);
		if (sensor == null)
			return null;
		Boolean virtual = isVirtual(sensor.getId_parametro());
		boolean forceReadOnly = Boolean.TRUE.equals(virtual);
		authInfo = getItemAuthInfo(sensorId, MatchType.SENSOR, userCache, authCache, forceReadOnly);
		if (authInfo == null)
			return null;
		Date sensorBeginDate = null;
		Date sensorEndDate = null;
		Integer regTime = null;
		Integer numDec = null;
		List<SensorRecord> listSeRecords = sensor.getRecords();
		if (listSeRecords.size() > 0) {
			sensorBeginDate = listSeRecords.get(listSeRecords.size() - 1).getData_inizio();
			sensorEndDate = listSeRecords.get(0).getData_fine();
			regTime = listSeRecords.get(0).getTempo_registrazione();
			numDec = listSeRecords.get(0).getNum_decimale_mce();
		}
		String paramId = sensor.getId_parametro();
		info.setSensorName(new SensorNameWithKeyAndPeriod(getParameterName(paramId), sensorId,
				sensorBeginDate != null && sensorEndDate == null, authInfo, null, sensorBeginDate, sensorEndDate,
				getMeasureUnitId(paramId), regTime, numDec, virtual, corrector.isSupported(paramId)));

		return info;
	}

	public String getItemAuthInfo(String itemId, MatchType itemType, UserCache userCache, AuthCache authCache,
			boolean forceReadOnly) throws AuthException {
		Map<Integer, FunctionFlags> mapDF = userCache.getSrrqaDomainFlagsMap();
		for (Integer domain : mapDF.keySet()) {
			FunctionFlags ff = mapDF.get(domain);
			if (ff == null)
				continue;
			Set<SensorId> sensorIds = authCache.getSrrqaDomainSensorIdsMap().get(domain);
			String authInfo = getItemAuthInfoFromSensorIds(itemId, itemType, ff, sensorIds, forceReadOnly);
			if (authInfo != null)
				return authInfo;
		}
		return null;
	}

	private String getItemAuthInfoFromSensorIds(String itemId, MatchType itemType, FunctionFlags ff,
			Set<SensorId> sensorIds, boolean forceReadOnly) {
		if (sensorIds == null)
			return null;
		for (SensorId id : sensorIds) {
			if (id.matches(itemId, itemType)) {
				String result = "" + (ff.getWriteFlag() && !forceReadOnly ? " write" : "")
						+ (ff.getAdvancedFlag() ? " advanced" : "");
				return result.trim();
			}
		}
		return null;
	}

	private boolean isOverlapping(DBRecordWithHistory record, Date beginDate, Date endDate) {
		if (endDate != null) {
			if (record.getData_inizio().after(endDate))
				return false;
		}
		if (beginDate != null) {
			if (record.getData_fine() != null && record.getData_fine().before(beginDate))
				return false;
		}
		return true;
	}

}
