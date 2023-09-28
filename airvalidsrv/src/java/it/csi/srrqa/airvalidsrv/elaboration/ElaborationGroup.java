/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.elaboration;

import java.util.Date;

import it.csi.srrqa.airvalidsrv.elaboration.Elaboration.TimeBase;

public class ElaborationGroup implements ElaborationItf {

	private String id;

	private String name;

	private Elaboration[] elaborations;

	public ElaborationGroup(Elaboration elaboration) {
		if (elaboration == null)
			throw new IllegalArgumentException("Elaboration should not be null");
		id = elaboration.getId();
		name = elaboration.getName();
		elaborations = new Elaboration[1];
		elaborations[0] = elaboration;
	}

	public ElaborationGroup(String id, String name, Elaboration... elaborations) {
		if (elaborations == null || elaborations.length == 0)
			throw new IllegalArgumentException("At least one elaboration needed");
		for (int i = 0; i < elaborations.length; i++)
			if (elaborations[i] == null)
				throw new IllegalArgumentException("Elaboration should not be null");
		TimeBase timeBase0 = elaborations[0].getTimeBase();
		for (int i = 1; i < elaborations.length; i++)
			if (!timeBase0.equals(elaborations[i].getTimeBase()))
				throw new IllegalArgumentException("All elaborations in the group should have the same"
						+ " time base: expected " + timeBase0 + ", found " + elaborations[i].getTimeBase());
		this.id = id;
		this.name = name;
		this.elaborations = elaborations;
	}

	@Override
	public void setTimeInterval(Date begin, Date end) {
		// Nothing to do!
	}

	@Override
	public Elaboration[] getElaborations() {
		return elaborations;
	}

	@Override
	public String getId() {
		return id;
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public TimeBase getTimeBase() {
		return elaborations[0].getTimeBase();
	}

}
