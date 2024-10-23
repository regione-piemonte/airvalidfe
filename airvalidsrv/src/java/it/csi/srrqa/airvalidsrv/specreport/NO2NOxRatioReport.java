/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.ArrayList;
import java.util.Date;
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
import it.csi.srrqa.airvalidsrv.rest.SensorNameWithKeyAndPeriod;
import it.csi.srrqa.airvalidsrv.rest.UserCache;
import it.csi.srrqa.airvalidsrv.rest.Utils;
import it.csi.srrqa.airvalidsrv.specreport.ReportAnagraph.ItemType;
import it.csi.srrqa.airvalidsrv.specreport.ReportResult.PlotType;
import it.csi.srrqa.airvalidsrv.specreport.ReportResult.TimeBase;

public class NO2NOxRatioReport extends SpecReport {

	private TimeInterval ti;

	public NO2NOxRatioReport(ResourceBundle messages, Long beginTime, Long endTime) {
		super(messages);
		if (beginTime == null)
			throw new IllegalArgumentException("Begin time not specified");
		if (endTime == null)
			throw new IllegalArgumentException("End time not specified");
		if (endTime < beginTime)
			throw new IllegalArgumentException("End time before begin time");
		ti = new TimeInterval(thisDate(beginTime), nextDate(endTime));
	}

	@Override
	public ReportAnagraph getAnagraph(AnagraphCache anagraphCache, UserCache userCache, AuthCache authCache,
			String itemType, List<String> listItemIds) throws AuthException {
		ReportAnagraph ra = null;
		List<NameWithKeyAndPeriod> items = new ArrayList<>();
		if (itemType == null) {
			ra = new ReportAnagraph(ItemType.NETWORK, 1, null, false,
					anagraphCache.getNetworkNames(ti.getBegin(), ti.getEnd(), null, userCache, authCache));
		} else if (ItemType.NETWORK.toString().equalsIgnoreCase(itemType)) {
			for (String netId : listItemIds) {
				List<NameWithKeyAndPeriod> listStations = anagraphCache.getStationNamesForNetwork(netId, ti.getBegin(),
						ti.getEnd(), userCache, authCache);
				for (NameWithKeyAndPeriod nwk : listStations)
					if (hasNO2NOx(nwk, anagraphCache, userCache, authCache, ti.getBegin(), ti.getEnd()))
						items.add(nwk);
			}
			ra = new ReportAnagraph(ItemType.STATION, 1, null, true, items);
		}
		return ra;
	}

	private boolean hasNO2NOx(NameWithKeyAndPeriod stationInfo, AnagraphCache anagraphCache, UserCache userCache,
			AuthCache authCache, Date begin, Date end) throws AuthException {
		List<SensorNameWithKeyAndPeriod> listSensor = anagraphCache.getSensorNamesForStation(stationInfo.getKey(),
				begin, end, userCache, authCache);
		boolean foundNO2 = false;
		boolean foundNOx = false;
		for (SensorNameWithKeyAndPeriod sensor : listSensor) {
			if (DBConstants.PARAMETER_NO2.equals(Utils.extractParameterId(sensor.getKey())))
				foundNO2 = true;
			if (DBConstants.PARAMETER_NOX.equals(Utils.extractParameterId(sensor.getKey())))
				foundNOx = true;
		}
		return foundNO2 && foundNOx;
	}

	@Override
	public ReportResult execute(ProgressTracker progressTracker, AnagraphCache anagraphCache, UserCache userCache,
			AuthCache authCache, AirDbRestClient client, String itemType, List<String> listItemIds,
			short verificationLevel) throws AuthException, DeferredTaskException {
		if (verificationLevel != DBConstants.VERIFICATION_FINAL
				&& verificationLevel != DBConstants.VERIFICATION_PRELIMINARY)
			throw new IllegalArgumentException("This reports requires verification level 'preliminary' or 'final'");
		if (!ItemType.STATION.toString().equalsIgnoreCase(itemType))
			throw new IllegalArgumentException(
					"Wrong item type: expected " + ItemType.STATION.toString() + ", found " + itemType);
		progressTracker.setProgress(0);
		int progress = 0;
		int total = listItemIds.size() * 3;
		ReportDescriptor desc = getDescriptor();
		ReportResult result = new ReportResult(desc.getId(), desc.getName(), desc.getDescription(), TimeBase.TIMESTAMP,
				PlotType.LINEAR);
		List<DataSeries> listDataSeries = new ArrayList<DataSeries>();
		for (String stationId : listItemIds) {
			progressTracker.checkExpired();
			Station station = anagraphCache.getStation(stationId, ti.getBegin(), ti.getEnd());
			String measureKeyNO2 = Utils.makeSensorId(stationId, DBConstants.PARAMETER_NO2);
			String measureKeyNOx = Utils.makeSensorId(stationId, DBConstants.PARAMETER_NOX);
			Sensor no2 = anagraphCache.getSensor(measureKeyNO2, ti.getBegin(), ti.getEnd());
			Integer regTime = no2.getRecords().get(0).getTempo_registrazione();
			if (regTime == null)
				throw new IllegalStateException("Registration time for sensor " + no2.keyToString() + " is null");
			Parameter paramNO2 = anagraphCache.getParameter(no2.getId_parametro());
			Integer numDec = paramNO2.getNum_decimali();
			if (numDec == null)
				throw new IllegalStateException(
						"Number of decimals for parameter " + paramNO2.nameToString() + " is null");
			NameWithKey mu = anagraphCache.getMeasureUnit(anagraphCache.getMeasureUnitId(no2.getId_parametro()));
			Sensor nox = anagraphCache.getSensor(measureKeyNOx, ti.getBegin(), ti.getEnd());
			if (!regTime.equals(nox.getRecords().get(0).getTempo_registrazione()))
				throw new IllegalStateException("Registration time for NOx do not match with NO2");
			Parameter paramNOx = anagraphCache.getParameter(nox.getId_parametro());
			if (!numDec.equals(paramNOx.getNum_decimali()))
				throw new IllegalStateException("Number of decimals for NOx do not match with NO2");
			if (!mu.equals(anagraphCache.getMeasureUnit(anagraphCache.getMeasureUnitId(no2.getId_parametro()))))
				throw new IllegalStateException("Measure unit for NOx do not match with NO2");
			DataSeries dataSeries = new DataSeries(stationId, station.nameToString(), mu.getExtraInfo(), numDec);
			progressTracker.setActivity(getString("data_read_for_station") + " " + station.nameToString() + ", "
					+ getString("sensor") + " " + no2.nameToString());
			List<MeasureValue> listMeasureNO2 = client.getValidData(measureKeyNO2, ti.getBegin().getTime(),
					ti.getEnd().getTime(), regTime, verificationLevel);
			progressTracker.setProgress(100 * progress++ / total);
			progressTracker.setActivity(getString("data_read_for_station") + " " + station.nameToString() + ", "
					+ getString("sensor") + " " + nox.nameToString());
			List<MeasureValue> listMeasureNOx = client.getValidData(measureKeyNOx, ti.getBegin().getTime(),
					ti.getEnd().getTime(), regTime, verificationLevel);
			progressTracker.setProgress(100 * progress++ / total);
			progressTracker.setActivity(getString("compute_for_station") + " " + station.nameToString());
			int i1 = 0;
			int i2 = 0;
			while (i1 < listMeasureNO2.size() && i2 < listMeasureNOx.size()) {
				MeasureValue mv1 = listMeasureNO2.get(i1);
				MeasureValue mv2 = listMeasureNOx.get(i2);
				checkTimestampAlignement(mv1.getTimestamp(), mv2.getTimestamp());
				dataSeries.addValue(computeValue(mv1, mv2));
				i1++;
				i2++;
			}
			listDataSeries.add(dataSeries);
			progressTracker.setProgress(100 * progress++ / total);
		}
		result.setDataSeries(listDataSeries);
		return result;
	}

	private Value computeValue(MeasureValue mv1, MeasureValue mv2) {
		Value value = new Value();
		value.setTimestamp(mv1.getTimestamp().getTime());
		Double v1 = mv1.getValore_validato();
		Double v2 = mv2.getValore_validato();
		value.setValue(v1 == null || v2 == null || v2 == 0.0 ? null : v1 / v2);
		return value;
	}

}
