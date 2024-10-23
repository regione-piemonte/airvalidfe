/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DailyMinimumElaboration extends DailyElaboration {

	public static final String ID = "dailyminimum";

	public DailyMinimumElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected DailyValue[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		int numDatumInDay = 1440 / dataPeriod_m;
		if ((data.size() % numDatumInDay) != 0)
			throw new ElaborationException("Error: wrong data number for daily minimum compute");

		int daysNumber = data.size() / numDatumInDay;
		DailyValue[] resultValues = new DailyValue[daysNumber];

		// ciclo su tutti i giorni
		for (int i = 0; i < daysNumber; i++) {
			double minValue = Integer.MAX_VALUE;
			// ciclo sul singolo giorno
			DailyValue tempMin = null;
			Date dailyDate = null;
			for (int j = 0; j < numDatumInDay; j++) {
				MeasureValue datum = data.get((numDatumInDay * i) + j);
				Double value = getDatumValue(datum, numDecimals);
				if (value != null && value.doubleValue() < minValue) {
					minValue = value;
					tempMin = new DailyValue(ElabUtils.getDay(datum.getTimestamp()), value);
				} else
					dailyDate = ElabUtils.getDay(datum.getTimestamp());
			}

			if (tempMin != null && tempMin.getValue() != null) {
				resultValues[i] = tempMin;
			} else {
				tempMin = new DailyValue(dailyDate);
				resultValues[i] = tempMin;
			}
		}

		return resultValues;
	}

}
