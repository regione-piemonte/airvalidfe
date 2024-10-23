/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DailyDifferencesElaboration extends DailyElaboration {

	public static final String ID = "dailydifferences";

	public DailyDifferencesElaboration(String name) {
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
		DailyValue[] resultValues = new DailyValue[daysNumber - 1];
		DailyValue[] dayMeans = new DailyValue[daysNumber];

		// compute all daily means
		List<Value[]> dayArraysList = splitToDailyArrays(data, dataPeriod_m, numDecimals);
		for (int i = 0; i < daysNumber; i++) {
			Value[] dayValues = dayArraysList.get(i);
			dayMeans[i] = computeMean(dayValues, dataPeriod_m, numDecimals);
		}

		// compute differences between daily means assigned to date of
		// more recent daily mean
		for (int i = 1; i < daysNumber; i++) {
			if (dayMeans[i].getValue() != null && dayMeans[i - 1].getValue() != null) {
				double diff = dayMeans[i].getValue() - dayMeans[i - 1].getValue();
				double error = dayMeans[i].getError() + dayMeans[i - 1].getError();
				resultValues[i - 1] = new DailyValue(dayMeans[i].getTimestamp(), round(diff, numDecimals),
						round(error, numDecimalsForError));
			} else
				resultValues[i - 1] = new DailyValue(dayMeans[i].getTimestamp(), null, null);
		}

		return resultValues;
	}

}
