/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import it.csi.srrqa.airdb.model.SensorKey;
import it.csi.srrqa.airdb.model.StationKey;

public class Utils {

	public static String extractNetId(String sensorId) {
		if (sensorId == null)
			return null;
		String[] fields = sensorId.split("\\.");
		return fields[0];
	}

	public static String extractStationId(String sensorId) {
		if (sensorId == null)
			return null;
		String[] fields = sensorId.split("\\.");
		return fields[0] + (fields.length > 1 ? "." + fields[1] : "") + (fields.length > 2 ? "." + fields[2] : "");
	}

	public static String removeNetId(String stationId) {
		if (stationId == null)
			return null;
		int index = stationId.indexOf('.');
		if (index >= 0)
			return stationId.substring(index + 1);
		return stationId;
	}
	
	public static String makeSensorId(String networkId, SensorKey sensorKey) {
		return networkId + "." + sensorKey.key();
	}

	public static String makeStationId(String networkId, StationKey stationKey) {
		return networkId + "." + stationKey.key();
	}

	public static String objToStr(Object o) {
		return o == null ? null : o.toString();
	}

	public static String str(Object o) {
		return o == null ? "" : o.toString();
	}

}
