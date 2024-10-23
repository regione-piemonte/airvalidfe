/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import it.csi.srrqa.airdb.model.MeasureValue;

public abstract class Elaboration implements ElaborationItf {

	public enum TimeBase {
		TIMESTAMP, DATE, TIME, WEEKTIME, TIMESTAMP_NO_YEAR, TIMESTAMP_NO_YEAR_MONTH, NONE;
	}
	
	public enum PlotType {
		LINEAR, HISTOGRAM, SCATTER_PLOT
	}

	public static final int ADDITIONAL_DECIMALS_FOR_ERROR = 1;

	public static final float MINIMUM_DATA_PERCENT = 90;

	public static final String SIMPLE_FORMAT = "dd/MM/yyyy";

	private String name;

	private Elaboration[] elaborations = new Elaboration[1];

	private Set<HolidayDay> setHolidays = new HashSet<>();

	protected Elaboration(String name) {
		this.name = name;
		elaborations[0] = this;
		setHolidays.add(new HolidayDay(1, 1)); // 1 gennaio
		setHolidays.add(new HolidayDay(1, 6)); // 6 gennaio
		setHolidays.add(new HolidayDay(4, 25)); // 25 aprile
		setHolidays.add(new HolidayDay(5, 1)); // 1 maggio
		setHolidays.add(new HolidayDay(6, 2)); // 2 giugno
		setHolidays.add(new HolidayDay(8, 15)); // 15 agosto
		setHolidays.add(new HolidayDay(11, 1)); // 1 novembre
		setHolidays.add(new HolidayDay(12, 8)); // 8 dicembre
		setHolidays.add(new HolidayDay(12, 25)); // 25 dicembre
		setHolidays.add(new HolidayDay(12, 26)); // 26 dicembre
	}

	public final ElaborationResult compute(List<MeasureValue> data, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException {
		if (data == null)
			throw new IllegalArgumentException("Data list should be specified");
		if (dataPeriodMinutes <= 0)
			throw new IllegalArgumentException("Data period should be positive");
		Value[] values = computeImpl(data, dataPeriodMinutes, numDecimals);
		return new ElaborationResult(getId(), name, getTimeBase(), getPlotType(), values);
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public void setTimeInterval(Date begin, Date end) {
		// Nothing to do!
	}

	protected abstract Value[] computeImpl(List<MeasureValue> data, int dataPeriodMinutes, Integer numDecimals)
			throws ElaborationException;

	@Override
	public Elaboration[] getElaborations() {
		return elaborations;
	}

	protected final Double getDatumValue(MeasureValue measureValue, Integer numDecimals) {
		return round(measureValue.getValore_validato(), numDecimals);
	}

	protected final Value[] toValues(List<MeasureValue> data, Integer numDecimals) {
		Value[] values = new Value[data.size()];
		int i = 0;
		for (MeasureValue mv : data)
			values[i++] = new Value(mv.getTimestamp(), getDatumValue(mv, numDecimals));
		return values;
	}

	protected final Double round(Double value, Integer numDecimals) {
		if (value == null)
			return null;
		if (numDecimals == null)
			return value;
		if (numDecimals == 0)
			return (double) Math.round(value);
		double multiplier = Math.pow(10, numDecimals);
		return Math.round(value * multiplier) / multiplier;
	}

	protected final double computeDevStd(Value[] values, double doubleMeanValue) {
		double sumDevStd = 0;
		int notNullDataNumber = 0;
		for (int i = 0; i < values.length; i++) {
			if (values[i].getValue() != null) {
				sumDevStd += Math.pow((values[i].getValue() - doubleMeanValue), 2);
				notNullDataNumber++;
			}
		}
		if (notNullDataNumber > 1)
			return (Math.sqrt(sumDevStd / (notNullDataNumber - 1)));
		else
			return 0;
	}

	protected final double computeError(Value[] values, double doubleMeanValue) {
		double devStd = computeDevStd(values, doubleMeanValue);
		return (devStd / Math.sqrt(values.length));
	}

	protected final double computeDerError(double value1, double value2) {
		double der1 = Math.abs(100 * (1 / value1));
		double der2 = Math.abs(100 * (value2 / Math.pow(value1, 2)));
		return (der1 * value2 + der2 * value1);
	}

	protected final Double computeMean(Value[] values, Integer minimumData, Integer numDecimals) {
		Double result = null;
		double sum = 0;
		int notNullDataNumber = 0;
		for (int i = 0; i < values.length; i++) {
			if (values[i].getValue() != null) {
				sum += values[i].getValue();
				notNullDataNumber++;
			}
		}
		// se minimumData vale null significa che non ci deve essere un numero
		// minimo di dati, quindi controllo solo che l'array di dati di
		// partenza non contenesse tutti null
		if ((minimumData == null && notNullDataNumber > 0)
				|| (minimumData != null && notNullDataNumber >= minimumData && notNullDataNumber > 0)) {
			result = sum / notNullDataNumber;
			result = round(result, numDecimals);
		}

		return result;
	}

	protected final Value[] doScaling(Value[] values) {
		Double mean = computeMean(values, null, null);
		Double devStd = null;
		if (mean != null)
			devStd = computeDevStd(values, mean);
		Value[] scaledValues = new Value[values.length];
		for (int i = 0; i < values.length; i++) {
			Double value = values[i].getValue();
			if (value == null) {
				scaledValues[i] = new Value(values[i].getTimestamp());
			} else if (value.equals(mean)) {
				scaledValues[i] = new Value(values[i].getTimestamp(), 0.0);
			} else {
				if (devStd != null && devStd > 0)
					scaledValues[i] = new Value(values[i].getTimestamp(), (values[i].getValue() - mean) / devStd);
				else
					scaledValues[i] = new Value(values[i].getTimestamp());
			}
		}
		return scaledValues;
	}

	protected final Value[] getMax(Value[] values) {
		Value[] resultValues = new Value[0];

		double maxValue = Double.MIN_VALUE;
		List<Value> tmpMaxValues = new ArrayList<>();
		// ciclo sui dati per trovare i valori massimi
		for (int i = 0; i < values.length; i++) {
			if (values[i].getValue() != null) {
				if (values[i].getValue() > maxValue) {
					tmpMaxValues.clear();
					tmpMaxValues.add(values[i]);
					maxValue = values[i].getValue();
				} else if (values[i].getValue() == maxValue)
					tmpMaxValues.add(values[i]);
			}
		}
		if (!tmpMaxValues.isEmpty()) {
			resultValues = tmpMaxValues.toArray(new Value[0]);
		}

		return resultValues;
	}

	protected final Value[] getMin(Value[] values) {
		Value[] resultValues = new Value[0];

		double minValue = Double.MAX_VALUE;
		List<Value> tmpMinValues = new ArrayList<>();
		// ciclo sui dati per trovare i valori minimi
		for (int i = 0; i < values.length; i++) {
			if (values[i].getValue() != null) {
				if (values[i].getValue() < minValue) {
					tmpMinValues.clear();
					tmpMinValues.add(values[i]);
					minValue = values[i].getValue();
				} else if (values[i].getValue() == minValue)
					tmpMinValues.add(values[i]);
			}
		}
		if (!tmpMinValues.isEmpty()) {
			resultValues = tmpMinValues.toArray(new Value[0]);
		}

		return resultValues;
	}

	protected final int countNotNullData(Value[] values) {
		int notNullDataNumber = 0;
		for (int i = 0; i < values.length; i++) {
			if (values[i].getValue() != null)
				notNullDataNumber++;
		}
		return notNullDataNumber;
	}

	protected final String dateToString(Date date, String format) {
		if (date == null)
			return null;
		if (format == null)
			return null;
		SimpleDateFormat formatter = new SimpleDateFormat(format);
		return formatter.format(date);
	}

	protected final boolean isHolydayDay(Date date) {
		// N.B.: si considerano le festivita' italiane
		Calendar cal = new GregorianCalendar();
		cal.setTime(date);
		HolidayDay day = new HolidayDay(cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH));
		if (setHolidays.contains(day))
			return true;
		// pasquetta
		Calendar easterCal = getEasterDate(cal.get(Calendar.YEAR));
		easterCal.add(Calendar.DAY_OF_MONTH, 1);
		return new HolidayDay(easterCal.get(Calendar.MONTH) + 1, easterCal.get(Calendar.DAY_OF_MONTH)).equals(day);
	}

	private final Calendar getEasterDate(int year) {
		int g = year % 19;
		int c = year / 100;
		int h = (c - c / 4 - ((8 * c + 13) / 25) + 19 * g + 15) % 30;
		int i = h - (h / 28) * (1 - (h / 28) * (29 / (h + 1)) * ((21 - g) / 11));
		int j = (year + (year / 4) + i + 2 - c + c / 4) % 7;
		int l = i - j;
		int easterMonth = 3 + ((l + 40) / 44);
		int easterDay = l + 28 - 31 * (easterMonth / 4);
		Calendar cal = new GregorianCalendar();
		cal.setLenient(true);
		cal.set(Calendar.DAY_OF_MONTH, easterDay);
		cal.set(Calendar.MONTH, easterMonth - 1);
		cal.set(Calendar.YEAR, year);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);

		return cal;
	}

}
