/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.text.MessageFormat;
import java.util.Locale;
import java.util.ResourceBundle;

import org.apache.log4j.Logger;

import it.csi.srrqa.airdb.model.DataUtils;
import it.csi.srrqa.airdb.model.SensorKey;
import it.csi.srrqa.airdb.model.StationKey;

// Valutare se spostare le funzioni e le costanti direttamente legate alla struttura del DB in 'airdb'
public class Utils {

	private static final String MSG_BUNDLE_NAME = "bundles.MessagesBundle";
	private static Logger lg = Logger.getLogger(AirValidApp.LOGGER_BASENAME + "." + Utils.class.getSimpleName());
	private static final String TO_BE_PUBLISHED = "1";
	private static final String NOT_TO_BE_PUBLISHED = "0";

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

	public static String extractParameterId(String sensorId) {
		if (sensorId == null)
			return null;
		String[] fields = sensorId.split("\\.");
		return fields.length > 3 ? fields[3] : "";
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

	public static String makeSensorId(String stationId, String parameterId) {
		return stationId + "." + parameterId;
	}

	public static String makeStationId(String networkId, StationKey stationKey) {
		return networkId + "." + stationKey.key();
	}

	public static String makeNetParamSensorId(String networkId, String parameterId) {
		return networkId + ".*.*." + parameterId;
	}

	public static String objToStr(Object o) {
		return o == null ? null : o.toString();
	}

	public static String str(Object o) {
		return o == null ? "" : o.toString();
	}

	public static ResourceBundle getMessages(String language) {
		return getMessages(language == null ? null : new Locale(language));
	}

	public static Double toDouble(Object o) {
		if (o == null)
			return null;
		try {
			return Double.valueOf(o.toString());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	public static ResourceBundle getMessages(Locale locale) {
		if (locale == null)
			locale = Locale.ITALIAN;
		ResourceBundle messages = null;
		try {
			messages = ResourceBundle.getBundle(MSG_BUNDLE_NAME, locale);
		} catch (Exception ex) {
			try {
				lg.debug("Cannot load bundle messages for locale " + locale, ex);
				messages = ResourceBundle.getBundle(MSG_BUNDLE_NAME, Locale.ENGLISH);
			} catch (Exception ex2) {
				lg.debug("Cannot load bundle messages for locale " + locale, ex);
			}
		}
		return messages;
	}

	public static String getString(ResourceBundle messages, String key, Object... params) {
		if (messages == null)
			return key;
		String string;
		try {
			string = messages.getString(key);
		} catch (Exception ex) {
			lg.debug("Cannot find string for key " + key, ex);
			return key;
		}
		if (params == null)
			return string;
		try {
			return MessageFormat.format(string, params);
		} catch (Exception ex) {
			StringBuilder sb = new StringBuilder();
			sb.append(string);
			for (Object param : params)
				sb.append(" " + param);
			return sb.toString();
		}
	}

	public static String getStringOrNull(ResourceBundle messages, String key) {
		if (messages == null)
			return key;
		try {
			return messages.getString(key);
		} catch (Exception ex) {
			return null;
		}
	}

	public static boolean isDailyDustSensor(SensorNameWithKeyAndPeriod sensor) {
		if (sensor.getMeasurementPeriod() == null || sensor.getMeasurementPeriod() != 1440)
			return false;
		return !DataUtils.isIPAParameter(extractParameterId(sensor.getKey()));
	}

	public static Boolean isToBePublished(String value) {
		Boolean unknown = null;
		if (TO_BE_PUBLISHED.equals(value))
			return true;
		if (NOT_TO_BE_PUBLISHED.equals(value))
			return false;
		return unknown;
	}

}
