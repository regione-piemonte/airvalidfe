/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class TimelyMaximumAbsoluteElaboration extends TimelyElaboration {

	public static final String ID = "absmaximumbyhour";

	public TimelyMaximumAbsoluteElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {

		// numero di dati totali da analizzare => data.size()
		// i campionament durante un giorno avvengono ogni dataPeriod_m minuti
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
			// calcolo il massimo
			TimelyValue maxTimelyValue = getTvMax(timeValues);
			resultValues[i] = maxTimelyValue;
		}

		return resultValues;
	}
}
