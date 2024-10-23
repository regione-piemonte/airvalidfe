/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;

import it.csi.srrqa.airvalidsrv.elaboration.Elaboration.PlotType;
import it.csi.srrqa.airvalidsrv.elaboration.Elaboration.TimeBase;

public interface ElaborationItf {

	public void setTimeInterval(Date begin, Date end);

	public Elaboration[] getElaborations();

	public String getId();

	public String getName();

	public TimeBase getTimeBase();

	public PlotType getPlotType();

}
