/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public abstract class TimelyElaboration extends Elaboration {

	public TimelyElaboration(String name) {
		super(name);
	}

	protected List<Value[]> splitToTimelyArrays(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		int numDatumInDay = 1440 / dataPeriod_m;
		if ((data.size() % numDatumInDay) != 0)
			throw new ElaborationException("Error: wrong data number: days not completed");

		List<Value[]> resultList = new ArrayList<Value[]>();
		HashMap<Integer, List<Value>> hm_timelyValues = new HashMap<Integer, List<Value>>();
		// loop on all days
		for (int i = 0; i < data.size() / numDatumInDay; i++) {
			// loop on single day data
			for (int j = 0; j < numDatumInDay; j++) {
				MeasureValue datum = data.get((numDatumInDay * i) + j);
				int time = ElabUtils.getMinutes(datum.getTimestamp());
				Double doubleValue = getDatumValue(datum, numDecimals);
				Date timestamp = datum.getTimestamp();
				if (hm_timelyValues.containsKey(time)) {
					List<Value> timelyValuesList = hm_timelyValues.get(time);
					timelyValuesList.add(new Value(timestamp, doubleValue));
				} else {
					List<Value> timelyValuesList = new ArrayList<Value>();
					timelyValuesList.add(new Value(timestamp, doubleValue));
					hm_timelyValues.put(time, timelyValuesList);
				}
			}
		}

		// search in sorted list of keys and preparation of result
		List<Integer> keysList = new ArrayList<Integer>();
		keysList.addAll(hm_timelyValues.keySet());
		Collections.sort(keysList);
		for (int i = 0; i < keysList.size(); i++) {
			Integer key = keysList.get(i);
			List<Value> timelyValuesList = hm_timelyValues.get(key);
			resultList.add(timelyValuesList.toArray(new Value[0]));
		}

		return resultList;
	}

	protected TimelyValue computeMean(Value[] values, Integer numDecimals) throws ElaborationException {

		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;
		Double doubleMeanValue = computeMean(values, (Integer) null, numDecimals);
		Date timestamp = values[0].getTimestamp();
		Double error = doubleMeanValue == null ? null
				: round(computeError(values, doubleMeanValue), numDecimalsForError);
		TimelyValue meanValue = new TimelyValue(timestamp, doubleMeanValue, error);
		return meanValue;
	}

	protected TimelyValue getTvMax(Value[] values) {
		TimelyValue maxTimelyValue = null;
		double maxValue = Double.MIN_VALUE;
		for (int i = 0; i < values.length; i++) {
			if (values[i].getValue() != null) {
				if (values[i].getValue() > maxValue) {
					maxValue = values[i].getValue();
					maxTimelyValue = new TimelyValue(values[i].getTimestamp(), maxValue);
				}
			}
		}
		return maxTimelyValue;
	}

	protected TimelyValue getTvMin(Value[] values) {
		TimelyValue minTimelyValue = null;
		double minValue = Double.MAX_VALUE;
		for (int i = 0; i < values.length; i++) {
			if (values[i].getValue() != null) {
				if (values[i].getValue() < minValue) {
					minValue = values[i].getValue();
					minTimelyValue = new TimelyValue(values[i].getTimestamp(), minValue);
				}
			}
		}
		return minTimelyValue;
	}

	@Override
	public TimeBase getTimeBase() {
		return TimeBase.TIME;
	}

	@Override
	public PlotType getPlotType() {
		return PlotType.LINEAR;
	}

}
