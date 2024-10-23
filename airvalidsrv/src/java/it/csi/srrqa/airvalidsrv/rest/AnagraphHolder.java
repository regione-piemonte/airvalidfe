/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class AnagraphHolder {

	private String title;
	private String beginDate;
	private String endDate;
	private String address;
	private String mapsUrl;
	private Double altitude;
	private String stationType;
	private String stationUrl;
	private Boolean national;
	private Boolean publicOwned;
	private Boolean publicManaged;
	private Boolean toBePublisched;

	public AnagraphHolder() {
		super();
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getBeginDate() {
		return beginDate;
	}

	public void setBeginDate(String beginDate) {
		this.beginDate = beginDate;
	}

	public String getEndDate() {
		return endDate;
	}

	public void setEndDate(String endDate) {
		this.endDate = endDate;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getMapsUrl() {
		return mapsUrl;
	}

	public void setMapsUrl(String mapUrl) {
		this.mapsUrl = mapUrl;
	}

	public Double getAltitude() {
		return altitude;
	}

	public void setAltitude(Double altitude) {
		this.altitude = altitude;
	}

	public String getStationType() {
		return stationType;
	}

	public void setStationType(String stationType) {
		this.stationType = stationType;
	}

	public String getStationUrl() {
		return stationUrl;
	}

	public void setStationUrl(String stationUrl) {
		this.stationUrl = stationUrl;
	}

	public Boolean getNational() {
		return national;
	}

	public void setNational(Boolean national) {
		this.national = national;
	}

	public Boolean getPublicOwned() {
		return publicOwned;
	}

	public void setPublicOwned(Boolean publicOwned) {
		this.publicOwned = publicOwned;
	}

	public Boolean getPublicManaged() {
		return publicManaged;
	}

	public void setPublicManaged(Boolean publicManaged) {
		this.publicManaged = publicManaged;
	}

	public Boolean getToBePublisched() {
		return toBePublisched;
	}

	public void setToBePublisched(Boolean toBePublisched) {
		this.toBePublisched = toBePublisched;
	}

}
