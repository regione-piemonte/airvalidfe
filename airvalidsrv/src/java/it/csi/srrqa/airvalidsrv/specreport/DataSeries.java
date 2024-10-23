/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.ArrayList;
import java.util.Collection;

public class DataSeries {

	private String id;
	private String name;
	private String measureUnit;
	private Integer numDecimals;
	private Collection<Value> values;

	public DataSeries() {
	}

	public DataSeries(String id, String name, String measureUnit, int numDecimals) {
		this(id, name, measureUnit, numDecimals, new ArrayList<Value>());
	}

	public DataSeries(String id, String name, String measureUnit, int numDecimals, Collection<Value> values) {
		super();
		this.id = id;
		this.name = name;
		this.measureUnit = measureUnit;
		this.numDecimals = numDecimals;
		this.values = values;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getMeasureUnit() {
		return measureUnit;
	}

	public void setMeasureUnit(String measureUnit) {
		this.measureUnit = measureUnit;
	}

	public Integer getNumDecimals() {
		return numDecimals;
	}

	public void setNumDecimals(Integer numDecimals) {
		this.numDecimals = numDecimals;
	}

	public Collection<Value> getValues() {
		return values;
	}

	public void setValues(Collection<Value> values) {
		this.values = values;
	}

	public void addValue(Value value) {
		if (values == null)
			values = new ArrayList<Value>();
		values.add(value);
	}

	@Override
	public String toString() {
		return "DataSeries [id=" + id + ", name=" + name + ", measureUnit=" + measureUnit + ", numDecimals="
				+ numDecimals + ", values=" + values + "]";
	}

}
