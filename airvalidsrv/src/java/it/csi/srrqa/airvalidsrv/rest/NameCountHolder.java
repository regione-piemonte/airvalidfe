/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.Collection;
import java.util.Map;
import java.util.TreeMap;

public class NameCountHolder {

	private String id;
	private Map<String, NameCount> items = new TreeMap<>();

	public NameCountHolder(String id) {
		this.id = id;
	}

	public String getId() {
		return id;
	}

	public Collection<NameCount> getItems() {
		return items.values();
	}

	public void addItemName(String name) {
		if (name == null || name.isEmpty())
			return;
		NameCount nc = items.get(name);
		if (nc == null)
			items.put(name, new NameCount(name, 1));
		else
			nc.increment();
	}

	public void addItem(NameCount nameCount) {
		items.put(nameCount.getName(), nameCount);
	}

	@Override
	public String toString() {
		return "NameCountHolder [id=" + id + ", items=" + items + "]";
	}

}
