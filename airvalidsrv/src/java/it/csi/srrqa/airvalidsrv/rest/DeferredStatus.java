/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class DeferredStatus {

	public enum Status {
		RUNNING, CANCELLED, COMPLETED, FAILED
	}

	private Status status;
	private Integer progress;
	private String activity;

	public DeferredStatus() {
	}

	public DeferredStatus(Status status) {
		this(status, null, null);
	}

	public DeferredStatus(Status status, Integer progress, String activity) {
		super();
		this.status = status;
		this.progress = progress;
		this.activity = activity;
	}

	public Status getStatus() {
		return status;
	}

	public void setStatus(Status status) {
		this.status = status;
	}

	public Integer getProgress() {
		return progress;
	}

	public void setProgress(Integer progress) {
		this.progress = progress;
	}

	public String getActivity() {
		return activity;
	}

	public void setActivity(String activity) {
		this.activity = activity;
	}

	@Override
	public String toString() {
		return "DeferredStatus [status=" + status + ", progress=" + progress + ", activity=" + activity + "]";
	}

}
