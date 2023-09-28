/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;

public class DailyValue extends Value {

	public DailyValue(Date timestamp) {
		super(ElabUtils.getDay(timestamp));
	}

	public DailyValue(Date timestamp, Double value) {
		super(ElabUtils.getDay(timestamp), value);
	}

	public DailyValue(Date timestamp, Double value, Double error) {
		super(ElabUtils.getDay(timestamp), value, error);
	}

}
