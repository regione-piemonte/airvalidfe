/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DailyMaximumMinimumRatioElaboration extends DailyElaboration {

	public static final String ID = "maxminratio";

	public DailyMaximumMinimumRatioElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected DailyValue[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		DailyMaximumElaboration dailyMaximumElaboration = new DailyMaximumElaboration("Daily_maximum");
		DailyValue[] dailyMaximumValue = dailyMaximumElaboration.computeImpl(data, dataPeriod_m, numDecimals);

		DailyMinimumElaboration dailyMinimumElaboration = new DailyMinimumElaboration("Daily_minimum");
		DailyValue[] dailyMinimunValue = dailyMinimumElaboration.computeImpl(data, dataPeriod_m, numDecimals);

		if (dailyMaximumValue == null || dailyMinimunValue == null)
			throw new ElaborationException("Error: wrong data number for daily ratio max/min compute");

		int numDatumInDay = 1440 / dataPeriod_m;
		if ((data.size() % numDatumInDay) != 0)
			throw new ElaborationException("Error: wrong data number for daily ratio max/min compute");

		int daysNumber = data.size() / numDatumInDay;
		DailyValue[] resultValues = new DailyValue[daysNumber];
		// ciclo su tutti i giorni
		for (int i = 0; i < dailyMaximumValue.length; i++) {
			if (dailyMaximumValue[i] != null && dailyMaximumValue[i].getValue() != null
					&& dailyMaximumValue[i].getValue() != 0 && dailyMinimunValue[i] != null
					&& dailyMinimunValue[i].getValue() != null && dailyMinimunValue[i].getValue() != 0) {
				double ratio = dailyMaximumValue[i].getValue().doubleValue()
						/ dailyMinimunValue[i].getValue().doubleValue();
				DailyValue dailyValue = new DailyValue(dailyMaximumValue[i].getTimestamp(), ratio);
				resultValues[i] = dailyValue;
			} else {
				DailyValue dailyValue = new DailyValue(dailyMaximumValue[i].getTimestamp());
				resultValues[i] = dailyValue;
			}
		}

		return resultValues;
	}
}
