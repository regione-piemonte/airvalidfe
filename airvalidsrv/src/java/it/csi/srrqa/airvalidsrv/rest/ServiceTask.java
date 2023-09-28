/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import javax.ws.rs.container.AsyncResponse;

abstract class ServiceTask {

	private String name;
	private AsyncResponse asyncResponse;

	ServiceTask(String name, AsyncResponse asyncResponse) {
		this.name = name;
		this.asyncResponse = asyncResponse;
	}

	@Override
	public String toString() {
		return name;
	}

	AsyncResponse getAsyncResponse() {
		return asyncResponse;
	}

	abstract Object execute() throws Exception;
}
