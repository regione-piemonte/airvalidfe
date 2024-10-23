/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class EventHolder {

	private String stationId;
	private String networkName;
	private String stationName;
	private String sensorId;
	private String sensorName;
	private Event event;

	public EventHolder() {
	}

	public EventHolder(String stationId, String networkName, String stationName, String sensorId, String sensorName,
			Event event) {
		super();
		this.stationId = stationId;
		this.networkName = networkName;
		this.stationName = stationName;
		this.sensorId = sensorId;
		this.sensorName = sensorName;
		this.event = event;
	}

	public String getStationId() {
		return stationId;
	}

	public void setStationId(String stationId) {
		this.stationId = stationId;
	}

	public String getNetworkName() {
		return networkName;
	}

	public void setNetworkName(String networkName) {
		this.networkName = networkName;
	}

	public String getStationName() {
		return stationName;
	}

	public void setStationName(String stationName) {
		this.stationName = stationName;

	}

	public String getSensorId() {
		return sensorId;
	}

	public void setSensorId(String sensorId) {
		this.sensorId = sensorId;
	}

	public String getSensorName() {
		return sensorName;
	}

	public void setSensorName(String sensorName) {
		this.sensorName = sensorName;
	}

	public Event getEvent() {
		return event;
	}

	public void setEvent(Event event) {
		this.event = event;
	}

	@Override
	public String toString() {
		return "EventHolder [stationId=" + stationId + ", networkName=" + networkName + ", stationName=" + stationName
				+ ", sensorId=" + sensorId + ", sensorName=" + sensorName + ", event=" + event + "]";
	}

}
