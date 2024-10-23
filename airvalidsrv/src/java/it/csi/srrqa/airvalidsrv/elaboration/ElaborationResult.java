/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Arrays;

import it.csi.srrqa.airvalidsrv.elaboration.Elaboration.PlotType;
import it.csi.srrqa.airvalidsrv.elaboration.Elaboration.TimeBase;

public class ElaborationResult {

	private String id;
	private String description;
	private TimeBase timebase;
	private PlotType plotType;
	private Value[] values;

	public ElaborationResult() {
	}

	public ElaborationResult(String id, String description, TimeBase timebase, PlotType plotType, Value[] values) {
		super();
		this.id = id;
		this.description = description;
		this.timebase = timebase;
		this.plotType = plotType;
		this.values = values;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public TimeBase getTimebase() {
		return timebase;
	}

	public void setTimebase(TimeBase timebase) {
		this.timebase = timebase;
	}

	public PlotType getPlotType() {
		return plotType;
	}

	public void setPlotType(PlotType plotType) {
		this.plotType = plotType;
	}

	public Value[] getValues() {
		return values;
	}

	public void setValues(Value[] values) {
		this.values = values;
	}

	@Override
	public String toString() {
		return "ElaborationResult [id=" + id + ", description=" + description + ", timebase=" + timebase + ", values="
				+ Arrays.toString(values) + "]";
	}

}
