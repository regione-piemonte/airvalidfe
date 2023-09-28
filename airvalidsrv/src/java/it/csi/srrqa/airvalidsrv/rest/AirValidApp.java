/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.HashSet;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Context;
import javax.ws.rs.ext.ContextResolver;

import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;

public class AirValidApp extends Application {

	public static final String LOGGER_BASENAME = "airvalidsrv.service";
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
				throw new AppException("Cannot parse reference presuure '" + strReferencePress_kPa + "'");
			}
		}
		lg.debug("Reference pressure is " + referencePress_kPa + " kPa");
		MeasureCorrector corrector = new MeasureCorrector(referenceTemp_K, referencePress_kPa);
		DataCache dataCache = (DataCache) servletContext.getAttribute(ContextListener.DATA_CACHE_ATTR_NAME);
		singletons.add(new AirValidService(airDbServiceCfg, copDbServiceCfg, authServiceCfg, enableShibbolet,
				measureLockTimeout_m, disableTrustManager, corrector, dataCache));
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

}