/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import it.csi.srrqa.airdb.model.Calibration;

public class CalibrationInfo extends Calibration {

	private static final long serialVersionUID = 40089878988989152L;
	private boolean timeFound;

	public CalibrationInfo() {
		super();
	}

	public CalibrationInfo(Calibration cal) {
		super(cal.getCodice_istat_comune(), cal.getProgr_punto_com(), cal.getId_parametro(), cal.getTicketId(),
				cal.getInstrumentId(), cal.getBeginDate(), cal.getEndDate(), cal.getYearly(), cal.getZero(),
				cal.getSpan(), cal.getCylinderConcentration(), cal.getConverterEfficiency(),
				cal.getCalibrationApplied());
	}

	public CalibrationInfo(Calibration cal, boolean timeFound) {
		this(cal);
		setTimeFound(timeFound);
	}

	public boolean isTimeFound() {
		return timeFound;
	}

	public void setTimeFound(boolean timeFound) {
		this.timeFound = timeFound;
	}

}
