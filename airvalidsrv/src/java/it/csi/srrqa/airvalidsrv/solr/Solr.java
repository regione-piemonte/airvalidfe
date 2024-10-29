/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import java.text.SimpleDateFormat;
import java.util.Date;

public class Solr {

	public static final String DATE_FMT = "yyyy-MM-dd";
	public static final String TIMESTAMP_FMT = "yyyy-MM-dd HH:mm";

	public static String addBeginDateConstraint(Date beginDate) {
		if (beginDate == null)
			return "";
		String beginDateStr = new SimpleDateFormat(DATE_FMT).format(beginDate);
		return " NOT data_fine:[* TO " + beginDateStr + "]";
	}

	public static String addEndDateConstraint(Date endDate) {
		return addEndDateConstraint(endDate, false);
	}

	public static String addEndDateConstraint(Date endDate, boolean included) {
		if (endDate == null)
			return "";
		String inclusion = included ? "*" : "";
		String endDateStr = new SimpleDateFormat(DATE_FMT).format(endDate);
		return " NOT data_inizio:[" + endDateStr + inclusion + " TO *]";
	}

	public static String addSensorBeginDateConstraint(Date beginDate) {
		if (beginDate == null)
			return "";
		String beginDateStr = new SimpleDateFormat(DATE_FMT).format(beginDate);
		return " NOT sensore_data_fine:[* TO " + beginDateStr + "]";
	}

	public static String addSensorEndDateConstraint(Date endDate) {
		return addSensorEndDateConstraint(endDate, false);
	}

	public static String addSensorEndDateConstraint(Date endDate, boolean included) {
		if (endDate == null)
			return "";
		String inclusion = included ? "*" : "";
		String endDateStr = new SimpleDateFormat(DATE_FMT).format(endDate);
		return " NOT sensore_data_inizio:[" + endDateStr + inclusion + " TO *]";
	}

}
