/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class SensorId {

	public enum MatchType {
		NET, STATION, SENSOR
	};

	private String netId;
	private String cityId;
	private String itemId;
	private String parameterId;
	private String netId_re;
	private String cityId_re;
	private String itemId_re;
	private String parameterId_re;

	public SensorId() {
	}

	public SensorId(String sensorId) {
		if (sensorId == null)
			throw new IllegalArgumentException("SensorId argument should not be null");
		String[] fields = sensorId.split("\\.", 4);
		if (fields.length < 4)
			throw new IllegalArgumentException("SensorId fields are '" + fields.length + "' expected '4'");
		this.netId = fields[0];
		this.cityId = fields[1];
		this.itemId = fields[2];
		this.parameterId = fields[3];
		this.netId_re = "*".equals(netId) ? ".?." : netId;
		this.cityId_re = "*".equals(cityId) ? ".?.?.?.?.?." : cityId;
		this.itemId_re = "*".equals(itemId) ? "[0-9]+" : itemId;
		this.parameterId_re = "*".equals(parameterId) ? ".+" : parameterId;
	}

	public boolean matchesNetwork(String networkId) {
		if (networkId == null || networkId.isEmpty())
			return false;
		return networkId.matches("^" + netId_re + "$");
	}

	public boolean matchesStation(String stationId) {
		if (stationId == null || stationId.isEmpty())
			return false;
		return stationId.matches("^" + netId_re + "\\." + cityId_re + "\\." + itemId_re + "$");
	}

	public boolean matchesSensor(String sensorId) {
		if (sensorId == null || sensorId.isEmpty())
			return false;
		return sensorId.matches("^" + netId_re + "\\." + cityId_re + "\\." + itemId_re + "\\." + parameterId_re + "$");
	}

	public boolean matches(String itemId, MatchType type) {
		switch (type) {
		case NET:
			return matchesNetwork(itemId);
		case STATION:
			return matchesStation(itemId);
		case SENSOR:
			return matchesSensor(itemId);
		default:
			return false;
		}
	}

	@Override
	public String toString() {
		return "SensorId [netId=" + netId + ", cityId=" + cityId + ", itemId=" + itemId + ", parameterId=" + parameterId
				+ "]";
	}

	public String toId() {
		return netId + "." + cityId + "." + itemId + "." + parameterId;
	}

}
