/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;

public class WeekTimelyValue extends Value {

	public WeekTimelyValue(Date timestamp, int dayWeek) {
		super(ElabUtils.getTimeAndDayOfWeek(timestamp, dayWeek));
	}

	public WeekTimelyValue(Date timestamp, int dayWeek, Double value) {
		super(ElabUtils.getTimeAndDayOfWeek(timestamp, dayWeek), value);
	}

	public WeekTimelyValue(Date timestamp, int dayWeek, Double value, Double error) {
		super(ElabUtils.getTimeAndDayOfWeek(timestamp, dayWeek), value, error);
	}


}
