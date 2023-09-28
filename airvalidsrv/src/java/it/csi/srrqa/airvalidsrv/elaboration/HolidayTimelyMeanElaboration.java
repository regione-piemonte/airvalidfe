/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class HolidayTimelyMeanElaboration extends DayOfWeekTimelyMeanElaboration {

	public static final String ID = "meanbyholidayhour";

	public HolidayTimelyMeanElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		return super.computeImpl(data, dataPeriod_m, numDecimals);
	}

	@Override
	protected int getDayOfWeek() {
		return 1;
	}

}
