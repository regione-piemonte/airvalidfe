/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

public class HolidayDay {

	private int month;
	private int day;

	public HolidayDay(int month, int day) {
		super();
		this.month = month;
		this.day = day;
	}

	public int getMonth() {
		return month;
	}

	public int getDay() {
		return day;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + day;
		result = prime * result + month;
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		HolidayDay other = (HolidayDay) obj;
		if (day != other.day)
			return false;
		if (month != other.month)
			return false;
		return true;
	}

}
