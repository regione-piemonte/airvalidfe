/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.io.Serializable;
import java.util.Date;

public class YearlyDataLock implements Serializable {

	private static final long serialVersionUID = 3046624071298385747L;
	private String measurementId;
	private int year;
	private String userId;
	private String contextId;
	private Date date;

	public YearlyDataLock() {
	}

	public YearlyDataLock(String measurementId, int year, String userId, String contextId, Date date) {
		super();
		this.measurementId = measurementId;
		this.year = year;
		this.userId = userId;
		this.contextId = contextId;
		this.date = date;
	}

	public String getMeasurementId() {
		return measurementId;
	}

	public void setMeasurementId(String measurementId) {
		this.measurementId = measurementId;
	}

	public int getYear() {
		return year;
	}

	public void setYear(int year) {
		this.year = year;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getContextId() {
		return contextId;
	}

	public void setContextId(String contextId) {
		this.contextId = contextId;
	}

	public Date getDate() {
		return date;
	}

	public void setDate(Date date) {
		this.date = date;
	}

	@Override
	public String toString() {
		return "YearlyDataLock [measurementId=" + measurementId + ", year=" + year + ", userId=" + userId
				+ ", contextId=" + contextId + ", date=" + date + "]";
	}

}
