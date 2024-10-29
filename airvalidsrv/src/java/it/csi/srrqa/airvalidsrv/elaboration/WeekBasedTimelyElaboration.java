/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public abstract class WeekBasedTimelyElaboration extends TimelyElaboration {

	public WeekBasedTimelyElaboration(String name) {
		super(name);
	}

	protected List<List<Value>> splitToTimelyArraysForDayOfWeek(List<MeasureValue> data, int dayOfWeek,
			int dataPeriod_m, Integer numDecimals) throws ElaborationException {
		// for convention, if sunday is requested, it means holiday and data of
		// holiday days are assigned to sunday
		int numDatumInDay = 1440 / dataPeriod_m;
		List<List<Value>> resultValues = new ArrayList<List<Value>>();

		List<Value[]> timeArraysList = splitToTimelyArrays(data, dataPeriod_m, numDecimals);
		// loop on all registration times
		for (int i = 0; i < numDatumInDay; i++) {
			Value[] timeValues = timeArraysList.get(i);
			List<Value> timeDayWeekValuesList = new ArrayList<Value>();
			// loop on all data of a single registration time
			for (int j = 0; j < timeValues.length; j++) {
				Calendar cal = new GregorianCalendar();
				cal.setLenient(true);
				cal.setTime(timeValues[j].getTimestamp());
				if (dayOfWeek != Calendar.SUNDAY) {
					if (cal.get(Calendar.DAY_OF_WEEK) == dayOfWeek && !isHolydayDay(cal.getTime()))
						timeDayWeekValuesList.add(timeValues[j]);
				} else {
					if (cal.get(Calendar.DAY_OF_WEEK) == dayOfWeek || isHolydayDay(cal.getTime()))
						timeDayWeekValuesList.add(timeValues[j]);
				}
			}
			resultValues.add(timeDayWeekValuesList);
		}
		return resultValues;
	}

	protected WeekTimelyValue computeMean(Value[] values, int dayOfWeek, Integer numDecimals)
			throws ElaborationException {
		if (values == null || values.length == 0)
			throw new ElaborationException("Error: too few data for week based elaboration");
		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;
		Double doubleMeanValue = computeMean(values, (Integer) null, numDecimals);
		Date timestamp = values[0].getTimestamp();
		Double error = doubleMeanValue == null ? null
				: round(computeError(values, doubleMeanValue), numDecimalsForError);
		WeekTimelyValue meanValue = new WeekTimelyValue(timestamp, dayOfWeek, doubleMeanValue, error);
		return meanValue;
	}

	protected List<TimelyValue> computeTimelyMeanDaysOfWeek(List<MeasureValue> data, int dataPeriod_m,
			Integer numDecimals, int firstDay, int lastDay) throws ElaborationException {
		int numDatumInDay = 1440 / dataPeriod_m;
		List<TimelyValue> resultValues = new ArrayList<TimelyValue>();
		HashMap<Integer, List<TimelyValue>> hm_timelyWorkingMeans = new HashMap<Integer, List<TimelyValue>>();

		// loop on requested days week
		for (int i = firstDay; i <= lastDay; i++) {
			List<List<Value>> daysTimelyValues = splitToTimelyArraysForDayOfWeek(data, i, dataPeriod_m, numDecimals);
			// verify that data are existing for day of week
			// is enough to control one registration time because is supposed
			// to have as input data completed days
			if (daysTimelyValues.get(0).size() > 0) {
				// loop on all registration times
				for (int j = 0; j < numDatumInDay; j++) {
					List<Value> timelyValues = daysTimelyValues.get(j);
					TimelyValue timelyMean = computeMean(timelyValues.toArray(new Value[0]), numDecimals);
					int key = ElabUtils.getMinutes(timelyMean.getTimestamp());
					if (hm_timelyWorkingMeans.containsKey(key)) {
						List<TimelyValue> timelyMeans = hm_timelyWorkingMeans.get(key);
						timelyMeans.add(timelyMean);
					} else {
						List<TimelyValue> timelyMeans = new ArrayList<TimelyValue>();
						timelyMeans.add(timelyMean);
						hm_timelyWorkingMeans.put(key, timelyMeans);
					}
				}

			}
		}
		// compute mean for every registration time
		List<Integer> keysList = new ArrayList<Integer>();
		Iterator<Integer> it_timely = hm_timelyWorkingMeans.keySet().iterator();
		while (it_timely.hasNext()) {
			Integer key = it_timely.next();
			keysList.add(key);
		}
		Collections.sort(keysList);
		for (int i = 0; i < keysList.size(); i++) {
			Integer key = keysList.get(i);
			List<TimelyValue> timelyMeans = hm_timelyWorkingMeans.get(key);
			resultValues.add(computeMean(timelyMeans.toArray(new TimelyValue[0]), numDecimals));
		}

		return resultValues;
	}

}
