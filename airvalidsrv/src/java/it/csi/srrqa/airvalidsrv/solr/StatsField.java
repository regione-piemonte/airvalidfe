/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import java.util.List;

public class StatsField {

	private String min;
	private String max;
	private int count;
	private int missing;
	private int countDistinct;
	private List<String> distinctValues;

	public StatsField() {
	}

	public StatsField(String min, String max, int count, int missing, int countDistinct, List<String> distinctValues) {
		super();
		this.min = min;
		this.max = max;
		this.count = count;
		this.missing = missing;
		this.countDistinct = countDistinct;
		this.distinctValues = distinctValues;
	}

	public String getMin() {
		return min;
	}

	public void setMin(String min) {
		this.min = min;
	}

	public String getMax() {
		return max;
	}

	public void setMax(String max) {
		this.max = max;
	}

	public int getCount() {
		return count;
	}

	public void setCount(int count) {
		this.count = count;
	}

	public int getMissing() {
		return missing;
	}

	public void setMissing(int missing) {
		this.missing = missing;
	}

	public int getCountDistinct() {
		return countDistinct;
	}

	public void setCountDistinct(int countDistinct) {
		this.countDistinct = countDistinct;
	}

	public List<String> getDistinctValues() {
		return distinctValues;
	}

	public void setDistinctValues(List<String> distinctValues) {
		this.distinctValues = distinctValues;
	}

	@Override
	public String toString() {
		return "StatsField [min=" + min + ", max=" + max + ", count=" + count + ", missing=" + missing
				+ ", countDistinct=" + countDistinct + ", distinctValues=" + distinctValues + "]";
	}

}
