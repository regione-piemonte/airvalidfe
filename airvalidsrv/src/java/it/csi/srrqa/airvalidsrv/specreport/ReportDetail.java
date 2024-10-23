/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.List;

public class ReportDetail {

	private boolean anagraphRequired;
	private ReportPeriod timePeriod;
	private List<ReportOption> options;

	public ReportDetail() {
	}

	public ReportDetail(boolean anagraphRequired, ReportPeriod timePeriod, List<ReportOption> options) {
		super();
		this.anagraphRequired = anagraphRequired;
		this.timePeriod = timePeriod;
		this.options = options;
	}

	public boolean isAnagraphRequired() {
		return anagraphRequired;
	}

	public void setAnagraphRequired(boolean anagraphRequired) {
		this.anagraphRequired = anagraphRequired;
	}

	public ReportPeriod getTimePeriod() {
		return timePeriod;
	}

	public void setTimePeriod(ReportPeriod timePeriod) {
		this.timePeriod = timePeriod;
	}

	public List<ReportOption> getOptions() {
		return options;
	}

	public void setOptions(List<ReportOption> options) {
		this.options = options;
	}

	@Override
	public String toString() {
		return "ReportDescriptor [anagraphRequired=" + anagraphRequired + ", timePeriod=" + timePeriod + ", options="
				+ options + "]";
	}

}