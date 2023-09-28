/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public abstract class DailyElaboration extends Elaboration {

	public static final double MINIMUM_DATA_PERCENT = 90;

	protected DailyElaboration(String name) {
		super(name);
	}

	protected List<Value[]> splitToDailyArrays(List<MeasureValue> data, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException {
		int numDatumInDay = 1440 / dataPeriodMinutes;
		int numDays = data.size() / numDatumInDay;
		int remainder = data.size() % numDatumInDay;
		if (remainder != 0)
			throw new ElaborationException(
					"Error: wrong data number: " + numDays + " days of data with " + remainder + " extra data");
		List<Value[]> resultList = new ArrayList<>();
		// loop on all days
		for (int i = 0; i < (data.size() / numDatumInDay); i++) {
			Value[] dayValues = new Value[numDatumInDay];
			Date dayDate = ElabUtils.getDay(data.get(numDatumInDay * i).getTimestamp());
			// loop on single day
			for (int j = 0; j < numDatumInDay; j++) {
				MeasureValue datum = data.get((numDatumInDay * i) + j);
				// verify that date is the same for all data of the day
				if (!ElabUtils.getDay(datum.getTimestamp()).equals(dayDate))
					throw new ElaborationException("Error: date not consistent on day:" + dayDate);
				Double doubleValue = getDatumValue(datum, numDecimals);
				Date timestamp = datum.getTimestamp();
				dayValues[j] = new Value(timestamp, doubleValue);
			}
			resultList.add(dayValues);
		}
		return resultList;
	}

	protected DailyValue computeMean(Value[] values, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException {
		// verify that values vector contains data of a single day
		if (values.length != (1440 / dataPeriodMinutes))
			throw new ElaborationException("Error: wrong day data number");

		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;
		int minimumData = (int) Math.ceil((values.length * MINIMUM_DATA_PERCENT) / 100);
		Double doubleMeanValue = super.computeMean(values, minimumData, numDecimals);
		Double error = doubleMeanValue == null ? null
				: round(computeError(values, doubleMeanValue), numDecimalsForError);
		return new DailyValue(values[0].getTimestamp(), doubleMeanValue, error);
	}

	protected DailyValue computeDevStd(Value[] values, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException {
		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;
		DailyValue dayMean = computeMean(values, dataPeriodMinutes, numDecimals);
		if (dayMean.getValue() != null) {
			double devStd = computeDevStd(values, dayMean.getValue());
			int notNullDataNumber = countNotNullData(values);
			double error = 1.0 / Math.sqrt(Math.pow(2.0, notNullDataNumber - 1.0));
			return (new DailyValue(dayMean.getTimestamp(), round(devStd, numDecimals),
					round(error, numDecimalsForError)));
		} else
			return dayMean;
	}

	@Override
	public TimeBase getTimeBase() {
		return TimeBase.DATE;
	}
}
