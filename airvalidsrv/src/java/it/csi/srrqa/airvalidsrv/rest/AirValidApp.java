/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.io.File;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Context;
import javax.ws.rs.ext.ContextResolver;

import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;

import it.csi.srrqa.reportisticalib.report.RangeValues;
import it.csi.srrqa.reportisticalib.report.ThresholdObject;

public class AirValidApp extends Application {

	public static final String LOGGER_BASENAME = "airvalidsrv.service";
	private static final String CFG_DIR = "airvalidsrv/cfg";
	private static final String THRESHOLDS_FILE = "thresholds.json";
	private static final String RANGE_VALUES_FILE = "range_values.json";
	private static Logger lg = Logger.getLogger(LOGGER_BASENAME + "." + AirValidApp.class.getSimpleName());
	private Set<Object> singletons = new HashSet<Object>();

	public AirValidApp(@Context ServletContext servletContext) throws AppException {
		PropertyConfigurator.configure(AirValidApp.class.getResource("/log4j.properties"));
		lg.info("AirValidApp started");
		if (servletContext == null)
			throw new AppException("Cannot obtain servlet context");
		ServiceConfig airDbServiceCfg = new ServiceConfig(//
				servletContext.getInitParameter("airDbServiceURL"), //
				servletContext.getInitParameter("airDbServiceUser"), //
				servletContext.getInitParameter("airDbServicePwd"));
		lg.debug("Air DB Service config: " + airDbServiceCfg);
		ServiceConfig copDbServiceCfg = new ServiceConfig(//
				servletContext.getInitParameter("copDbServiceURL"), //
				servletContext.getInitParameter("copDbServiceUser"), //
				servletContext.getInitParameter("copDbServicePwd"));
		lg.debug("Cop DB Service config: " + copDbServiceCfg);
		ServiceConfig authServiceCfg = new ServiceConfig(//
				servletContext.getInitParameter("authServiceURL"), //
				servletContext.getInitParameter("authServiceUser"), //
				servletContext.getInitParameter("authServicePwd"));
		lg.debug("Auth Service config: " + authServiceCfg);
		ServiceConfig solrServiceCfg = new ServiceConfig(//
				servletContext.getInitParameter("solrServiceURL"), //
				servletContext.getInitParameter("solrServiceUser"), //
				servletContext.getInitParameter("solrServicePwd"));
		lg.debug("Solr Service config: " + solrServiceCfg);
		boolean enableShibbolet = "true".equalsIgnoreCase(servletContext.getInitParameter("enableShibbolet"));
		String strMeasureLockTimeout_m = servletContext.getInitParameter("measureLockTimeout_m");
		int measureLockTimeout_m;
		try {
			measureLockTimeout_m = Integer.parseInt(strMeasureLockTimeout_m);
		} catch (Exception ex) {
			throw new AppException("Cannot parse measure lock timeout '" + strMeasureLockTimeout_m + "'");
		}
		lg.debug("Measure lock timeout is " + measureLockTimeout_m + " minutes");
		String trustManager = servletContext.getInitParameter("trustManager");
		boolean disableTrustManager = "false".equalsIgnoreCase(trustManager);
		lg.debug("Trust manager is " + (disableTrustManager ? "disabled" : "enabled"));
		String strReferenceTemp_K = servletContext.getInitParameter("referenceTemp_K");
		double referenceTemp_K = MeasureCorrector.TEMP_K;
		if (strReferenceTemp_K != null && !strReferenceTemp_K.isEmpty()) {
			try {
				referenceTemp_K = Double.parseDouble(strReferenceTemp_K);
			} catch (Exception ex) {
				throw new AppException("Cannot parse reference temperature '" + strReferenceTemp_K + "'");
			}
		}
		lg.debug("Reference temperature is " + referenceTemp_K + " K");
		String strReferencePress_kPa = servletContext.getInitParameter("referencePress_kPa");
		double referencePress_kPa = MeasureCorrector.PRESS_KPA;
		if (strReferencePress_kPa != null && !strReferencePress_kPa.isEmpty()) {
			try {
				referencePress_kPa = Double.parseDouble(strReferencePress_kPa);
			} catch (Exception ex) {
				throw new AppException("Cannot parse reference pressure '" + strReferencePress_kPa + "'");
			}
		}
		lg.debug("Reference pressure is " + referencePress_kPa + " kPa");
		MeasureCorrector corrector = new MeasureCorrector(referenceTemp_K, referencePress_kPa);
		lg.debug("Loading configuration files...");
		List<ThresholdObject> listThresholds = readThresholdsConfig();
		List<RangeValues> listRangeValues = readRangeValuesConfig();
		DataCache dataCache = (DataCache) servletContext.getAttribute(ContextListener.DATA_CACHE_ATTR_NAME);
		singletons.add(new AirValidService(airDbServiceCfg, copDbServiceCfg, authServiceCfg, solrServiceCfg,
				enableShibbolet, measureLockTimeout_m, disableTrustManager, corrector, listThresholds, listRangeValues,
				dataCache));
		singletons.add(new ContextResolver<ObjectMapper>() {
			@Override
			public ObjectMapper getContext(Class<?> type) {
				ObjectMapper mapper = new ObjectMapper();
				SimpleModule module = new SimpleModule();
				module.addSerializer(Double.class, new CustomDoubleSerializer());
				mapper.registerModule(module);
				return mapper;
			}
		});
		lg.info("AirValidApp initialization completed");
	}

	@Override
	public Set<Object> getSingletons() {
		return singletons;
	}

	private List<ThresholdObject> readThresholdsConfig() throws AppException {
		File cfgDir = new File(CFG_DIR);
		if (!cfgDir.isDirectory())
			throw new AppException("Configuration folder '" + CFG_DIR + "' missing");
		File thresholdsFile = new File(CFG_DIR + File.separator + THRESHOLDS_FILE);
		if (!thresholdsFile.isFile())
			throw new AppException("Thresolds configuration file '" + thresholdsFile.getPath() + "' missing");
		try {
			ObjectMapper mapper = new ObjectMapper();
			return Arrays.asList(mapper.readValue(thresholdsFile, ThresholdObject[].class));
		} catch (Exception ex) {
			throw new AppException("Cannot read/parse thresolds configuration file '" + thresholdsFile.getPath() + "'",
					ex);
		}
	}

	private List<RangeValues> readRangeValuesConfig() throws AppException {
		File cfgDir = new File(CFG_DIR);
		if (!cfgDir.isDirectory())
			throw new AppException("Configuration folder '" + CFG_DIR + "' missing");
		File rangeValuesFile = new File(CFG_DIR + File.separator + RANGE_VALUES_FILE);
		if (!rangeValuesFile.isFile())
			throw new AppException("Range values configuration file '" + rangeValuesFile.getPath() + "' missing");
		try {
			ObjectMapper mapper = new ObjectMapper();
			return Arrays.asList(mapper.readValue(rangeValuesFile, RangeValues[].class));
		} catch (Exception ex) {
			throw new AppException(
					"Cannot read/parse range values configuration file '" + rangeValuesFile.getPath() + "'", ex);
		}
	}

}