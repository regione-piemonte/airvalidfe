/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ResponseHolder<D, T> {

	private ResponseHeader responseHeader;
	private Response<D> response;
	private Stats<T> stats;
	private @JsonProperty("facet_counts") FacetCounts facetCounts;

	public ResponseHolder() {
	}

	public ResponseHolder(ResponseHeader responseHeader, Response<D> response, Stats<T> stats) {
		super();
		this.responseHeader = responseHeader;
		this.response = response;
		this.stats = stats;
	}

	public ResponseHeader getResponseHeader() {
		return responseHeader;
	}

	public void setResponseHeader(ResponseHeader responseHeader) {
		this.responseHeader = responseHeader;
	}

	public Response<D> getResponse() {
		return response;
	}

	public void setResponse(Response<D> response) {
		this.response = response;
	}

	public Stats<T> getStats() {
		return stats;
	}

	public void setStats(Stats<T> stats) {
		this.stats = stats;
	}

	public FacetCounts getFacetCounts() {
		return facetCounts;
	}

	public void setFacetCounts(FacetCounts facetCounts) {
		this.facetCounts = facetCounts;
	}

	@Override
	public String toString() {
		return "ResponseHolder [responseHeader=" + responseHeader + ", response=" + response + ", stats=" + stats
				+ ", facetCounts=" + facetCounts + "]";
	}

}
