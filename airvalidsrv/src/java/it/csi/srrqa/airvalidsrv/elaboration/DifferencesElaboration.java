/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DifferencesElaboration extends Elaboration {

	public static final String ID = "hourlydifferences";

	public DifferencesElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		Value[] resultValues = new Value[data.size() - 1];
		for (int i = 1; i < data.size(); i++) {
			Double firstValue = getDatumValue(data.get(i - 1), numDecimals);
			Double secondValue = getDatumValue(data.get(i), numDecimals);
			Date timestamp = data.get(i).getTimestamp();

			if (firstValue != null && secondValue != null) {
				double diff = secondValue - firstValue;
				resultValues[i - 1] = new Value(timestamp, round(diff, numDecimals));
			} else
				resultValues[i - 1] = new Value(timestamp);
		}
		return resultValues;
	}

	@Override
	public TimeBase getTimeBase() {
		return TimeBase.TIMESTAMP;
	}

}
