/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

public class NameCount implements Comparable<NameCount> {

	private String name;
	private int count = 0;

	public NameCount() {
	}

	public NameCount(String name, int count) {
		super();
		this.name = name;
		this.count = count;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public int getCount() {
		return count;
	}

	public void setCount(int count) {
		this.count = count;
	}

	public void increment() {
		count++;
	}

	@Override
	public String toString() {
		return "NameCount [name=" + name + ", count=" + count + "]";
	}

	@Override
	public int compareTo(NameCount other) {
		if (name == null && other.name == null)
			return 0;
		if (name == null)
			return -1;
		if (other.name == null)
			return 1;
		return this.name.compareTo(other.getName());
	}

}
