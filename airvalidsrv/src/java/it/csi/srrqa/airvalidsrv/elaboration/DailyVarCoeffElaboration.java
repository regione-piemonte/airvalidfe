/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DailyVarCoeffElaboration extends DailyElaboration {

	public static final String ID = "dailyvarcoeff";

	public DailyVarCoeffElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;

		int numDatumInDay = 1440 / dataPeriod_m;
		int daysNumber = data.size() / numDatumInDay;
		DailyValue[] resultValues = new DailyValue[daysNumber];

		List<Value[]> dayArraysList = splitToDailyArrays(data, dataPeriod_m, numDecimals);
		// loop on all days of period
		for (int i = 0; i < daysNumber; i++) {
			Value[] dayValues = dayArraysList.get(i);
			DailyValue dayMean = computeMean(dayValues, dataPeriod_m, numDecimals);
			if (dayMean.getValue() != null) {
				DailyValue devStd = computeDevStd(dayValues, dataPeriod_m, numDecimals);
				double varCoeff = devStd.getValue() / dayMean.getValue();
				double error = ((devStd.getError() / devStd.getValue()) + (dayMean.getError() / dayMean.getValue()))
						* varCoeff;
				resultValues[i] = new DailyValue(dayMean.getTimestamp(), round(varCoeff, numDecimals),
						round(error, numDecimalsForError));
			} else
				resultValues[i] = dayMean;
		}

		return resultValues;
	}

}
