/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class GlobalMeanElaboration extends Elaboration {

	public static final String ID = "globalmean";

	public GlobalMeanElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		Value[] resultValues = new Value[0];
		Integer numDecimalsForError = numDecimals == null ? null : numDecimals + 1;

		Value[] values = new Value[data.size()];
		for (int i = 0; i < data.size(); i++) {
			Double value = getDatumValue(data.get(i), numDecimals);
			Date timestamp = data.get(i).getTimestamp();
			values[i] = new Value(timestamp, value);
		}
		Double meanValue = computeMean(values, null, numDecimals);
		if (meanValue != null) {
			resultValues = new Value[1];
			resultValues[0] = new Value(new Date(), meanValue,
					round(computeError(values, meanValue), numDecimalsForError));
		}

		return resultValues;
	}

	@Override
	public TimeBase getTimeBase() {
		return TimeBase.NONE;
	}

}
