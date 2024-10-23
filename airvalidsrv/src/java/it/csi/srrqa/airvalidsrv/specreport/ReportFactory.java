/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.ResourceBundle;

import it.csi.srrqa.airvalidsrv.rest.Utils;
import it.csi.srrqa.airvalidsrv.specreport.ReportOption.Type;
import it.csi.srrqa.airvalidsrv.specreport.ReportPeriod.TimeUnit;

public class ReportFactory {

	private static final String ID_PERISTENCE_ANALYSIS = "persistence_analysis";
	private static final String ID_TREND_ANALYSIS = "trend_analysis";
	private static final String ID_NO2_NOX_RATIO = "no2_nox_ratio";
	private static Map<ResourceBundle, ReportFactory> mapFactory = new HashMap<>();

	private Map<String, ReportDescriptor> mapReportDescriptor = new HashMap<>();
	private Map<String, ReportDetail> mapReportDetail = new HashMap<>();
	private ResourceBundle messages;

	public static synchronized ReportFactory getInstance(ResourceBundle messages) {
		ReportFactory rf = mapFactory.get(messages);
		if (rf == null) {
			rf = new ReportFactory(messages);
			mapFactory.put(messages, rf);
		}
		return rf;
	}

	private ReportFactory(ResourceBundle messages) {
		this.messages = messages;
		mapReportDescriptor.put(ID_PERISTENCE_ANALYSIS, new ReportDescriptor(ID_PERISTENCE_ANALYSIS, messages));
		mapReportDetail.put(ID_PERISTENCE_ANALYSIS, new ReportDetail(true, //
				new ReportPeriod(TimeUnit.YEAR, 2, 2, false), //
				addOptVerification(new ArrayList<ReportOption>(), messages)));
		mapReportDescriptor.put(ID_TREND_ANALYSIS, new ReportDescriptor(ID_TREND_ANALYSIS, messages));
		mapReportDetail.put(ID_TREND_ANALYSIS, new ReportDetail(true, //
				new ReportPeriod(TimeUnit.YEAR, 1, null, false), //
				addOptVerification(new ArrayList<ReportOption>(), messages)));
		mapReportDescriptor.put(ID_NO2_NOX_RATIO, new ReportDescriptor(ID_NO2_NOX_RATIO, messages));
		mapReportDetail.put(ID_NO2_NOX_RATIO, new ReportDetail(true, //
				new ReportPeriod(TimeUnit.DATE, 1, null, false), //
				addOptVerification(new ArrayList<ReportOption>(), messages)));
	}

	public SpecReport newReport(String reportId, Long beginTime, Long endTime) {
		SpecReport report;
		switch (reportId) {
		case ID_PERISTENCE_ANALYSIS:
			report = new PersistenceAnalysisReport(messages, beginTime, endTime);
			break;
		case ID_TREND_ANALYSIS:
			report = new TrendAnalysisReport(messages, beginTime, endTime);
			break;
		case ID_NO2_NOX_RATIO:
			report = new NO2NOxRatioReport(messages, beginTime, endTime);
			break;
		default:
			throw new IllegalArgumentException("Cannot instantiate report with unknown id: " + reportId);
		}
		report.setDescriptor(getReportDescriptor(reportId));
		return report;
	}

	public Collection<ReportDescriptor> listReports() {
		return mapReportDescriptor.values();
	}

	public ReportDetail getReportDetail(String reportId) {
		return mapReportDetail.get(reportId);
	}

	private ReportDescriptor getReportDescriptor(String reportId) {
		return mapReportDescriptor.get(reportId);
	}

	private List<ReportOption> addOptVerification(List<ReportOption> listOption, ResourceBundle messages) {
		Map<String, String> p = new LinkedHashMap<String, String>();
		// p.put("none", Utils.getString(messages, "verification_none"));
		p.put("preliminary", Utils.getString(messages, "verification_preliminary"));
		p.put("final", Utils.getString(messages, "verification_final"));
		listOption.add(new ReportOption("verification_level", //
				Utils.getString(messages, "verification_level_name"), //
				Utils.getString(messages, "verification_level_desc"), //
				Type.LIST, p));
		return listOption;
	}

}
