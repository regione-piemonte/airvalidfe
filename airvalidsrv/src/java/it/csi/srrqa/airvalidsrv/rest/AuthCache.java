/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;

import it.csi.webauth.db.model.AmbitoAcl;

// Cache delle informazioni di autenticazione
public class AuthCache {

	private static final int EXPIRY_TIME_MIN = 60;
	public static final Integer SENSORID_OBJECT_TYPE = 5;

	private static Logger lg = Logger.getLogger(AirValidApp.LOGGER_BASENAME + "." + AuthCache.class.getSimpleName());
	private AuthClientProvider clientProvider;
	private CacheItem<Map<Integer, Set<SensorId>>> srrqaDomainSensorIdsMap;

	public AuthCache(AuthClientProvider authClientProvider) {
		clientProvider = authClientProvider;
		srrqaDomainSensorIdsMap = new CacheItem<Map<Integer, Set<SensorId>>>(EXPIRY_TIME_MIN) {
			@Override
			protected Map<Integer, Set<SensorId>> loadItem() {
				Map<Integer, Set<SensorId>> domainSensorIdsMap = new HashMap<Integer, Set<SensorId>>();
				List<AmbitoAcl> domainAcls = clientProvider.getAuthServiceClient().getDomainAcls(SENSORID_OBJECT_TYPE);
				for (AmbitoAcl aa : domainAcls) {
					Set<SensorId> setSensorIds = domainSensorIdsMap.get(aa.getIdAmbito());
					if (setSensorIds == null) {
						setSensorIds = new HashSet<SensorId>();
						domainSensorIdsMap.put(aa.getIdAmbito(), setSensorIds);
					}
					try {
						setSensorIds.add(new SensorId(aa.getIdOggetto()));
					} catch (Exception e) {
						lg.error("Invalid sensorId '" + aa.getIdOggetto() + "' from authentication database", e);
					}
				}
				return domainSensorIdsMap;
			}
		};
	}

	public void invalidate() {
		srrqaDomainSensorIdsMap.invalidate();
	}

	public Map<Integer, Set<SensorId>> getSrrqaDomainSensorIdsMap() throws AuthException {
		return srrqaDomainSensorIdsMap.getItem();
	}

}
