/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;

public class TimelyValue extends Value {

	public TimelyValue(Date timestamp) {
		super(ElabUtils.getTime(timestamp));
	}

	public TimelyValue(Date timestamp, Double value) {
		super(ElabUtils.getTime(timestamp), value);
	}

	public TimelyValue(Date timestamp, Double value, Double error) {
		super(ElabUtils.getTime(timestamp), value, error);
	}

}
