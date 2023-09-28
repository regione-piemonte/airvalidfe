/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.List;

// Configurazione per estrazione dati
public class DatasetConfig {

	private List<String> listSensorId;
	private TimeUnit timeUnit;
	private Long beginTime;
	private Long endTime;
	private String activityType;
	private String activityOptions;

	public DatasetConfig() {
	}

	public DatasetConfig(List<String> listSensorId, TimeUnit timeUnit, Long beginTime, Long endTime,
			String activityType, String activityOptions) {
		super();
		this.listSensorId = listSensorId;
		this.timeUnit = timeUnit;
		this.beginTime = beginTime;
		this.endTime = endTime;
		this.activityType = activityType;
		this.activityOptions = activityOptions;
	}

	public List<String> getListSensorId() {
		return listSensorId;
	}

	public void setListSensorId(List<String> listSensorId) {
		this.listSensorId = listSensorId;
	}

	public TimeUnit getTimeUnit() {
		return timeUnit;
	}

	public void setTimeUnit(TimeUnit TimeUnit) {
		this.timeUnit = TimeUnit;
	}

	public Long getBeginTime() {
		return beginTime;
	}

	public void setBeginTime(Long beginTime) {
		this.beginTime = beginTime;
	}

	public Long getEndTime() {
		return endTime;
	}

	public void setEndTime(Long endTime) {
		this.endTime = endTime;
	}

	public String getActivityType() {
		return activityType;
	}

	public void setActivityType(String activityType) {
		this.activityType = activityType;
	}

	public String getActivityOptions() {
		return activityOptions;
	}

	public void setActivityOptions(String activityOptions) {
		this.activityOptions = activityOptions;
	}

	@Override
	public String toString() {
		return "DatasetConfig [listSensorId=" + listSensorId + ", timeUnit=" + timeUnit + ", beginTime=" + beginTime
				+ ", endTime=" + endTime + ", activityType=" + activityType + ", activityOptions=" + activityOptions
				+ "]";
	}

}
