package it.csi.srrqa.airvalidsrv.rest;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DataCache extends Thread {

	private static final int EXPIRY_TIME_MIN = 15;
	private static final int MAX_ITEMS = 256000;
	private static final int CLEAN_PERIOD_S = 60;
	private static final String SIZE_MAXSIZE = "(size/maxsize)";

	private static Logger lg = Logger.getLogger(AirValidApp.LOGGER_BASENAME + "." + DataCache.class.getSimpleName());

	private Integer expiryTimeMinutes;
	private Integer maxDataCached;
	private Integer cleanPeriodMillis;
	private AirDbClientProvider clientProvider;
	private Map<DataCacheKey, CacheItem<List<MeasureValue>>> cacheContentMap;
	private volatile boolean active = true;

	public DataCache(Integer expiryTimeMinutes, Integer maxDataCached, Integer cleanPeriodSeconds) {
		this.expiryTimeMinutes = expiryTimeMinutes == null ? EXPIRY_TIME_MIN : expiryTimeMinutes;
		this.maxDataCached = maxDataCached == null ? MAX_ITEMS : maxDataCached;
		this.cleanPeriodMillis = (cleanPeriodSeconds == null ? CLEAN_PERIOD_S : cleanPeriodSeconds) * 1000;
		cacheContentMap = new LinkedHashMap<>();
		setDaemon(true);
		start();
	}

	public void setClientProvider(AirDbClientProvider airDbRestClientProvider) {
		clientProvider = airDbRestClientProvider;
	}

	public List<MeasureValue> getData(String dbId, String sensorId, Long beginDate, Long endDate, Integer periodMinutes,
			Short verificationLevel) {
		final DataCacheKey key = new DataCacheKey(dbId, sensorId, beginDate, endDate, periodMinutes, verificationLevel);
		CacheItem<List<MeasureValue>> ci;
		synchronized (this) {
			ci = cacheContentMap.get(key);
			if (ci == null) {
				ci = new CacheItem<List<MeasureValue>>(expiryTimeMinutes) {
					@Override
					protected List<MeasureValue> loadItem() {
						return clientProvider.getAirDbServiceClient(key.getDbId()).getValidData(key.getSensorId(),
								key.getBeginDate(), key.getEndDate(), key.getPeriod_m(), key.getVerificationLevel());
					}
				};
				cacheContentMap.put(key, ci);
			}
		}
		return ci.getItem();
	}

	public synchronized void invalidate() {
		for (CacheItem<List<MeasureValue>> ci : cacheContentMap.values())
			ci.invalidate();
	}

	private synchronized void clean() {
		int itemCount = 0;
		for (DataCacheKey key : cacheContentMap.keySet()) {
			CacheItem<List<MeasureValue>> ci = cacheContentMap.get(key);
			if (ci != null) {
				if (ci.isExpired())
					cacheContentMap.remove(key);
				else
					itemCount += ci.getItem().size();
			}
		}
		lg.trace("Data cache info: " + itemCount + "/" + maxDataCached + " " + SIZE_MAXSIZE);
		if (itemCount > maxDataCached) {
			lg.warn("Data cache is full: " + itemCount + "/" + maxDataCached + " " + SIZE_MAXSIZE);
			for (DataCacheKey key : cacheContentMap.keySet()) {
				CacheItem<List<MeasureValue>> ci = cacheContentMap.get(key);
				if (ci != null) {
					cacheContentMap.remove(key);
					itemCount -= ci.getItem().size();
				}
				if (itemCount <= maxDataCached)
					break;
			}
			lg.info("Data cache cleaned: " + itemCount + "/" + maxDataCached + " " + SIZE_MAXSIZE);
		}
	}

	@Override
	public void run() {
		lg.info("Data cache clean thread started");
		try {
			while (active) {
				long wait = cleanPeriodMillis;
				while (active && wait > 0) {
					Thread.sleep(1000);
					wait -= 1000;
				}
				clean();
			}
		} catch (InterruptedException e) {
			lg.warn("Data cache clean thread interrupted", e);
			Thread.currentThread().interrupt();
		}
		lg.info("Data cache clean thread stopped");
	}

	public void shutdown() {
		lg.info("Data cache shutdown in progress...");
		active = false;
	}

}
