/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class HourlyMeanElaboration extends HourlyElaboration {

	public static final String ID = "hourlymean";

	public HourlyMeanElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		if (dataPeriod_m > 60)
			return toValues(data, numDecimals);

		int numDatumInHour = 60 / dataPeriod_m;
		int hoursNumber = data.size() / numDatumInHour;
		Value[] resultValues = new Value[hoursNumber];

		List<Value[]> hourArraysList = splitToHourlyArrays(data, dataPeriod_m, numDecimals);
		for (int i = 0; i < hoursNumber; i++) {
			Value[] hourValues = hourArraysList.get(i);
			resultValues[i] = computeMean(hourValues, dataPeriod_m, numDecimals);
		}

		return resultValues;
	}

}
