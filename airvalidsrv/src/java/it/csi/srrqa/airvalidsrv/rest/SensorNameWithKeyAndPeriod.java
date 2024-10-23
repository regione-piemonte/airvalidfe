/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.Date;

import it.csi.srrqa.airdb.model.NameWithKeyAndPeriod;

public class SensorNameWithKeyAndPeriod extends NameWithKeyAndPeriod {

	private static final long serialVersionUID = -4685318097229677203L;
	private String measureUnitId;
	private Integer measurementPeriod;
	private Integer decimalDigits;
	private Boolean virtual;
	private boolean correctionSupported;

	public SensorNameWithKeyAndPeriod(String name, String key, boolean active, String extraInfo, String flags,
			Date beginDate, Date endDate, String measureUnitId, Integer measurementPeriod, Integer decimalDigits,
			Boolean virtual, boolean correctionSupported) {
		super(name, key, active, extraInfo, flags, beginDate, endDate);
		this.measureUnitId = measureUnitId;
		this.measurementPeriod = measurementPeriod;
		this.decimalDigits = decimalDigits;
		this.virtual = virtual;
		this.correctionSupported = correctionSupported;
	}

	public String getMeasureUnitId() {
		return measureUnitId;
	}

	public void setMeasureUnitId(String measureUnitId) {
		this.measureUnitId = measureUnitId;
	}

	public Integer getMeasurementPeriod() {
		return measurementPeriod;
	}

	public void setMeasurementPeriod(Integer measurementPeriod) {
		this.measurementPeriod = measurementPeriod;
	}

	public Integer getDecimalDigits() {
		return decimalDigits;
	}

	public void setDecimalDigits(Integer decimalDigits) {
		this.decimalDigits = decimalDigits;
	}

	public Boolean getVirtual() {
		return virtual;
	}

	public void setVirtual(Boolean virtual) {
		this.virtual = virtual;
	}

	public boolean isCorrectionSupported() {
		return correctionSupported;
	}

	public void setCorrectionSupported(boolean correctionSupported) {
		this.correctionSupported = correctionSupported;
	}

	@Override
	public String toString() {
		return "SensorNameWithKeyAndPeriod [name=" + getName() + ", key=" + getKey() + ", active=" + isActive()
				+ ", extraInfo=" + getExtraInfo() + ", flags=" + getFlags() + ", beginDate=" + getBeginDate()
				+ ", endDate=" + getEndDate() + ", measureUnitId=" + measureUnitId + ", measurementPeriod="
				+ measurementPeriod + ", decimalDigits=" + decimalDigits + ", virtual=" + virtual
				+ ", correctionSupported=" + correctionSupported + "]";
	}

}
