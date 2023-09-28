/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class ParamInfo {

	// V0 [l/mole]: volume occupied by 1 mole at 0°C (273 K) and at 101.3 kPa
	private static final double V0_LPM = 22.41;
	// reference temperature [K]
	private static final double T0_K = 273.0;
	// reference pressure [kPa]
	private static final double P0_KPA = 101.3;

	private String name;
	private String id;
	private double moleculaWeight;

	public ParamInfo() {
	}

	public ParamInfo(String name, String id, double moleculaWeight) {
		super();
		this.name = name;
		this.id = id;
		this.moleculaWeight = moleculaWeight;
	}

	public String getName() {
		return name;
	}

	public String getId() {
		return id;
	}

	public double getMoleculaWeight() {
		return moleculaWeight;
	}

	public double to_mpv(double value_v2v, double temperature_K, double pressure_kPa) {
		double v2v_To_mpv_coefficient = (moleculaWeight / V0_LPM) * (T0_K / temperature_K) * (pressure_kPa / P0_KPA);
		return value_v2v * v2v_To_mpv_coefficient;
	}

	public double to_v2v(double value_mpv, double temperature_K, double pressure_kPa) {
		double v2v_To_mpv_coefficient = (moleculaWeight / V0_LPM) * (T0_K / temperature_K) * (pressure_kPa / P0_KPA);
		return value_mpv / v2v_To_mpv_coefficient;
	}

}
