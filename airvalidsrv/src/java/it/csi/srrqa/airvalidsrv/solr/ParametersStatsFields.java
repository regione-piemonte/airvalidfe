/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ParametersStatsFields {

	private @JsonProperty("sensore_id_parametro") StatsField statsField;

	public ParametersStatsFields() {
	}

	public ParametersStatsFields(StatsField statsField) {
		super();
		this.statsField = statsField;
	}

	public StatsField getStatsField() {
		return statsField;
	}

	public void setStatsField(StatsField statsField) {
		this.statsField = statsField;
	}

	@Override
	public String toString() {
		return "ParametersStatsFields [statsField=" + statsField + "]";
	}

}
