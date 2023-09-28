/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class WorkingHolidayReductionElaboration extends WeekBasedTimelyElaboration {

	public static final String ID = "reductionworkdayholiday";

	public WorkingHolidayReductionElaboration(String name) {
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
		List<TimelyValue> resultValues = new ArrayList<TimelyValue>();
		List<TimelyValue> holidayTimelyMeans = new ArrayList<TimelyValue>();
		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;

		// compute means of holidays for registration time
		List<List<Value>> holidayTimelyValues = splitToTimelyArraysForDayOfWeek(data, 1, dataPeriod_m, numDecimals);
		if (holidayTimelyValues.get(0).size() > 0) {
			for (int i = 0; i < numDatumInDay; i++) {
				List<Value> timelyValues = holidayTimelyValues.get(i);
				holidayTimelyMeans.add(computeMean(timelyValues.toArray(new Value[0]), numDecimals));
			}
		}

		// compute means of working days for registration time
		List<TimelyValue> workingTimelyMeans = computeTimelyMeanDaysOfWeek(data, dataPeriod_m, numDecimals, 2, 6);

		// compute working/holiday reduction
		if (holidayTimelyMeans.size() > 0 && workingTimelyMeans.size() > 0) {
			for (int i = 0; i < numDatumInDay; i++) {
				Double reduction = null;
				Double error = null;
				Date timestamp = holidayTimelyMeans.get(i).getTimestamp();
				Double holidayTimelyMean = holidayTimelyMeans.get(i).getValue();
				Double workingTimelyMean = workingTimelyMeans.get(i).getValue();
				if (holidayTimelyMean != null && workingTimelyMean != null) {
					reduction = round((((holidayTimelyMean - workingTimelyMean) / workingTimelyMean) * 100),
							numDecimals);
					error = round(computeDerError(workingTimelyMean, holidayTimelyMean), numDecimalsForError);
				}
				resultValues.add(new TimelyValue(timestamp, reduction, error));
			}
		}

		return resultValues.toArray(new TimelyValue[0]);
	}

}
