/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.UUID;

public class DeferredTaskId {

	private UUID id;

	public DeferredTaskId() {
	}

	public DeferredTaskId(UUID id) {
		super();
		this.id = id;
	}

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	@Override
	public String toString() {
		return "DeferredTaskId [id=" + id + "]";
	}

}
