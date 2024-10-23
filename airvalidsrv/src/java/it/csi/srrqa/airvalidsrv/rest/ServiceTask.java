/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import javax.ws.rs.container.AsyncResponse;

abstract class ServiceTask implements ProgressTracker {

	static final long DEFERRED_TASK_STATUS_TIMEOUT_S = 10;
	private static final long EXPIRE_TIMEOUT_S = DEFERRED_TASK_STATUS_TIMEOUT_S * 2 + 5;
	private static final long CLEANUP_TIMEOUT_S = 60;
	private String name;
	private AsyncResponse asyncResponse;
	private volatile Integer progress = null;
	private volatile String activity = null;
	private volatile long lastCheckTime = System.currentTimeMillis();
	private volatile boolean stopRequested = false;
	private volatile Long stoppingTime = null;

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

	@Override
	public Integer getProgress() {
		lastCheckTime = System.currentTimeMillis();
		return progress;
	}

	@Override
	public void setProgress(Integer progress) {
		this.progress = progress;
	}

	@Override
	public String getActivity() {
		lastCheckTime = System.currentTimeMillis();
		return activity;
	}

	@Override
	public void setActivity(String activity) {
		this.activity = activity;
	}

	@Override
	public long getLastCheckTime() {
		return lastCheckTime;
	}

	@Override
	public void checkExpired() throws DeferredTaskException {
		if (stopRequested) {
			stoppingTime = System.currentTimeMillis();
			throw new DeferredTaskException("Stopping report activity on user/system request");
		}
		if (System.currentTimeMillis() - lastCheckTime > EXPIRE_TIMEOUT_S * 1000) {
			stoppingTime = System.currentTimeMillis();
			throw new DeferredTaskException("Stopping expired report activity");
		}
	}

	@Override
	public void stop() {
		stopRequested = true;
	}

	@Override
	public boolean isCleanupNeeded() {
		return stoppingTime != null && System.currentTimeMillis() - stoppingTime > CLEANUP_TIMEOUT_S * 1000;
	}

}
