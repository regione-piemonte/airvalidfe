/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;

public class DailyValue extends Value {

	public DailyValue(Date timestamp) {
		super(timestamp);
	}

	public DailyValue(Date timestamp, Double value) {
		super(timestamp, value);
	}

	public DailyValue(Date timestamp, Double value, Double error) {
		super(timestamp, value, error);
	}

}
