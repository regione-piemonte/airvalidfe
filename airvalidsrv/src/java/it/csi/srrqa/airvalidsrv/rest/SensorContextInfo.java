/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import it.csi.srrqa.airdb.model.NameWithKeyAndPeriod;

public class SensorContextInfo {

	private NameWithKeyAndPeriod networkName;
	private NameWithKeyAndPeriod stationName;
	private SensorNameWithKeyAndPeriod sensorName;

	public SensorContextInfo() {
		super();
	}

	public SensorContextInfo(NameWithKeyAndPeriod networkName, NameWithKeyAndPeriod stationName,
			SensorNameWithKeyAndPeriod sensorName) {
		super();
		this.networkName = networkName;
		this.stationName = stationName;
		this.sensorName = sensorName;
	}

	public NameWithKeyAndPeriod getNetworkName() {
		return networkName;
	}

	public void setNetworkName(NameWithKeyAndPeriod networkName) {
		this.networkName = networkName;
	}

	public NameWithKeyAndPeriod getStationName() {
		return stationName;
	}

	public void setStationName(NameWithKeyAndPeriod stationName) {
		this.stationName = stationName;
	}

	public SensorNameWithKeyAndPeriod getSensorName() {
		return sensorName;
	}

	public void setSensorName(SensorNameWithKeyAndPeriod sensorName) {
		this.sensorName = sensorName;
	}

	@Override
	public String toString() {
		return "SensorContextInfo [networkName=" + networkName + ", stationName=" + stationName + ", sensorName="
				+ sensorName + "]";
	}

}
