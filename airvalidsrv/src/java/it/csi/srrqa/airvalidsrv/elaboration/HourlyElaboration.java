/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public abstract class HourlyElaboration extends Elaboration {

	public static final double MINIMUM_DATA_PERCENT = 90;

	protected HourlyElaboration(String name) {
		super(name);
	}

	protected List<Value[]> splitToHourlyArrays(List<MeasureValue> data, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException {
		int numDatumInHour = 60 / dataPeriodMinutes;
		if ((data.size() % numDatumInHour) != 0)
			throw new ElaborationException("Error: wrong data number: hours not completed");
		List<Value[]> resultList = new ArrayList<>();
		// loop on all hours
		for (int i = 0; i < (data.size() / numDatumInHour); i++) {
			Value[] hourValues = new Value[numDatumInHour];
			MeasureValue md = data.get(numDatumInHour * i);
			Date dayDate = ElabUtils.getDay(md.getTimestamp());
			int hourTime = ElabUtils.getHour(md.getTimestamp());
			// loop on single day
			for (int j = 0; j < numDatumInHour; j++) {
				MeasureValue datum = data.get((numDatumInHour * i) + j);
				// verify that date is the same for all data of the day
				if (!ElabUtils.getDay(datum.getTimestamp()).equals(dayDate))
					throw new ElaborationException("Error: date not consistent on day: " + dayDate);
				if (ElabUtils.getHour(datum.getTimestamp()) != hourTime && j < numDatumInHour - 1)
					throw new ElaborationException("Error: time not consistent on hour: " + hourTime);
				Double doubleValue = getDatumValue(datum, numDecimals);
				Date timestamp = datum.getTimestamp();
				hourValues[j] = new Value(timestamp, doubleValue);
			}
			resultList.add(hourValues);
		}
		return resultList;
	}

	protected Value computeMean(Value[] values, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException {
		// verify that values vector contains data of a single hour
		if (values.length != (60 / dataPeriodMinutes))
			throw new ElaborationException("Error: wrong day data number");

		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;
		int minimumData = (int) Math.ceil((values.length * MINIMUM_DATA_PERCENT) / 100);
		Double doubleMeanValue = super.computeMean(values, minimumData, numDecimals);
		Double error = doubleMeanValue == null ? null
				: round(computeError(values, doubleMeanValue), numDecimalsForError);
		return new Value(values[values.length - 1].getTimestamp(), doubleMeanValue, error);
	}

	protected Value computeDevStd(Value[] values, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException {
		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;
		Value hourlyMean = computeMean(values, dataPeriodMinutes, numDecimals);
		if (hourlyMean.getValue() != null) {
			double devStd = computeDevStd(values, hourlyMean.getValue());
			int notNullDataNumber = countNotNullData(values);
			double error = 1.0 / Math.sqrt(Math.pow(2.0, notNullDataNumber - 1.0));
			return (new Value(hourlyMean.getTimestamp(), round(devStd, numDecimals),
					round(error, numDecimalsForError)));
		} else
			return hourlyMean;
	}

	@Override
	public TimeBase getTimeBase() {
		return TimeBase.TIMESTAMP;
	}

	@Override
	public PlotType getPlotType() {
		return PlotType.LINEAR;
	}

}
