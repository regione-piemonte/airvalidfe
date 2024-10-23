/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

public class ReportPeriod {

	public enum TimeUnit {
		DATE, MONTH, YEAR
	};

	private TimeUnit timeUnit;
	private int countMin;
	private Integer countMax;
	private boolean sparse;

	public ReportPeriod() {
	}

	public ReportPeriod(TimeUnit year, int countMin, Integer countMax, boolean sparse) {
		super();
		this.timeUnit = year;
		this.countMin = countMin;
		this.countMax = countMax;
		this.sparse = sparse;
	}

	public TimeUnit getTimeUnit() {
		return timeUnit;
	}

	public void setTimeUnit(TimeUnit timeUnit) {
		this.timeUnit = timeUnit;
	}

	public int getCountMin() {
		return countMin;
	}

	public void setCountMin(int countMin) {
		this.countMin = countMin;
	}

	public Integer getCountMax() {
		return countMax;
	}

	public void setCountMax(Integer countMax) {
		this.countMax = countMax;
	}

	public boolean isSparse() {
		return sparse;
	}

	public void setSparse(boolean sparse) {
		this.sparse = sparse;
	}

	@Override
	public String toString() {
		return "ReportPeriod [timeUnit=" + timeUnit + ", countMin=" + countMin + ", countMax=" + countMax + ", sparse="
				+ sparse + "]";
	}

}
