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
	private Integer beginYear;
	private Integer endYear;
	private String userId;
	private String userInfo;
	private String contextId;
	private Date date;
	private boolean locked;
	private Boolean myLock;

	public DataLock() {
	}

	public DataLock(String measurementId, Integer beginYear, Integer endYear, String userId, String userInfo,
			String contextId) {
		this(measurementId, beginYear, endYear, userId, userInfo, contextId, new Date(), true, null);
	}

	public DataLock(String measurementId, Integer beginYear, Integer endYear, String userId, String userInfo,
			String contextId, Date date, boolean locked, Boolean myLock) {
		super();
		this.measurementId = measurementId;
		this.beginYear = beginYear;
		this.endYear = endYear;
		this.userId = userId;
		this.userInfo = userInfo;
		this.contextId = contextId;
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

	public Integer getBeginYear() {
		return beginYear;
	}

	public void setBeginYear(Integer beginYear) {
		this.beginYear = beginYear;
	}

	public Integer getEndYear() {
		return endYear;
	}

	public void setEndYear(Integer endYear) {
		this.endYear = endYear;
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
		return "DataLock [measurementId=" + measurementId + ", beginYear=" + beginYear + ", endYear=" + endYear
				+ ", userId=" + userId + ", userInfo=" + userInfo + ", contextId=" + contextId + ", date=" + date
				+ ", locked=" + locked + ", myLock=" + myLock + "]";
	}

	public DataLock copy(boolean myLock) {
		return new DataLock(measurementId, beginYear, endYear, userId, userInfo, contextId, date, locked, myLock);
	}

}
