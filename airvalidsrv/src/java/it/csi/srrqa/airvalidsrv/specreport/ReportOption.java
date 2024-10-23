/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.Map;

public class ReportOption {

	public enum Type {
		BOOLEAN, LIST
	};

	private String id;
	private String name;
	private String description;
	private Type type;
	private Map<String, String> values;

	public ReportOption() {
	}

	public ReportOption(String id, String name, String description, Type type, Map<String, String> values) {
		super();
		this.id = id;
		this.name = name;
		this.description = description;
		this.type = type;
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

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Type getType() {
		return type;
	}

	public void setType(Type type) {
		this.type = type;
	}

	public Map<String, String> getValues() {
		return values;
	}

	public void setValues(Map<String, String> values) {
		this.values = values;
	}

	@Override
	public String toString() {
		return "ReportOption [id=" + id + ", name=" + name + ", description=" + description + ", type=" + type
				+ ", values=" + values + "]";
	}

}
