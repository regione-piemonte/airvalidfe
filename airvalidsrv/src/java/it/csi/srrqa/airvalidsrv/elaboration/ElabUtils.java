/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

public class ElabUtils {

	static Date getDay(Date timestamp) {
		Calendar cal = new GregorianCalendar();
		cal.setLenient(true);
		cal.setTime(timestamp);
		if (cal.get(Calendar.HOUR_OF_DAY) == 0 && cal.get(Calendar.MINUTE) == 0 && cal.get(Calendar.SECOND) == 0)
			cal.add(Calendar.SECOND, -1);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		return cal.getTime();
	}

	static int getHour(Date timestamp) {
		Calendar cal = new GregorianCalendar();
		cal.setTime(timestamp);
		return cal.get(Calendar.HOUR_OF_DAY);
	}

	static int getMinutes(Date timestamp) {
		Calendar cal = new GregorianCalendar();
		cal.setTime(timestamp);
		int minutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
		return minutes == 0 ? 1440 : minutes;
	}

	static Date getTime(Date timestamp) {
		Calendar cal = new GregorianCalendar();
		cal.setLenient(true);
		cal.setTime(timestamp);
		int dayOfMonth = 1;
		if (cal.get(Calendar.HOUR_OF_DAY) == 0 && cal.get(Calendar.MINUTE) == 0 && cal.get(Calendar.SECOND) == 0)
			dayOfMonth++;
		cal.set(Calendar.YEAR, 1970);
		cal.set(Calendar.MONTH, 0);
		cal.set(Calendar.DAY_OF_MONTH, dayOfMonth);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		return cal.getTime();
	}

	static Date getTimeAndDayOfWeek(Date timestamp, int dayWeek) {
		if (dayWeek < 1 || dayWeek > 7)
			throw new IllegalArgumentException("Day of week should range from 1 to 7");
		Calendar cal = new GregorianCalendar();
		cal.setLenient(true);
		cal.setTime(timestamp);
		int dayOfMonth = 3; // saturday 03/01/1970
		if (cal.get(Calendar.HOUR_OF_DAY) == 0 && cal.get(Calendar.MINUTE) == 0 && cal.get(Calendar.SECOND) == 0)
			dayOfMonth++;
		cal.set(Calendar.YEAR, 1970);
		cal.set(Calendar.MONTH, 0);
		cal.set(Calendar.DAY_OF_MONTH, dayOfMonth); 
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		cal.add(Calendar.DAY_OF_WEEK, dayWeek);
		return cal.getTime();
	}

}
