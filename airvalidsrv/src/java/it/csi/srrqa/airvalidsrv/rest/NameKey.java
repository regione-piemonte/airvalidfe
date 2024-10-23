/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import it.csi.srrqa.airdb.model.NameWithKey;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class NameKey extends NameWithKey {

	private static final long serialVersionUID = 1519924920075455020L;

	public NameKey() {
		super();
	}

	public NameKey(String name, String key) {
		super(name, key);
	}

	public NameKey(String name, String key, boolean active) {
		super(name, key, active);
	}

	public NameKey(NameWithKey nwk) {
		this(nwk.getName(), nwk.getKey(), nwk.isActive());
	}

	public static List<NameKey> convert(List<NameWithKey> listNwk) {
		if (listNwk == null)
			return null;
		List<NameKey> result = new ArrayList<NameKey>();
		for (NameWithKey nwk : listNwk)
			result.add(new NameKey(nwk));
		return result;
	}

}
