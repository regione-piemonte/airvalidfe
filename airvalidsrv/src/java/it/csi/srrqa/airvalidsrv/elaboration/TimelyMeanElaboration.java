/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class TimelyMeanElaboration extends TimelyElaboration {

	public static final String ID = "meanbyhour";

	public TimelyMeanElaboration(String name) {
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
		TimelyValue[] resultValues = new TimelyValue[numDatumInDay];

		List<Value[]> timeArraysList = splitToTimelyArrays(data, dataPeriod_m, numDecimals);
		for (int i = 0; i < numDatumInDay; i++) {
			Value[] timeValues = timeArraysList.get(i);
			TimelyValue timeMean = computeMean(timeValues, numDecimals);
			resultValues[i] = timeMean;
		}

		return resultValues;
	}

}
