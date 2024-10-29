/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class SlidingMeanElaboration extends DailyElaboration {

	public static final String ID = "slidingmean";

	// Verificare se davvero e' la media mobile su 6 giorni o su 5
	private static final int DAILY_MEAN_FOR_CALC = 6;

	public SlidingMeanElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException {

		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;

		int numDatumInDay = 1440 / dataPeriodMinutes;
		int daysNumber = data.size() / numDatumInDay;

		// Verificare se va bene assegnare la media calcolata alla
		// data centrale del periodo di dati
		int meanDatePos = (int) (Math.round(DAILY_MEAN_FOR_CALC / 2.0) - 1.0);
		if (daysNumber <= meanDatePos)
			return new DailyValue[0];
		DailyValue[] resultValues = new DailyValue[daysNumber - meanDatePos];
		List<Value[]> dayArraysList = splitToDailyArrays(data, dataPeriodMinutes, numDecimals);
		DailyValue[] dailyMeans = new DailyValue[daysNumber];
		// loop on days to compute daily means
		for (int i = 0; i < daysNumber; i++) {
			Value[] dayValues = dayArraysList.get(i);
			DailyValue dayMean = computeMean(dayValues, dataPeriodMinutes, numDecimals);
			dailyMeans[i] = dayMean;
		}

		int minimumData = (int) Math.ceil((DAILY_MEAN_FOR_CALC * MINIMUM_DATA_PERCENT) / 100);

		// loop on daily means
		for (int i = 0; i < daysNumber - meanDatePos; i++) {
			double groupedDaysMax = Double.MIN_VALUE;
			double groupedDaysMin = Double.MAX_VALUE;
			double groupedDaysSum = 0;
			double daysValidNumber = 0;
			double maxError = Double.MIN_VALUE;
			// consider DAILY_MEAN_FOR_CALC days each time
			for (int j = 0; j < DAILY_MEAN_FOR_CALC; j++) {
				if ((i + j) < daysNumber) {
					Double doubleValue = dailyMeans[i + j].getValue();
					if (doubleValue != null) {
						if (doubleValue > groupedDaysMax)
							groupedDaysMax = doubleValue;
						if (doubleValue < groupedDaysMin)
							groupedDaysMin = doubleValue;
						groupedDaysSum += doubleValue;
						daysValidNumber++;
						if (dailyMeans[i + j].getError() > maxError)
							maxError = dailyMeans[i + j].getError();
					}
				}
			}

			DailyValue meanValue = new DailyValue(dailyMeans[i + meanDatePos].getTimestamp());
			// verify to have at least minimum percent of values for each
			// group of daily means and in this case, compute mean and error
			if (daysValidNumber >= minimumData && minimumData > 0) {
				double doubleMeanValue = round((groupedDaysSum / daysValidNumber), numDecimals);
				double halfDiff = (groupedDaysMax - groupedDaysMin) / 2;
				if (halfDiff > maxError)
					maxError = halfDiff;
				meanValue = new DailyValue(dailyMeans[i + meanDatePos].getTimestamp(), doubleMeanValue,
						round(maxError, numDecimalsForError));
			}
			resultValues[i] = meanValue;

		}

		return resultValues;
	}
}
