/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class HourlyScalingElaboration extends HourlyMeanElaboration {

	public static final String ID = "hourlyscaling";

	public HourlyScalingElaboration(String name) {
		super(name);
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		Value[] hourlyValues = super.computeImpl(data, dataPeriod_m, numDecimals);
		return doScaling(hourlyValues);
	}

}
