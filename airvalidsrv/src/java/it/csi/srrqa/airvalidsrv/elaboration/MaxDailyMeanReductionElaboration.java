/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public abstract class MaxDailyMeanReductionElaboration extends DailyElaboration {

	public MaxDailyMeanReductionElaboration(String name) {
		super(name);
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		if (getDayOfWeek() != 1 && getDayOfWeek() != 7)
			throw new IllegalArgumentException("Wrong day of week: " + getDayOfWeek());

		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;
		List<DailyValue> resultValues = new ArrayList<DailyValue>();
		int numDatumInDay = 1440 / dataPeriod_m;
		int daysNumber = data.size() / numDatumInDay;
		DailyValue[] meanValues = new DailyValue[daysNumber];
		int minimumData = (int) Math.ceil((5 * MINIMUM_DATA_PERCENT) / 100);

		// compute daily means
		List<Value[]> dayArraysList = splitToDailyArrays(data, dataPeriod_m, numDecimals);
		for (int i = 0; i < daysNumber; i++) {
			Value[] dayValues = dayArraysList.get(i);
			meanValues[i] = computeMean(dayValues, dataPeriod_m, numDecimals);
		}

		// search maximum of working day means and means of requested day
		Calendar cal = new GregorianCalendar();
		cal.setLenient(true);
		cal.setTime(meanValues[0].getTimestamp());

		List<DailyValue> reqDayMeans = new ArrayList<DailyValue>();
		List<DailyValue> maxDailyMeans = new ArrayList<DailyValue>();
		List<DailyValue> otherDaysMeans = new ArrayList<DailyValue>();
		for (int i = 0; i < daysNumber; i++) {
			cal.setTime(meanValues[i].getTimestamp());
			if (cal.get(Calendar.DAY_OF_WEEK) == getDayOfWeek()) {
				reqDayMeans.add(meanValues[i]);
				if (countNotNullData(otherDaysMeans.toArray(new DailyValue[0])) >= minimumData) {
					// consider first maximum value
					Value[] maxValues = getMax(otherDaysMeans.toArray(new DailyValue[0]));
					maxDailyMeans.add(new DailyValue(maxValues[0].getTimestamp(), maxValues[0].getValue(),
							maxValues[0].getError()));
				} else
					// set date to next week, because date is not controlled
					// in the compute of reduction
					maxDailyMeans.add(new DailyValue(cal.getTime()));
				otherDaysMeans.clear();
			} else {
				if (cal.get(Calendar.DAY_OF_WEEK) >= 2 && cal.get(Calendar.DAY_OF_WEEK) <= 6
						&& !isHolydayDay(cal.getTime()))
					otherDaysMeans.add(meanValues[i]);
			}
		}

		// compute reduction
		if (maxDailyMeans.size() != reqDayMeans.size())
			throw new IllegalArgumentException(
					"Wrong size maxDailyMeans:" + maxDailyMeans.size() + " and reqDayMeans:" + reqDayMeans.size());
		for (int i = 0; i < reqDayMeans.size(); i++) {
			Double reduction = null;
			Double error = null;
			Date timestamp = reqDayMeans.get(i).getTimestamp();
			Double reqDayMean = reqDayMeans.get(i).getValue();
			Double maxDailyMean = maxDailyMeans.get(i).getValue();
			if (reqDayMean != null && maxDailyMean != null) {
				reduction = round((((reqDayMean - maxDailyMean) / maxDailyMean) * 100), numDecimals);
				error = round(computeDerError(maxDailyMean, reqDayMean), numDecimalsForError);
			}
			resultValues.add(new DailyValue(timestamp, reduction, error));
		}

		return resultValues.toArray(new DailyValue[0]);
	}

	protected abstract int getDayOfWeek();
}
