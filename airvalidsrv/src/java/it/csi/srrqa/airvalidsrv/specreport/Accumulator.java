/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.Date;

import it.csi.srrqa.airdb.model.MeasureValue;

public class Accumulator {

	private int count;
	private double value;
	private Date timestamp;

	public Accumulator() {
		reset();
	}

	public void add(Double amount) {
		if (amount == null)
			return;
		count++;
		value = value + amount;
	}

	public void add(MeasureValue measureValue) {
		Date ts = measureValue.getTimestamp();
		if (timestamp == null)
			timestamp = ts;
		else if (!timestamp.equals(ts))
			throw new IllegalStateException("Timestamp mismatch in measure: expected " + timestamp + ", found " + ts);
		add(measureValue.getValore_validato());
	}

	public int getCount() {
		return count;
	}

	public double getValue() {
		return value;
	}

	public Double computeMean() {
		if (count == 0)
			return null;
		return value / count;
	}

	public void reset() {
		count = 0;
		value = 0.0;
		timestamp = null;
	}

}
