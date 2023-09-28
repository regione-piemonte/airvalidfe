/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DayTimelyMinimumElaboration extends DailyElaboration {

	public static final String ID = "hourlyminimum";

	public DayTimelyMinimumElaboration(String name) {
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
		List<Value> resultValuesList = new ArrayList<Value>();

		List<Value[]> dayArraysList = splitToDailyArrays(data, dataPeriod_m, numDecimals);
		for (int i = 0; i < daysNumber; i++) {
			Value[] dayValues = dayArraysList.get(i);
			Value[] dayMinValues = getMin(dayValues);
			for (int j = 0; j < dayMinValues.length; j++)
				resultValuesList.add(dayMinValues[j]);
		}

		return resultValuesList.toArray(new Value[0]);
	}

	@Override
	public TimeBase getTimeBase() {
		return TimeBase.TIMESTAMP;
	}
}
