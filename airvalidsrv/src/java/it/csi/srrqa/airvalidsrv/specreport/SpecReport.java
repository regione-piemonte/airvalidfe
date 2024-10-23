/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.ResourceBundle;

import org.apache.log4j.Logger;

import it.csi.srrqa.airdb.model.DataUtils;
import it.csi.srrqa.airdb.model.NameWithKeyAndPeriod;
import it.csi.srrqa.airdb.model.TimeInterval;
import it.csi.srrqa.airdb.rest.client.AirDbRestClient;
import it.csi.srrqa.airvalidsrv.rest.AirValidApp;
import it.csi.srrqa.airvalidsrv.rest.AnagraphCache;
import it.csi.srrqa.airvalidsrv.rest.AuthCache;
import it.csi.srrqa.airvalidsrv.rest.AuthException;
import it.csi.srrqa.airvalidsrv.rest.DeferredTaskException;
import it.csi.srrqa.airvalidsrv.rest.ProgressTracker;
import it.csi.srrqa.airvalidsrv.rest.SensorNameWithKeyAndPeriod;
import it.csi.srrqa.airvalidsrv.rest.UserCache;
import it.csi.srrqa.airvalidsrv.rest.Utils;

public abstract class SpecReport {

	private static Logger lg = Logger.getLogger(AirValidApp.LOGGER_BASENAME + "." + SpecReport.class.getSimpleName());

	private ReportDescriptor descriptor;
	private ResourceBundle messages;

	public SpecReport(ResourceBundle messages) {
		this.messages = messages;
	}

	public abstract ReportAnagraph getAnagraph(AnagraphCache anagraphCache, UserCache userCache, AuthCache authCache,
			String itemType, List<String> listItemIds) throws AuthException;

	public abstract ReportResult execute(ProgressTracker progressTracker, AnagraphCache anagraphCache,
			UserCache userCache, AuthCache authCache, AirDbRestClient client, String itemType, List<String> listItemIds,
			short verificationLevel) throws AuthException, DeferredTaskException;

	protected ReportDescriptor getDescriptor() {
		return descriptor;
	}

	protected void setDescriptor(ReportDescriptor descriptor) {
		this.descriptor = descriptor;
	}

	protected Date thisDate(long time_ms) {
		return DataUtils.thisDay(new Date(time_ms));
	}

	protected Date nextDate(long time_ms) {
		return DataUtils.nextDay(new Date(time_ms));
	}

	protected Date thisMonth(long time_ms) {
		Calendar cal = new GregorianCalendar();
		cal.setTimeInMillis(time_ms);
		cal.set(Calendar.DAY_OF_MONTH, 1);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		return cal.getTime();
	}

	protected Date nextMonth(long time_ms) {
		Calendar cal = new GregorianCalendar();
		cal.setTimeInMillis(time_ms);
		cal.set(Calendar.DAY_OF_MONTH, 1);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		cal.add(Calendar.MONTH, 1);
		return cal.getTime();
	}

	protected Date thisYear(long time_ms) {
		Calendar cal = new GregorianCalendar();
		if (time_ms < 10000)
			cal.set(Calendar.YEAR, (int) time_ms);
		else
			cal.setTimeInMillis(time_ms);
		cal.set(Calendar.MONTH, Calendar.JANUARY);
		cal.set(Calendar.DAY_OF_MONTH, 1);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		return cal.getTime();
	}

	protected Date nextYear(long time_ms) {
		Calendar cal = new GregorianCalendar();
		if (time_ms < 10000)
			cal.set(Calendar.YEAR, (int) time_ms);
		else
			cal.setTimeInMillis(time_ms);
		cal.set(Calendar.MONTH, Calendar.JANUARY);
		cal.set(Calendar.DAY_OF_MONTH, 1);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		cal.add(Calendar.YEAR, 1);
		return cal.getTime();
	}

	protected boolean isSameDay(Calendar cal, long timestamp) {
		boolean timeZero = isTimeZero(cal);
		if (timeZero)
			cal.add(Calendar.MINUTE, -1);
		Calendar cal2 = new GregorianCalendar();
		cal2.setTimeInMillis(timestamp);
		if (isTimeZero(cal2))
			cal2.add(Calendar.MINUTE, -1);
		boolean same = cal.get(Calendar.YEAR) == cal2.get(Calendar.YEAR)
				&& cal.get(Calendar.MONTH) == cal2.get(Calendar.MONTH)
				&& cal.get(Calendar.DAY_OF_MONTH) == cal2.get(Calendar.DAY_OF_MONTH);
		if (timeZero)
			cal.add(Calendar.MINUTE, 1);
		return same;
	}

	protected boolean isFebruary29(Calendar cal) {
		boolean timeZero = isTimeZero(cal);
		if (timeZero)
			cal.add(Calendar.MINUTE, -1);
		boolean february29 = cal.get(Calendar.MONTH) == Calendar.FEBRUARY && cal.get(Calendar.DAY_OF_MONTH) == 29;
		if (timeZero)
			cal.add(Calendar.MINUTE, 1);
		return february29;
	}

	protected boolean isTimeZero(Calendar cal) {
		return cal.get(Calendar.HOUR) == 0 && cal.get(Calendar.MINUTE) == 0 && cal.get(Calendar.SECOND) == 0;
	}

	protected boolean isFebruary29At00(Calendar cal) {
		return cal.get(Calendar.MONTH) == Calendar.FEBRUARY && cal.get(Calendar.DAY_OF_MONTH) == 29
				&& cal.get(Calendar.HOUR) == 0 && cal.get(Calendar.MINUTE) == 0 && cal.get(Calendar.SECOND) == 0;
	}

	protected void checkTimestampAlignement(Date date1, Date date2) {
		if (!date1.equals(date2))
			throw new IllegalStateException("Timestamp mismatch: found '" + date2 + "', expected '" + date1 + "'");
	}

	protected boolean hasParameter(String paramId, NameWithKeyAndPeriod stationInfo, AnagraphCache anagraphCache,
			UserCache userCache, AuthCache authCache, Date begin, Date end) throws AuthException {
		List<SensorNameWithKeyAndPeriod> listSensor = anagraphCache.getSensorNamesForStation(stationInfo.getKey(),
				begin, end, userCache, authCache);
		for (SensorNameWithKeyAndPeriod sensor : listSensor) {
			if (paramId.equals(Utils.extractParameterId(sensor.getKey())))
				return true;
		}
		return false;
	}

	protected List<NameWithKeyAndPeriod> appendParamId(String paramId, List<NameWithKeyAndPeriod> listNetworks) {
		List<NameWithKeyAndPeriod> listResult = new ArrayList<NameWithKeyAndPeriod>();
		for (NameWithKeyAndPeriod nwk : listNetworks)
			listResult.add(replaceKey(Utils.makeNetParamSensorId(nwk.getKey(), paramId), nwk));
		return listResult;
	}

	protected NameWithKeyAndPeriod replaceKey(String newKey, NameWithKeyAndPeriod nwk) {
		return new NameWithKeyAndPeriod(nwk.getName(), newKey, nwk.isActive(), nwk.getExtraInfo(), nwk.getFlags(),
				nwk.getBeginDate(), nwk.getEndDate());
	}

	protected List<TimeInterval> splitByMonth(TimeInterval ti) {
		lg.trace("Splitting by month: " + ti + "....");
		List<TimeInterval> listResult = new ArrayList<TimeInterval>();
		Calendar cal = new GregorianCalendar();
		Date begin = ti.getBegin();
		Date end = null;
		while (begin.before(ti.getEnd())) {
			cal.setTime(begin);
			cal.set(Calendar.DAY_OF_MONTH, 1);
			cal.set(Calendar.HOUR_OF_DAY, 0);
			cal.set(Calendar.MINUTE, 0);
			cal.set(Calendar.SECOND, 0);
			cal.set(Calendar.MILLISECOND, 0);
			cal.add(Calendar.MONTH, 1);
			end = cal.getTime().before(ti.getEnd()) ? cal.getTime() : ti.getEnd();
			TimeInterval monthlyTi = new TimeInterval(begin, end);
			lg.trace(monthlyTi);
			listResult.add(monthlyTi);
			begin = end;
		}
		return listResult;
	}

	public String getExecutionType(String itemType) {
		return itemType;
	}

	protected String getString(String key) {
		return Utils.getString(messages, key);
	}

}
