/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.io.IOException;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

public class CustomDoubleSerializer extends JsonSerializer<Double> {

	private DecimalFormat df;

	public CustomDoubleSerializer() {
		df = new DecimalFormat();
		df.setDecimalFormatSymbols(DecimalFormatSymbols.getInstance(Locale.US));
		df.setMaximumFractionDigits(9);
		df.setMinimumFractionDigits(1);
		df.setGroupingUsed(false);
	}

	@Override
	public void serialize(Double value, JsonGenerator jgen, SerializerProvider provider)
			throws IOException, JsonGenerationException {
		if (value == null)
			jgen.writeNull();
		else
			jgen.writeNumber(df.format(value));
	}

	@Override
	public Class<Double> handledType() {
		return Double.class;
	}

}
