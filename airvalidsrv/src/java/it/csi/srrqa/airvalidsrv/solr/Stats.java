/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Stats<T> {

	private @JsonProperty("stats_fields") T statsFields;

	public Stats() {
	}

	public Stats(T statsFields) {
		super();
		this.statsFields = statsFields;
	}

	public T getStatsFields() {
		return statsFields;
	}

	public void setStatsFields(T statsFields) {
		this.statsFields = statsFields;
	}

	@Override
	public String toString() {
		return "Stats [statsFields=" + statsFields + "]";
	}

}
