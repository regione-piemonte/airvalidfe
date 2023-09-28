/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class LockException extends Exception {

	private static final long serialVersionUID = -1403096994231682278L;

	public LockException() {
	}

	public LockException(String message) {
		super(message);
	}

	public LockException(Throwable cause) {
		super(cause);
	}

	public LockException(String message, Throwable cause) {
		super(message, cause);
	}

	public LockException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
		super(message, cause, enableSuppression, writableStackTrace);
	}

}
