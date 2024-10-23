/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public interface ProgressTracker {

	public Integer getProgress();

	public void setProgress(Integer progress);

	public String getActivity();

	public void setActivity(String activity);

	public long getLastCheckTime();

	public void checkExpired() throws DeferredTaskException;

	public void stop();

	public boolean isCleanupNeeded();

}
