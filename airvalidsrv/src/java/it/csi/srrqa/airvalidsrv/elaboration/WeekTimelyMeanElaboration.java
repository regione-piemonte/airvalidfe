/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class WeekTimelyMeanElaboration extends WeekBasedTimelyElaboration {

	public static final String ID = "meanbyhouronweek";

	public WeekTimelyMeanElaboration(String name) {
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
		List<WeekTimelyValue> resultValuesList = new ArrayList<WeekTimelyValue>();

		// loop on all day of week
		for (int i = 1; i <= 7; i++) {
			List<List<Value>> daysTimelyValues = splitToTimelyArraysForDayOfWeek(data, i, dataPeriod_m, numDecimals);
			// verify that data are existing for day of week
			// is enough to control one registration time because is supposed
			// to have as input data completed days
			if (daysTimelyValues.get(0).size() > 0) {
				// loop on all registration times
				for (int j = 0; j < numDatumInDay; j++) {
					List<Value> timelyValues = daysTimelyValues.get(j);
					WeekTimelyValue timelyMean = computeMean(timelyValues.toArray(new Value[0]), i, numDecimals);
					resultValuesList.add(timelyMean);
				}
			}
		}
		return resultValuesList.toArray(new WeekTimelyValue[0]);
	}

	@Override
	public TimeBase getTimeBase() {
		return TimeBase.WEEKTIME;
	}
}
