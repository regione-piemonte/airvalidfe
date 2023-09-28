/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class TimelyMinimumAbsoluteElaboration extends TimelyElaboration {

	public static final String ID = "absminimumbyhour";

	public TimelyMinimumAbsoluteElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		// in un giorno ci sono 1440 minuti, quindi il num di dati che ho IN UN
		// GIORNO e' dato dal numero di minuti totali(1440) diviso per il periodo di
		// campionamento
		int numDatumInDay = 1440 / dataPeriod_m;

		// N.B:qui il numero di giorni del periodo che si vuole analizzare NON
		// INTERESSANO, interessano i dati campionati
		TimelyValue[] resultValues = new TimelyValue[numDatumInDay];

		List<Value[]> timeArraysList = splitToTimelyArrays(data, dataPeriod_m, numDecimals);

		for (int i = 0; i < numDatumInDay; i++) {
			Value[] timeValues = timeArraysList.get(i);
			// calcolo il minimo
			TimelyValue minTimelyValue = getTvMin(timeValues);
			resultValues[i] = minTimelyValue;
		}

		return resultValues;
	}

}
