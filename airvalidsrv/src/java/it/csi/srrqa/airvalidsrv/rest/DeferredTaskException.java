/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class DeferredTaskException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 641258725324450528L;

	public DeferredTaskException() {
	}

	public DeferredTaskException(String message) {
		super(message);
	}

	public DeferredTaskException(Throwable cause) {
		super(cause);
	}

	public DeferredTaskException(String message, Throwable cause) {
		super(message, cause);
	}

	public DeferredTaskException(String message, Throwable cause, boolean enableSuppression,
			boolean writableStackTrace) {
		super(message, cause, enableSuppression, writableStackTrace);
	}

}
