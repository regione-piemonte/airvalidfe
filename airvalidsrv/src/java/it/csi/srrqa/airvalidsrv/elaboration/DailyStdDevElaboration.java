/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DailyStdDevElaboration extends DailyElaboration {

	public static final String ID = "dailystddev";

	public DailyStdDevElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		int numDatumInDay = 1440 / dataPeriod_m;
		int daysNumber = data.size() / numDatumInDay;
		DailyValue[] resultValues = new DailyValue[daysNumber];

		List<Value[]> dayArraysList = splitToDailyArrays(data, dataPeriod_m, numDecimals);
		// loop for each day of the period
		for (int i = 0; i < daysNumber; i++) {
			Value[] dayValues = dayArraysList.get(i);
			resultValues[i] = computeDevStd(dayValues, dataPeriod_m, numDecimals);
		}

		return resultValues;
	}

}
