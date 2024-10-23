/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.ArrayList;
import java.util.List;

public class ReportResult {

	public enum TimeBase {
		TIMESTAMP, TIME, DATE, DAY, MONTH, YEAR, MONTH_YEAR, NONE;
	}

	public enum PlotType {
		LINEAR, HISTOGRAM, SCATTER_PLOT, PIE_CHART
	}

	private String reportId;
	private String reportName;
	private String reportDescription;
	private TimeBase timeBase;
	private PlotType plotType;
	private List<DataSeries> dataSeries;

	public ReportResult() {
	}

	public ReportResult(String reportId, String reportName, String reportDescription, TimeBase timeBase,
			PlotType plotType) {
		super();
		this.reportId = reportId;
		this.reportName = reportName;
		this.reportDescription = reportDescription;
		this.timeBase = timeBase;
		this.plotType = plotType;
		this.dataSeries = new ArrayList<>();
	}

	public String getReportId() {
		return reportId;
	}

	public void setReportId(String reportId) {
		this.reportId = reportId;
	}

	public String getReportName() {
		return reportName;
	}

	public void setReportName(String reportName) {
		this.reportName = reportName;
	}

	public String getReportDescription() {
		return reportDescription;
	}

	public void setReportDescription(String reportDescription) {
		this.reportDescription = reportDescription;
	}

	public TimeBase getTimeBase() {
		return timeBase;
	}

	public void setTimeBase(TimeBase timeBase) {
		this.timeBase = timeBase;
	}

	public PlotType getPlotType() {
		return plotType;
	}

	public void setPlotType(PlotType plotType) {
		this.plotType = plotType;
	}

	public List<DataSeries> getDataSeries() {
		return dataSeries;
	}

	public void setDataSeries(List<DataSeries> dataSeries) {
		this.dataSeries = dataSeries;
	}

	@Override
	public String toString() {
		return "ReportResult [reportId=" + reportId + ", reportName=" + reportName + ", reportDescription="
				+ reportDescription + ", timeBase=" + timeBase + ", plotType=" + plotType + ", dataSeries=" + dataSeries
				+ "]";
	}

}
