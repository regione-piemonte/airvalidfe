/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.ResourceBundle;

import it.csi.srrqa.airdb.model.DBConstants;
import it.csi.srrqa.airdb.model.MeasureValue;
import it.csi.srrqa.airdb.model.NameWithKey;
import it.csi.srrqa.airdb.model.NameWithKeyAndPeriod;
import it.csi.srrqa.airdb.model.Parameter;
import it.csi.srrqa.airdb.model.Sensor;
import it.csi.srrqa.airdb.model.Station;
import it.csi.srrqa.airdb.model.TimeInterval;
import it.csi.srrqa.airdb.rest.client.AirDbRestClient;
import it.csi.srrqa.airvalidsrv.rest.AnagraphCache;
import it.csi.srrqa.airvalidsrv.rest.AuthCache;
import it.csi.srrqa.airvalidsrv.rest.AuthException;
import it.csi.srrqa.airvalidsrv.rest.DeferredTaskException;
import it.csi.srrqa.airvalidsrv.rest.ProgressTracker;
import it.csi.srrqa.airvalidsrv.rest.UserCache;
import it.csi.srrqa.airvalidsrv.rest.Utils;
import it.csi.srrqa.airvalidsrv.specreport.ReportAnagraph.ItemType;
import it.csi.srrqa.airvalidsrv.specreport.ReportResult.PlotType;
import it.csi.srrqa.airvalidsrv.specreport.ReportResult.TimeBase;

public class PersistenceAnalysisReport extends SpecReport {

	private TimeInterval ti1;
	private TimeInterval ti2;

	public PersistenceAnalysisReport(ResourceBundle messages, Long beginTime, Long endTime) {
		super(messages);
		if (beginTime == null)
			throw new IllegalArgumentException("Begin time not specified");
		if (endTime == null)
			throw new IllegalArgumentException("End time not specified");
		if (endTime < beginTime)
			throw new IllegalArgumentException("End time before begin time");
		Calendar cal1 = new GregorianCalendar();
		cal1.setTime(thisYear(beginTime));
		int year1 = cal1.get(Calendar.YEAR);
		Calendar cal2 = new GregorianCalendar();
		cal2.setTime(thisYear(endTime));
		int year2 = cal2.get(Calendar.YEAR);
		if (year2 - year1 != 1)
			throw new IllegalArgumentException(
					"End time '" + year2 + "' should be one year after begin time '" + year1 + "'");
		ti1 = new TimeInterval(cal1.getTime(), nextYear(cal1.getTime().getTime()));
		ti2 = new TimeInterval(ti1.getEnd(), nextYear(ti1.getEnd().getTime()));
	}

	@Override
	public ReportAnagraph getAnagraph(AnagraphCache anagraphCache, UserCache userCache, AuthCache authCache,
			String itemType, List<String> listItemIds) throws AuthException {
		ReportAnagraph ra = null;
		List<NameWithKeyAndPeriod> items = new ArrayList<>();
		if (itemType == null) {
			ra = new ReportAnagraph(ItemType.NETWORK, 1, null, false,
					anagraphCache.getNetworkNames(ti1.getBegin(), ti2.getEnd(), null, userCache, authCache));
		} else if (ItemType.NETWORK.toString().equalsIgnoreCase(itemType)) {
			for (String netId : listItemIds)
				items.addAll(anagraphCache.getStationNamesForNetwork(netId, ti1.getBegin(), ti2.getEnd(), userCache,
						authCache));
			ra = new ReportAnagraph(ItemType.STATION, 1, null, false, items);
		} else if (ItemType.STATION.toString().equalsIgnoreCase(itemType)) {
			for (String stationId : listItemIds)
				items.addAll(anagraphCache.getSensorNamesForStation(stationId, ti1.getBegin(), ti2.getEnd(), userCache,
						authCache));
			ra = new ReportAnagraph(ItemType.SENSOR, 1, null, true, items);
		}
		return ra;
	}

	@Override
	public ReportResult execute(ProgressTracker progressTracker, AnagraphCache anagraphCache, UserCache userCache,
			AuthCache authCache, AirDbRestClient client, String itemType, List<String> listItemIds,
			short verificationLevel) throws AuthException, DeferredTaskException {
		if (verificationLevel != DBConstants.VERIFICATION_FINAL
				&& verificationLevel != DBConstants.VERIFICATION_PRELIMINARY)
			throw new IllegalArgumentException("This reports requires verification level 'preliminary' or 'final'");
		if (!ItemType.SENSOR.toString().equalsIgnoreCase(itemType))
			throw new IllegalArgumentException("Wrong item type: expected SENSOR, found " + itemType);
		progressTracker.setProgress(0);
		int progress = 0;
		int total = listItemIds.size() * 3;
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy");
		ReportDescriptor desc = getDescriptor();
		ReportResult result = new ReportResult(desc.getId(), desc.getName(), desc.getDescription(), TimeBase.TIMESTAMP,
				PlotType.LINEAR);
		List<DataSeries> listDataSeries = new ArrayList<DataSeries>();
		for (String sensorId : listItemIds) {
			progressTracker.checkExpired();
			Station station = anagraphCache.getStation(Utils.extractStationId(sensorId), ti1.getBegin(), ti2.getEnd());
			Sensor sensor = anagraphCache.getSensor(sensorId, ti1.getBegin(), ti2.getEnd());
			Integer regTime = sensor.getRecords().get(0).getTempo_registrazione();
			if (regTime == null)
				throw new IllegalArgumentException("Registration time for sensor " + sensor.keyToString() + " is null");
			Parameter param = anagraphCache.getParameter(sensor.getId_parametro());
			Integer numDec = param.getNum_decimali();
			if (numDec == null)
				throw new IllegalArgumentException(
						"Number of decimals for parameter " + param.nameToString() + " is null");
			NameWithKey mu = anagraphCache.getMeasureUnit(anagraphCache.getMeasureUnitId(sensor.getId_parametro()));
			DataSeries dataSeries = new DataSeries(sensorId, station.nameToString() + " - " + param.nameToString(),
					mu.getExtraInfo(), numDec);
			progressTracker.setActivity(getString("data_read_for_sensor") + " " + sensor.nameToString() + ", "
					+ getString("year") + " " + sdf.format(ti1.getBegin()));
			List<MeasureValue> listMeasure1 = client.getValidData(sensorId, ti1.getBegin().getTime(),
					ti1.getEnd().getTime(), regTime, verificationLevel);
			progressTracker.setProgress(100 * progress++ / total);
			progressTracker.setActivity(getString("data_read_for_sensor") + " " + sensor.nameToString() + ", "
					+ getString("year") + " " + sdf.format(ti2.getBegin()));
			List<MeasureValue> listMeasure2 = client.getValidData(sensorId, ti2.getBegin().getTime(),
					ti2.getEnd().getTime(), regTime, verificationLevel);
			progressTracker.setProgress(100 * progress++ / total);
			progressTracker.setActivity(getString("compute_for_sensor") + " " + sensor.nameToString());
			int i1 = 0;
			int i2 = 0;
			Calendar cal1 = new GregorianCalendar();
			Calendar cal2 = new GregorianCalendar();
			double accumulator = 0.0;
			while (i1 < listMeasure1.size() && i2 < listMeasure2.size()) {
				MeasureValue mv1 = listMeasure1.get(i1);
				MeasureValue mv2 = listMeasure2.get(i2);
				cal1.setTime(mv1.getTimestamp());
				cal2.setTime(mv2.getTimestamp());
				while (i1 < listMeasure1.size() && isFebruary29(cal1)) {
					mv1 = listMeasure1.get(++i1);
					cal1.setTime(mv1.getTimestamp());
				}
				while (i2 < listMeasure2.size() && isFebruary29(cal2)) {
					mv2 = listMeasure2.get(++i2);
					cal2.setTime(mv2.getTimestamp());
				}
				checkTimestampAlignement(cal1, cal2);
				Value value = computeValue(mv1, mv2, accumulator);
				dataSeries.addValue(value);
				if (value.getValue() != null)
					accumulator = value.getValue();
				i1++;
				i2++;
			}
			listDataSeries.add(dataSeries);
			progressTracker.setProgress(100 * progress++ / total);
		}
		result.setDataSeries(listDataSeries);
		return result;
	}

	private void checkTimestampAlignement(Calendar cal1, Calendar cal2) {
		boolean aligned = cal1.get(Calendar.MONTH) == cal2.get(Calendar.MONTH)
				&& cal1.get(Calendar.DAY_OF_MONTH) == cal2.get(Calendar.DAY_OF_MONTH)
				&& cal1.get(Calendar.HOUR) == cal2.get(Calendar.HOUR)
				&& cal1.get(Calendar.MINUTE) == cal2.get(Calendar.MINUTE)
				&& cal1.get(Calendar.SECOND) == cal2.get(Calendar.SECOND);
		if (!aligned && (isFebruary29At00(cal1) || isFebruary29At00(cal2)))
			aligned = true;
		if (!aligned)
			throw new IllegalStateException("Found timestamp in first year '" + cal1
					+ "' not aligned to the corresponding timestamp '" + cal2 + "' in second year");
	}

	private Value computeValue(MeasureValue mv1, MeasureValue mv2, double accumulator) {
		Value value = new Value();
		value.setTimestamp(mv2.getTimestamp().getTime());
		Double v1 = mv1.getValore_validato();
		Double v2 = mv2.getValore_validato();
		Double diff = (v1 == null || v2 == null) ? null : v2 - v1;
		value.setValue(diff == null ? null : accumulator + diff);
		return value;
	}

}
