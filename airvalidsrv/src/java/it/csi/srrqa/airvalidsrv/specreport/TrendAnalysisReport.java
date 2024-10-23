/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Locale;
import java.util.Map;
import java.util.ResourceBundle;

import org.apache.log4j.Logger;

import it.csi.srrqa.airdb.model.DBConstants;
import it.csi.srrqa.airdb.model.MeasureValue;
import it.csi.srrqa.airdb.model.NameWithKey;
import it.csi.srrqa.airdb.model.NameWithKeyAndPeriod;
import it.csi.srrqa.airdb.model.Parameter;
import it.csi.srrqa.airdb.model.Sensor;
import it.csi.srrqa.airdb.model.Station;
import it.csi.srrqa.airdb.model.TimeInterval;
import it.csi.srrqa.airdb.rest.client.AirDbRestClient;
import it.csi.srrqa.airvalidsrv.rest.AirValidApp;
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

public class TrendAnalysisReport extends SpecReport {

	private static Logger lg = Logger
			.getLogger(AirValidApp.LOGGER_BASENAME + "." + TrendAnalysisReport.class.getSimpleName());

	private TimeInterval ti;
	private List<TimeInterval> listMonthlyTi;

	public TrendAnalysisReport(ResourceBundle messages, Long beginTime, Long endTime) {
		super(messages);
		if (beginTime == null)
			throw new IllegalArgumentException("Begin time not specified");
		if (endTime == null)
			throw new IllegalArgumentException("End time not specified");
		if (endTime < beginTime)
			throw new IllegalArgumentException("End time before begin time");
		ti = new TimeInterval(thisYear(beginTime), nextYear(endTime));
		listMonthlyTi = splitByMonth(ti);
	}

	@Override
	public ReportAnagraph getAnagraph(AnagraphCache anagraphCache, UserCache userCache, AuthCache authCache,
			String itemType, List<String> listItemIds) throws AuthException {
		ReportAnagraph ra = null;
		List<NameWithKeyAndPeriod> items = new ArrayList<>();
		if (itemType == null) {
			ra = new ReportAnagraph(ItemType.PARAMETER, 1, 1, false, anagraphCache.getParameterNames());
		} else if (ItemType.PARAMETER.toString().equalsIgnoreCase(itemType)) {
			String paramId = listItemIds != null && !listItemIds.isEmpty() ? listItemIds.get(0) : null;
			if (paramId == null)
				throw new IllegalArgumentException("No parameter selected, please select one and only one parameter");
			ra = new ReportAnagraph(ItemType.NETWORK, 1, null, false, appendParamId(paramId,
					getNetworkNames(paramId, ti.getBegin(), ti.getEnd(), null, userCache, authCache, anagraphCache)));
		} else if (ItemType.NETWORK.toString().equalsIgnoreCase(itemType)) {
			for (String netId : listItemIds) {
				String paramId = Utils.extractParameterId(netId);
				String trueNetId = Utils.extractNetId(netId);
				List<NameWithKeyAndPeriod> listStations = anagraphCache.getStationNamesForNetwork(trueNetId,
						ti.getBegin(), ti.getEnd(), userCache, authCache);
				for (NameWithKeyAndPeriod nwk : listStations)
					if (hasParameter(paramId, nwk, anagraphCache, userCache, authCache, ti.getBegin(), ti.getEnd()))
						items.add(replaceKey(Utils.makeSensorId(nwk.getKey(), paramId), nwk));
			}
			ra = new ReportAnagraph(ItemType.STATION, 2, null, true, items);
		}
		return ra;
	}

	private List<NameWithKeyAndPeriod> getNetworkNames(String paramId, Date beginDate, Date endDate, String owner,
			UserCache userCache, AuthCache authCache, AnagraphCache anagraphCache) throws AuthException {
		List<NameWithKeyAndPeriod> listNetworks = anagraphCache.getNetworkNames(ti.getBegin(), ti.getEnd(), null,
				userCache, authCache);
		ListIterator<NameWithKeyAndPeriod> li = listNetworks.listIterator();
		while (li.hasNext()) {
			NameWithKeyAndPeriod netInfo = li.next();
			List<NameWithKeyAndPeriod> listStations = anagraphCache.getStationNamesForNetwork(netInfo.getKey(),
					ti.getBegin(), ti.getEnd(), userCache, authCache);
			boolean found = false;
			for (NameWithKeyAndPeriod nwk : listStations) {
				if (hasParameter(paramId, nwk, anagraphCache, userCache, authCache, ti.getBegin(), ti.getEnd())) {
					found = true;
					break;
				}
			}
			if (!found)
				li.remove();
		}
		return listNetworks;
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
		progressTracker.setActivity(getString("anagraph_read"));
		ReportDescriptor desc = getDescriptor();
		ReportResult result = new ReportResult(desc.getId(), desc.getName(), desc.getDescription(), TimeBase.MONTH_YEAR,
				PlotType.LINEAR);
		Map<String, DataSeries> mapDataSeries = new LinkedHashMap<String, DataSeries>();
		Integer regTime = null;
		Parameter param = null;
		Integer numDec = null;
		NameWithKey mu = null;
		for (String sensorId : listItemIds) {
			Station station = anagraphCache.getStation(Utils.extractStationId(sensorId), ti.getBegin(), ti.getEnd());
			Sensor sensor = anagraphCache.getSensor(sensorId, ti.getBegin(), ti.getEnd());
			Integer tmpRegTime = sensor.getRecords().get(0).getTempo_registrazione();
			if (tmpRegTime == null)
				throw new IllegalStateException("Registration time for sensor " + sensor.keyToString() + " is null");
			if (regTime == null)
				regTime = tmpRegTime;
			else if (!tmpRegTime.equals(regTime))
				throw new IllegalStateException("Registration time mismatch for sensor " + sensor.nameToString()
						+ ": expected " + regTime + ", found " + tmpRegTime);
			Parameter tmpParam = anagraphCache.getParameter(sensor.getId_parametro());
			if (tmpParam == null)
				throw new IllegalStateException("Cannot find parameter for sensor " + sensor.nameToString());
			if (param == null) {
				param = tmpParam;
				numDec = param.getNum_decimali();
				if (numDec == null)
					throw new IllegalStateException(
							"Number of decimals for parameter " + param.nameToString() + " is null");
				mu = anagraphCache.getMeasureUnit(anagraphCache.getMeasureUnitId(param.getId_parametro()));
				if (mu == null)
					throw new IllegalStateException("Cannot find measure unit for parameter " + param.nameToString());
			} else if (!tmpParam.key().equals(param.key())) {
				throw new IllegalStateException("Parameter mismatch for sensor " + sensor.nameToString() + ": expected "
						+ param + ", found " + tmpParam);
			}
			DataSeries dataSeries = new DataSeries(sensorId, station.nameToString(), mu.getExtraInfo(), numDec);
			mapDataSeries.put(sensorId, dataSeries);
		}
		int progress = 0;
		int total = listMonthlyTi.size();
		progressTracker.setProgress(10);
		SimpleDateFormat sdf = new SimpleDateFormat("MMMMM yyyy", new Locale(getString("locale")));
		for (TimeInterval monthlyTi : listMonthlyTi) {
			progressTracker.checkExpired();
			progressTracker.setActivity(getString("data_read") + " " + sdf.format(monthlyTi.getBegin()));
			lg.debug("Reading and processing data for period " + monthlyTi + "...");
			computeMonthlyMeans(monthlyTi, mapDataSeries, anagraphCache, userCache, authCache, client,
					verificationLevel, regTime);
			progressTracker.setProgress(90 * progress++ / total);
		}
		List<DataSeries> listDataSeries = new ArrayList<DataSeries>();
		listDataSeries.addAll(mapDataSeries.values());
		result.setDataSeries(listDataSeries);
		return result;
	}

	@Override
	public String getExecutionType(String itemType) {
		return "station".equalsIgnoreCase(itemType) ? "sensor" : itemType;
	}

	private void computeMonthlyMeans(TimeInterval monthlyTi, Map<String, DataSeries> mapDataSeries,
			AnagraphCache anagraphCache, UserCache userCache, AuthCache authCache, AirDbRestClient client,
			short verificationLevel, int regTime) {
		Map<String, List<MeasureValue>> mapMeasures = new HashMap<String, List<MeasureValue>>();
		Integer numMeasures = null;
		for (String sensorId : mapDataSeries.keySet()) {
			List<MeasureValue> listMeasure = client.getValidData(sensorId, monthlyTi.getBegin().getTime(),
					monthlyTi.getEnd().getTime(), regTime, verificationLevel);
			if (numMeasures == null)
				numMeasures = listMeasure.size();
			else if (!numMeasures.equals(listMeasure.size()))
				throw new IllegalStateException("Number of measures mismatch for sensorId " + sensorId + ": expected"
						+ numMeasures + ", found " + listMeasure.size());
			mapMeasures.put(sensorId, listMeasure);
		}
		if (numMeasures == null || mapDataSeries.isEmpty())
			throw new IllegalStateException("No sensors available for computation");
		if (mapDataSeries.size() < 2)
			throw new IllegalStateException("At least two sensors needed for computation");
		Accumulator[] mvAccumulator = new Accumulator[numMeasures];
		for (int i = 0; i < mvAccumulator.length; i++)
			mvAccumulator[i] = new Accumulator();
		for (String sensorId : mapMeasures.keySet()) {
			List<MeasureValue> listMeasure = mapMeasures.get(sensorId);
			for (int i = 0; i < mvAccumulator.length; i++)
				mvAccumulator[i].add(listMeasure.get(i));
		}
		for (String sensorId : mapMeasures.keySet()) {
			List<MeasureValue> listMeasure = mapMeasures.get(sensorId);
			List<Value> listRatio = new ArrayList<Value>();
			for (int i = 0; i < mvAccumulator.length; i++) {
				Value value = computeValue(listMeasure.get(i), mvAccumulator[i]);
				listRatio.add(value);
			}
			Value ratioMonthlyMean = computeRatioMonthlyMean(listRatio);
			DataSeries ds = mapDataSeries.get(sensorId);
			ds.addValue(ratioMonthlyMean);
		}
	}

	private Value computeValue(MeasureValue mv, Accumulator accumulator) {
		Value ratio = new Value();
		ratio.setTimestamp(mv.getTimestamp().getTime());
		ratio.setValue(null);
		Double value = mv.getValore_validato();
		if (value == null)
			return ratio;
		if (accumulator.getCount() <= 1)
			return ratio;
		double divider = (accumulator.getValue() - value) / (accumulator.getCount() - 1);
		if (divider == 0)
			return ratio;
		ratio.setValue(value / divider);
		return ratio;
	}

	private Value computeRatioMonthlyMean(List<Value> listRatio) {
		if (listRatio == null || listRatio.isEmpty())
			throw new IllegalStateException("No data available to compute ratio monthly mean");
		Date thisMonth = thisMonth(0); // Per SonarQube
		Accumulator accMonthly = new Accumulator();
		Accumulator accDaily = new Accumulator();
		Calendar cal = null;
		for (Value ratio : listRatio) {
			if (cal == null) {
				cal = new GregorianCalendar();
				cal.setTimeInMillis(ratio.getTimestamp());
				thisMonth = thisMonth(ratio.getTimestamp());
				accDaily.add(ratio.getValue());
			} else if (isSameDay(cal, ratio.getTimestamp())) {
				accDaily.add(ratio.getValue());
			} else {
				accMonthly.add(accDaily.computeMean());
				accDaily.reset();
				cal.setTimeInMillis(ratio.getTimestamp());
				accDaily.add(ratio.getValue());
			}
		}
		return new Value(thisMonth.getTime(), accMonthly.computeMean());
	}

}
