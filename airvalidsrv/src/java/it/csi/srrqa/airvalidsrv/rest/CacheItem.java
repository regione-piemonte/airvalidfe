/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public abstract class CacheItem<T> {

	private T item;
	private long refreshTime_ms = 0;
	private int maxAge_m;

	public CacheItem(int maxAge_m) {
		this.maxAge_m = maxAge_m;
	}

	public synchronized T getItem() {
		if (item == null || isExpired()) {
			this.item = loadItem();
			refreshTime_ms = System.currentTimeMillis();
		}
		return item;
	}

	abstract protected T loadItem();

	public boolean isExpired() {
		return (System.currentTimeMillis() - refreshTime_ms) / 60000 > maxAge_m;
	}

	public void invalidate() {
		refreshTime_ms = 0;
	}

}
