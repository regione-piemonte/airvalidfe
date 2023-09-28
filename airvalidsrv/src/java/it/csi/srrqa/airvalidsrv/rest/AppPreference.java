/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class AppPreference {

	private String groupId;
	private String id;
	private Integer type;
	private String value;

	public AppPreference() {
	}

	public AppPreference(String groupId, String id, Integer type, String value) {
		super();
		this.groupId = groupId;
		this.id = id;
		this.type = type;
		this.value = value;
	}

	public String getGroupId() {
		return groupId;
	}

	public void setGroupId(String groupId) {
		this.groupId = groupId;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public Integer getType() {
		return type;
	}

	public void setType(Integer type) {
		this.type = type;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	@Override
	public String toString() {
		return "AppPreference [groupId=" + groupId + ", id=" + id + ", type=" + type + ", value=" + value + "]";
	}

}
