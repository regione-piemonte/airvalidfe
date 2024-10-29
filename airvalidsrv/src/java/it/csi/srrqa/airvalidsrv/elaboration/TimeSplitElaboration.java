/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;
import it.csi.srrqa.airvalidsrv.elaboration.TimeSplitElaborationFactory.SplitPeriod;

public class TimeSplitElaboration extends DailyElaboration {

	private SplitPeriod splitPeriod;

	private TimeBase timeBase;

	private Date begin;

	private Date end;

	public TimeSplitElaboration(String name, SplitPeriod splitPeriod, TimeBase timeBase, Date begin, Date end) {
		super(name);
		this.splitPeriod = splitPeriod;
		this.timeBase = timeBase;
		this.begin = begin;
		this.end = end;
	}

	@Override
	public String getId() {
		return null;
	}

	@Override
	protected Value[] computeImpl(List<MeasureValue> data, int dataPeriod_m, Integer numDecimals)
			throws ElaborationException {
		List<Value> listValues = new ArrayList<Value>();
		int prevFieldValue = -1;
		int periodAddendum = 0;
		Calendar cal = new GregorianCalendar();
		cal.set(Calendar.YEAR, 1970);
		cal.set(Calendar.MONTH, 0);
		cal.set(Calendar.DAY_OF_MONTH, 31);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		for (int i = 0; i < data.size(); i++) {
			MeasureValue datum = data.get(i);
			Double datumValue = getDatumValue(datum, numDecimals);
			Date datumTimestamp = datum.getTimestamp();
			if (!datumTimestamp.after(begin))
				continue;
			if (datumTimestamp.after(end))
				break;
			cal.setTime(datumTimestamp);
			if (splitPeriod.equals(SplitPeriod.DAY)) {
				cal.set(Calendar.YEAR, 1970);
				cal.set(Calendar.MONTH, 0);
				cal.set(Calendar.DAY_OF_MONTH, 1);
				if (cal.get(Calendar.HOUR_OF_DAY) == 0 && cal.get(Calendar.MINUTE) == 0
						&& cal.get(Calendar.SECOND) == 0)
					cal.add(Calendar.DAY_OF_MONTH, 1);
			} else if (splitPeriod.equals(SplitPeriod.WEEK)) {
				int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
				if (dayOfWeek < prevFieldValue)
					periodAddendum++;
				prevFieldValue = dayOfWeek;
				cal.set(Calendar.YEAR, 1970);
				cal.set(Calendar.MONTH, 0);
				cal.set(Calendar.DAY_OF_MONTH, 4);
				cal.add(Calendar.DAY_OF_MONTH, dayOfWeek - Calendar.SUNDAY + 7 * periodAddendum);
			} else if (splitPeriod.equals(SplitPeriod.MONTH)) { // TODO: da provare
				int dom = cal.get(Calendar.DAY_OF_MONTH);
				if (dom < prevFieldValue)
					periodAddendum++;
				cal.set(Calendar.YEAR, 1970);
				cal.set(Calendar.MONTH, 0 + periodAddendum);
				if (dom < prevFieldValue && prevFieldValue < 31 && dom == 1 && cal.get(Calendar.HOUR_OF_DAY) == 0
						&& cal.get(Calendar.MINUTE) == 0 && cal.get(Calendar.SECOND) == 0) {
					cal.set(Calendar.MONTH, 0 + periodAddendum - 1);
					cal.set(Calendar.DAY_OF_MONTH, prevFieldValue + 1);
				}
				prevFieldValue = dom;
			} else if (splitPeriod.equals(SplitPeriod.YEAR)) { // TODO: da provare
				int month = cal.get(Calendar.MONTH);
				if (month == Calendar.FEBRUARY && cal.get(Calendar.DAY_OF_MONTH) == 29)
					continue;
				if (month < prevFieldValue)
					periodAddendum++;
				prevFieldValue = month;
				cal.set(Calendar.YEAR, 1970 + periodAddendum);
			} else
				throw new IllegalStateException("Unknown time split period: " + splitPeriod);
			datumTimestamp = cal.getTime();
			Value value = datumValue == null ? new Value(datumTimestamp) : new Value(datumTimestamp, datumValue);
			listValues.add(value);
		}
		return listValues.toArray(new Value[listValues.size()]);
	}

	@Override
	public TimeBase getTimeBase() {
		return timeBase;
	}

	@Override
	public String toString() {
		return "TimeSplitElaboration [splitPeriod=" + splitPeriod + ", timeBase=" + timeBase + ", begin=" + begin
				+ ", end=" + end + "]";
	}

}
