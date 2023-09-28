package it.csi.srrqa.airvalidsrv.rest;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.log4j.Logger;

public class ContextListener implements ServletContextListener {

	public static final String DATA_CACHE_ATTR_NAME = "dataCache";
	private static Logger lg = Logger
			.getLogger(AirValidApp.LOGGER_BASENAME + "." + ContextListener.class.getSimpleName());
	private static final String USING_DEFAULT = "using default";

	private DataCache dataCache;

	@Override
	public void contextInitialized(ServletContextEvent event) {
		ServletContext sc = event.getServletContext();
		if (sc != null) {
			String _expiryTime_m = sc.getInitParameter("expiryTime_m");
			Integer expiryTime_m = null;
			if (_expiryTime_m != null && !_expiryTime_m.isEmpty()) {
				try {
					expiryTime_m = Integer.parseInt(_expiryTime_m);
				} catch (Exception ex) {
					lg.error("Cannot parse cache expiry time '" + _expiryTime_m + "', " + USING_DEFAULT);
				}
			}
			lg.debug("Cache expiry time temperature is " + expiryTime_m + " minutes");
			String _maxDataCached = sc.getInitParameter("maxDataCached");
			Integer maxDataCached = null;
			if (_maxDataCached != null && !_maxDataCached.isEmpty()) {
				try {
					maxDataCached = Integer.parseInt(_maxDataCached);
				} catch (Exception ex) {
					lg.error("Cannot parse max data cached number '" + _maxDataCached + "', " + USING_DEFAULT);
				}
			}
			lg.debug("Max data cached number is " + maxDataCached);
			String _cleanPeriod_s = sc.getInitParameter("cleanPeriod_s");
			Integer cleanPeriod_s = null;
			if (_cleanPeriod_s != null && !_cleanPeriod_s.isEmpty()) {
				try {
					cleanPeriod_s = Integer.parseInt(_cleanPeriod_s);
				} catch (Exception ex) {
					lg.error("Cannot parse cache clean period '" + _cleanPeriod_s + "', " + USING_DEFAULT);
				}
			}
			lg.debug("Cache clean period is " + cleanPeriod_s + " s");
			dataCache = new DataCache(expiryTime_m, maxDataCached, cleanPeriod_s);
			sc.setAttribute(DATA_CACHE_ATTR_NAME, dataCache);
		}
		lg.debug("AirValidService context initialized");
	}

	@Override
	public void contextDestroyed(ServletContextEvent event) {
		if (dataCache != null)
			dataCache.shutdown();
		lg.debug("AirValidService context destroyed");
	}

}