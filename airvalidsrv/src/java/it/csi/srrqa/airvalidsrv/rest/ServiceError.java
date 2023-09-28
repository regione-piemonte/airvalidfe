/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;

public class ServiceError {

	public enum Code {
		MISSING_PARAM, INVALID_PARAM, RESOURCE_NOT_FOUND, RESOURCE_LOCKED, DATA_SERVICE_ERROR, REQUEST_NOT_AUTHORIZED, REQUEST_NOT_SUPPORTED
	}

	private Code code;
	private String message;
	private List<String> listCauses = null;

	public ServiceError() {
	}

	public ServiceError(Code code, String message) {
		this(code, message, (List<String>) null);
	}

	public ServiceError(Code code, Throwable throwable) {
		this(code, throwable.getMessage(), throwable);
	}

	public ServiceError(Code code, String message, List<String> listCauses) {
		this.code = code;
		this.message = message;
		this.listCauses = listCauses;
	}

	public ServiceError(Code code, String message, Throwable throwable) {
		this.code = code;
		this.message = message;
		if (throwable != null) {
			listCauses = new ArrayList<String>();
			do {
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				throwable.printStackTrace(pw);
				pw.close();
				listCauses.add(sw.toString());
				throwable = throwable.getCause();
			} while (throwable != null);
		}
	}

	public Code getCode() {
		return code;
	}

	public void setCode(Code code) {
		this.code = code;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public List<String> getListCauses() {
		return listCauses;
	}

	public void setListCauses(List<String> listCauses) {
		this.listCauses = listCauses;
	}

	@Override
	public String toString() {
		return "ServiceError [code=" + code + ", message=" + message + ", listCauses=" + listCauses + "]";
	}

}
