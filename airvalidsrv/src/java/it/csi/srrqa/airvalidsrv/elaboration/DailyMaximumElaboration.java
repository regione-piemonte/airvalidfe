/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DailyMaximumElaboration extends DailyElaboration {

	public static final String ID = "dailymaximum";

	public DailyMaximumElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected DailyValue[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		// in un giorno ci sono 1440 minuti, quindi il num di dati che ho IN UN
		// GIORNO
		// e' dato dal numero di minuti totali(1440) diviso per il periodo di
		// campionamento
		int numDatumInDay = 1440 / dataPeriod_m;
		if ((data.size() % numDatumInDay) != 0)
			throw new ElaborationException("Error: wrong data number for daily maximum compute");
		// il numero di dati totali arrivati e' dati.size() e quindi
		// dividendolo per il numero di dati al giorno, so per quanti giorni
		// sono arrivati i dati
		int daysNumber = data.size() / numDatumInDay;
		DailyValue[] resultValues = new DailyValue[daysNumber];

		// ciclo su tutti i giorni
		for (int i = 0; i < daysNumber; i++) {
			double maxValue = Integer.MIN_VALUE;
			// ciclo sul singolo giorno
			DailyValue tempMax = null;
			Date dailyDate = null;
			for (int j = 0; j < numDatumInDay; j++) {
				MeasureValue datum = data.get((numDatumInDay * i) + j);
				Double value = getDatumValue(datum, numDecimals);
				if (value != null && value.doubleValue() > maxValue) {
					maxValue = value;
					tempMax = new DailyValue(ElabUtils.getDay(datum.getTimestamp()), value);
				} else
					dailyDate = ElabUtils.getDay(datum.getTimestamp());
			}
			if (tempMax != null && tempMax.getValue() != null) {
				resultValues[i] = tempMax;
			} else {
				tempMax = new DailyValue(dailyDate);
				resultValues[i] = tempMax;
			}
		}

		return resultValues;
	}
}
