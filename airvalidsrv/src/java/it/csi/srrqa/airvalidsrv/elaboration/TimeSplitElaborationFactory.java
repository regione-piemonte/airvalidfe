/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;

import it.csi.srrqa.airvalidsrv.elaboration.Elaboration.PlotType;
import it.csi.srrqa.airvalidsrv.elaboration.Elaboration.TimeBase;

public class TimeSplitElaborationFactory implements ElaborationItf {

	public enum SplitPeriod {
		YEAR, MONTH, WEEK, DAY
	};

	private SplitPeriod splitPeriod;

	private String id;

	private String baseName;

	private int calendarField;

	private DateFormat timeFormat;

	private TimeBase timeBase;

	private Elaboration[] elaborations = null;

	public TimeSplitElaborationFactory(String id, String name, SplitPeriod splitPeriod) {
		this.splitPeriod = splitPeriod;
		this.id = id;
		baseName = name;
		if (splitPeriod.equals(SplitPeriod.DAY)) {
			calendarField = Calendar.DAY_OF_MONTH;
			timeFormat = new SimpleDateFormat("dd-MM-yyyy");
			timeBase = TimeBase.TIME;
		} else if (splitPeriod.equals(SplitPeriod.WEEK)) {
			calendarField = Calendar.WEEK_OF_YEAR;
			timeFormat = new SimpleDateFormat("ww yyyy");
			timeBase = TimeBase.WEEKTIME;
		} else if (splitPeriod.equals(SplitPeriod.MONTH)) {
			calendarField = Calendar.MONTH;
			timeFormat = new SimpleDateFormat("MMMMM yyyy");
			timeBase = TimeBase.TIMESTAMP_NO_YEAR_MONTH;
		} else if (splitPeriod.equals(SplitPeriod.YEAR)) {
			calendarField = Calendar.YEAR;
			timeFormat = new SimpleDateFormat("yyyy");
			timeBase = TimeBase.TIMESTAMP_NO_YEAR;
		} else
			throw new IllegalStateException("Unknown time split period: " + splitPeriod);
	}

	@Override
	public void setTimeInterval(Date begin, Date end) {
		int count = 0;
		List<Elaboration> listElaborations = new ArrayList<Elaboration>();
		Calendar cal = new GregorianCalendar();
		cal.setTime(begin);
		do {
			Date intervalBegin = cal.getTime();
			String name = timeFormat.format(intervalBegin);
			cal.add(calendarField, 1);
			listElaborations.add(new TimeSplitElaboration(name, splitPeriod, timeBase, intervalBegin, cal.getTime()));
			count++;
		} while (cal.getTime().before(end));
		elaborations = listElaborations.toArray(new Elaboration[count]);
	}

	@Override
	public Elaboration[] getElaborations() {
		if (elaborations == null)
			throw new IllegalStateException("Time interval not set");
		return elaborations;
	}

	@Override
	public String getId() {
		return id;
	}

	@Override
	public String getName() {
		return baseName;
	}

	@Override
	public TimeBase getTimeBase() {
		return timeBase;
	}

	@Override
	public PlotType getPlotType() {
		return PlotType.LINEAR;
	}

}
