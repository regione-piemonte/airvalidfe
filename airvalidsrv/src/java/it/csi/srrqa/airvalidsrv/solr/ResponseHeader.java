/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ResponseHeader {

	private Boolean zkConnected;
	private int status;
	private @JsonProperty("QTime") int qTime;
	private Params params;

	public ResponseHeader() {
	}

	public ResponseHeader(Boolean zkConnected, int status, int qTime, Params params) {
		super();
		this.zkConnected = zkConnected;
		this.status = status;
		this.qTime = qTime;
		this.params = params;
	}

	public Boolean getZkConnected() {
		return zkConnected;
	}

	public void setZkConnected(Boolean zkConnected) {
		this.zkConnected = zkConnected;
	}

	public int getStatus() {
		return status;
	}

	public void setStatus(int status) {
		this.status = status;
	}

	public int getqTime() {
		return qTime;
	}

	public void setqTime(int qTime) {
		this.qTime = qTime;
	}

	public Params getParams() {
		return params;
	}

	public void setParams(Params params) {
		this.params = params;
	}

	@Override
	public String toString() {
		return "ResponseHeader [zkConnected=" + zkConnected + ", status=" + status + ", qTime=" + qTime + ", params="
				+ params + "]";
	}

}
