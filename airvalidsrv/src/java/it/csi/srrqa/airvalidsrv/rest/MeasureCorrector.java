/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.HashMap;
import java.util.Map;

import it.csi.srrqa.airdb.model.Calibration;
import it.csi.srrqa.airdb.model.Measure;
import it.csi.srrqa.airdb.model.MeasureValue;

// Classe per la correzione delle misure basata sugli esiti delle
// calibrazioni degli analizzatori
public class MeasureCorrector {

	public enum Mode {
		CONSTANT, PROGRESSIVE
	}

	public static final double TEMP_K = 293.0;
	public static final double PRESS_KPA = 101.3;
	public static final double DEF_CONVERTER_EFFICIENCY = 97.5;
	public static final String CO_ID = "02";
	public static final String CO2_ID = "CO2";
	public static final String O3_ID = "05";
	public static final String NO_ID = "21";
	public static final String NO2_ID = "04";
	public static final String NOX_ID = "22";
	public static final String SO2_ID = "01";

	private static final String STR_UNSUPPORTED_CORR_MODE = "Unsupported correction mode";

	private Map<String, ParamInfo> mapParamInfo = new HashMap<String, ParamInfo>();
	private double temperature_K = TEMP_K;
	private double pressure_kPa = PRESS_KPA;

	public MeasureCorrector() {
		mapParamInfo.put(CO_ID, new ParamInfo("CO", CO_ID, 27.90003956043960));
		mapParamInfo.put(CO2_ID, new ParamInfo("CO2", CO2_ID, 44.0));
		mapParamInfo.put(O3_ID, new ParamInfo("O3", O3_ID, 48.103516483516500));
		mapParamInfo.put(NO_ID, new ParamInfo("NO", NO_ID, 29.992542527472500));
		mapParamInfo.put(NO2_ID, new ParamInfo("NO2", NO2_ID, 45.986961758241800));
		mapParamInfo.put(NOX_ID, new ParamInfo("NOX", NOX_ID, 45.986961758241800));
		mapParamInfo.put(SO2_ID, new ParamInfo("SO2", SO2_ID, 63.977676923076900));
	}

	public MeasureCorrector(double temperature_K, double pressure_kPa) {
		this();
		this.temperature_K = temperature_K;
		this.pressure_kPa = pressure_kPa;
	}

	public boolean isSupported(String parameterId) {
		return mapParamInfo.containsKey(parameterId);
	}

	public MeasureValue applyCorrection(Mode mode, String parameterId, Measure measure, Calibration calib, int index,
			int total) throws AppException {
		ParamInfo paramInfo = mapParamInfo.get(parameterId);
		if (paramInfo == null)
			throw new AppException("Parameter '" + parameterId
					+ "' is not supported for data correction using calibration information");
		if (measure.getValore_originale() == null)
			return new MeasureValue(measure.getTimestamp(), null);
		double value = measure.getValore_originale();
		double value_v2v = paramInfo.to_v2v(value, temperature_K, pressure_kPa);
		double corr_v2v;
		double zero = calib.getZero();
		double span = calib.getSpan();
		double ccalgas = calib.getCylinderConcentration();
		if (Mode.CONSTANT.equals(mode))
			corr_v2v = (value_v2v - zero) * ccalgas / (span - zero);
		else if (Mode.PROGRESSIVE.equals(mode))
			corr_v2v = (value_v2v - (zero / total * index)) * ccalgas
					/ (ccalgas - ((ccalgas - span) / total * index) - (zero / total * index));
		else
			throw new IllegalStateException(STR_UNSUPPORTED_CORR_MODE + " '" + mode + "'");
		return new MeasureValue(measure.getTimestamp(), paramInfo.to_mpv(corr_v2v, temperature_K, pressure_kPa));
	}

	public MeasureValue applyCorrectionNO2(Mode mode, Measure measureNO2, Measure measureNO, Calibration calibNO2,
			Calibration calibNO, int index, int total) throws AppException {
		if (!measureNO2.getTimestamp().equals(measureNO.getTimestamp()))
			throw new AppException("NO and NO2 should have same timestamp for NO2 correction");
		ParamInfo paramInfoNO = mapParamInfo.get(NO_ID);
		ParamInfo paramInfoNO2 = mapParamInfo.get(NO2_ID);
		ParamInfo paramInfoNOX = mapParamInfo.get(NOX_ID);
		if (paramInfoNO == null)
			throw new AppException(
					"Parameter '" + NO_ID + "' is not supported for data correction using calibration information");
		if (paramInfoNO2 == null)
			throw new AppException(
					"Parameter '" + NO2_ID + "' is not supported for data correction using calibration information");
		if (paramInfoNOX == null)
			throw new AppException(
					"Parameter '" + NOX_ID + "' is not supported for data correction using calibration information");
		if (measureNO2.getValore_originale() == null || measureNO.getValore_originale() == null)
			return new MeasureValue(measureNO2.getTimestamp(), null);
		double valueNO2 = measureNO2.getValore_originale();
		double valueNO = measureNO.getValore_originale();
		double valueNO2_v2v = paramInfoNO2.to_v2v(valueNO2, temperature_K, pressure_kPa);
		double valueNO_v2v = paramInfoNO.to_v2v(valueNO, temperature_K, pressure_kPa);
		double valueNOX_v2v = valueNO2_v2v + valueNO_v2v;
		Double converterEfficiency = calibNO2.getConverterEfficiency();
		if (converterEfficiency == null)
			converterEfficiency = DEF_CONVERTER_EFFICIENCY;
		double corrNO_v2v;
		double corrNOX_v2v;
		double corrNO2_v2v;
		double zeroNO = calibNO.getZero();
		double spanNO = calibNO.getSpan();
		double ccalgasNO = calibNO.getCylinderConcentration();
		double zeroNO2 = calibNO2.getZero();
		double spanNO2 = calibNO2.getSpan();
		double ccalgasNO2 = calibNO2.getCylinderConcentration();
		if (Mode.CONSTANT.equals(mode)) {
			corrNO_v2v = (valueNO_v2v - zeroNO) * ccalgasNO / (spanNO - zeroNO);
			corrNOX_v2v = (valueNOX_v2v - (zeroNO + zeroNO2)) * (ccalgasNO + ccalgasNO2)
					/ ((spanNO + spanNO2) - (zeroNO + zeroNO2));
		} else if (Mode.PROGRESSIVE.equals(mode)) {
			corrNO_v2v = (valueNO_v2v - (zeroNO / total * index)) * ccalgasNO
					/ (ccalgasNO - ((ccalgasNO - spanNO) / total * index) - (zeroNO / total * index));
			corrNOX_v2v = (valueNOX_v2v - ((zeroNO + zeroNO2) / total * index)) * (ccalgasNO + ccalgasNO2)
					/ ((ccalgasNO + ccalgasNO2) - (((ccalgasNO + ccalgasNO2) - (spanNO + spanNO2)) / total * index)
							- ((zeroNO + zeroNO2) / total * index));
		} else
			throw new IllegalStateException(STR_UNSUPPORTED_CORR_MODE + " '" + mode + "'");
		corrNO2_v2v = (corrNOX_v2v - corrNO_v2v) / converterEfficiency * 100.0;
		return new MeasureValue(measureNO2.getTimestamp(),
				paramInfoNO2.to_mpv(corrNO2_v2v, temperature_K, pressure_kPa));
	}

}
