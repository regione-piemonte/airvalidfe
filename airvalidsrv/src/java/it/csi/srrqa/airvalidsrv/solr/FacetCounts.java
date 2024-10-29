/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FacetCounts {

	private @JsonProperty("facet_fields") FacetFields facetFields;

	public FacetCounts() {
	}

	public FacetFields getFacetFields() {
		return facetFields;
	}

	public void setFacetFields(FacetFields facetFields) {
		this.facetFields = facetFields;
	}

	@Override
	public String toString() {
		return "FacetCounts [facetFields=" + facetFields + "]";
	}

}
