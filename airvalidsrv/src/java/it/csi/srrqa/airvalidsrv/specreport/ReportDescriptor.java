/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.ResourceBundle;

import it.csi.srrqa.airvalidsrv.rest.Utils;

public class ReportDescriptor {

	private String id;
	private String name;
	private String description;

	public ReportDescriptor() {
	}

	public ReportDescriptor(String id, ResourceBundle messages) {
		this(id, Utils.getString(messages, id + "_name"), Utils.getString(messages, id + "_desc"));
	}

	public ReportDescriptor(String id, String name, String description) {
		super();
		this.id = id;
		this.name = name;
		this.description = description;
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

	@Override
	public String toString() {
		return "ReportDescriptor [id=" + id + ", name=" + name + ", description=" + description + "]";
	}

}