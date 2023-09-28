/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.io.Serializable;
import java.util.Date;

public class DataLock implements Serializable {

	private static final long serialVersionUID = -8085451376361578587L;
	private String measurementId;
	private Integer year;
	private String userId;
	private String userInfo;
	private Date date;
	private boolean locked;
	private Boolean myLock;

	public DataLock() {
	}

	public DataLock(String measurementId, Integer year, String userId, String userInfo) {
		this(measurementId, year, userId, userInfo, new Date(), true, null);
	}

	public DataLock(String measurementId, Integer year, String userId, String userInfo, Date date, boolean locked,
			Boolean myLock) {
		super();
		this.measurementId = measurementId;
		this.year = year;
		this.userId = userId;
		this.userInfo = userInfo;
		this.date = date;
		this.locked = locked;
		this.myLock = myLock;
	}

	public String getMeasurementId() {
		return measurementId;
	}

	public void setMeasurementId(String measurementId) {
		this.measurementId = measurementId;
	}

	public Integer getYear() {
		return year;
	}

	public void setYear(Integer year) {
		this.year = year;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getUserInfo() {
		return userInfo;
	}

	public void setUserInfo(String userInfo) {
		this.userInfo = userInfo;
	}

	public Date getDate() {
		return date;
	}

	public void setDate(Date date) {
		this.date = date;
	}

	public boolean isLocked() {
		return locked;
	}

	public void setLocked(boolean locked) {
		this.locked = locked;
	}

	public Boolean getMyLock() {
		return myLock;
	}

	public void setMyLock(Boolean myLock) {
		this.myLock = myLock;
	}

	@Override
	public String toString() {
		return "DataLock [measurementId=" + measurementId + ", year=" + year + ", userId=" + userId + ", date=" + date
				+ ", locked=" + locked + ", myLock=" + myLock + "]";
	}

	public DataLock copy(boolean myLock) {
		return new DataLock(measurementId, year, userId, userInfo, date, locked, myLock);
	}

}
