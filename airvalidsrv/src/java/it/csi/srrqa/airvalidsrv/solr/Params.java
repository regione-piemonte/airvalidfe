/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Params {

	private String q;
	private String df;
	private @JsonProperty("stats.calcdistinct") String statsCalcdistinct;
	private String stats;
	private @JsonProperty("q.op") String qOp;
	private String sort;
	private String start;
	private String rows;
	private @JsonProperty("stats.field") String statsField;
	private String facet;
	private @JsonProperty("facet.mincount") String facetMincount;
	private @JsonProperty("facet.field") List<String> facetFields;

	public Params() {
	}

	public Params(String q, String df, String statsCalcdistinct, String stats, String qOp, String sort, String start,
			String rows, String statsField, String facet, String facetMincount, List<String> facetFields) {
		super();
		this.q = q;
		this.df = df;
		this.statsCalcdistinct = statsCalcdistinct;
		this.stats = stats;
		this.qOp = qOp;
		this.sort = sort;
		this.start = start;
		this.rows = rows;
		this.statsField = statsField;
		this.facet = facet;
		this.facetMincount = facetMincount;
		this.facetFields = facetFields;
	}

	public String getQ() {
		return q;
	}

	public void setQ(String q) {
		this.q = q;
	}

	public String getDf() {
		return df;
	}

	public void setDf(String df) {
		this.df = df;
	}

	public String getStatsCalcdistinct() {
		return statsCalcdistinct;
	}

	public void setStatsCalcdistinct(String statsCalcdistinct) {
		this.statsCalcdistinct = statsCalcdistinct;
	}

	public String getStats() {
		return stats;
	}

	public void setStats(String stats) {
		this.stats = stats;
	}

	public String getqOp() {
		return qOp;
	}

	public void setqOp(String qOp) {
		this.qOp = qOp;
	}

	public String getSort() {
		return sort;
	}

	public void setSort(String sort) {
		this.sort = sort;
	}

	public String getStart() {
		return start;
	}

	public void setStart(String start) {
		this.start = start;
	}

	public String getRows() {
		return rows;
	}

	public void setRows(String rows) {
		this.rows = rows;
	}

	public String getStatsField() {
		return statsField;
	}

	public void setStatsField(String statsField) {
		this.statsField = statsField;
	}

	public String getFacet() {
		return facet;
	}

	public void setFacet(String facet) {
		this.facet = facet;
	}

	public String getFacetMincount() {
		return facetMincount;
	}

	public void setFacetMincount(String facetMincount) {
		this.facetMincount = facetMincount;
	}

	public List<String> getFacetFields() {
		return facetFields;
	}

	public void setFacetFields(List<String> facetFields) {
		this.facetFields = facetFields;
	}

	@Override
	public String toString() {
		return "Params [q=" + q + ", df=" + df + ", statsCalcdistinct=" + statsCalcdistinct + ", stats=" + stats
				+ ", qOp=" + qOp + ", sort=" + sort + ", start=" + start + ", rows=" + rows + ", statsField="
				+ statsField + ", facet=" + facet + ", facetMincount=" + facetMincount + ", facetFields=" + facetFields
				+ "]";
	}

}
