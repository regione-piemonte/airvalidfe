/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DailyScalingElaboration extends DailyMeanElaboration {

	public static final String ID = "dailyscaling";

	public DailyScalingElaboration(String name) {
		super(name);
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		Value[] dailyValues = super.computeImpl(data, dataPeriod_m, numDecimals);
		return doScaling(dailyValues);
	}

}
