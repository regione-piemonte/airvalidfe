/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public abstract class DayOfWeekTimelyMeanElaboration extends WeekBasedTimelyElaboration {

	public DayOfWeekTimelyMeanElaboration(String name) {
		super(name);
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		if (getDayOfWeek() < 1 || getDayOfWeek() > 7)
			throw new IllegalArgumentException("Wrong day of week: " + getDayOfWeek());

		int numDatumInDay = 1440 / dataPeriod_m;
		List<TimelyValue> resultValues = new ArrayList<TimelyValue>();

		List<List<Value>> dayOfWeekTimelyValues = splitToTimelyArraysForDayOfWeek(data, getDayOfWeek(), dataPeriod_m,
				numDecimals);
		if (dayOfWeekTimelyValues.get(0).size() > 0) {
			for (int i = 0; i < numDatumInDay; i++) {
				List<Value> timelyValues = dayOfWeekTimelyValues.get(i);
				resultValues.add(computeMean(timelyValues.toArray(new Value[0]), numDecimals));
			}
		}

		return resultValues.toArray(new TimelyValue[0]);
	}

	protected abstract int getDayOfWeek();

}
