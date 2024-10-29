/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class AbsMaximumElaboration extends Elaboration {

	public static final String ID = "absmaximum";

	public AbsMaximumElaboration(String name) {
		super(name);
	}

	@Override
	public String getId() {
		return ID;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		Value[] values = new Value[data.size()];
		for (int i = 0; i < data.size(); i++) {
			Double value = getDatumValue(data.get(i), numDecimals);
			Date timestamp = data.get(i).getTimestamp();
			values[i] = new Value(timestamp, value);
		}
		return (getMax(values));
	}

	@Override
	public TimeBase getTimeBase() {
		return TimeBase.TIMESTAMP;
	}

	@Override
	public PlotType getPlotType() {
		return PlotType.LINEAR;
	}

}
