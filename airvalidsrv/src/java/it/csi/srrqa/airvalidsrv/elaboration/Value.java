/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;

/**
 * 
 * @author Pierfrancesco.Vallosio@consulenti.csi.it
 * @version $Revision: 1.5 $
 */
public class Value {

	private long timestamp;
	private double value;
	private double error;

	public Value(Date timestamp) {
		this(timestamp, null, null);
	}

	public Value(Date timestamp, Double value) {
		this(timestamp, value, null);
	}

	public Value(Date timestamp, Double value, Double error) {
		if (timestamp == null)
			throw new IllegalArgumentException("Timestamp should not be null");
		this.timestamp = timestamp.getTime();
		this.value = value != null ? value : Double.NaN;
		this.error = error != null ? error : Double.NaN;
	}

	public Date getTimestamp() {
		return new Date(timestamp);
	}

	public Double getValue() {
		return Double.isNaN(value) ? null : value;
	}

	public Double getError() {
		return Double.isNaN(error) ? null : error;
	}

	@Override
	public String toString() {
		return "[" + getTimestamp() + ", " + getValue() + ", " + getError() + "]";
	}

}
