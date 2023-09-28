/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.ArrayList;
import java.util.List;

public class ElaborationResultHolder {

	private String id;
	private String description;
	private List<ElaborationResult> listResult = new ArrayList<ElaborationResult>();

	public ElaborationResultHolder() {
	}

	public ElaborationResultHolder(String id, String description) {
		this.id = id;
		this.description = description;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public void addResult(ElaborationResult result) {
		listResult.add(result);
	}

	public List<ElaborationResult> getListResult() {
		return listResult;
	}

	public void setListResult(List<ElaborationResult> listResult) {
		this.listResult = listResult;
	}

}
