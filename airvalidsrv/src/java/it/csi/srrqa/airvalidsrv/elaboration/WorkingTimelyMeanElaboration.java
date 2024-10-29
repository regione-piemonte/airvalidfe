/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class WorkingTimelyMeanElaboration extends WeekBasedTimelyElaboration {

	public static final String ID = "meanbyworkhour";

	public WorkingTimelyMeanElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		return computeTimelyMeanDaysOfWeek(data, dataPeriod_m, numDecimals, 2, 6).toArray(new TimelyValue[0]);

	}
}
