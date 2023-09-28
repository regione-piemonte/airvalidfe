/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

public class ElaborationException extends Exception {

	private static final long serialVersionUID = 4943981299110133039L;

	public ElaborationException() {
	}

	public ElaborationException(String message) {
		super(message);
	}

	public ElaborationException(Throwable cause) {
		super(cause);
	}

	public ElaborationException(String message, Throwable cause) {
		super(message, cause);
	}

}
