/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import java.util.ArrayList;
import java.util.List;

public class Response<D> {

	private int numFound;
	private int start;
	private List<D> docs = new ArrayList<D>();

	public Response() {
	}

	public Response(int numFound, int start, List<D> docs) {
		super();
		this.numFound = numFound;
		this.start = start;
		this.docs = docs;
	}

	public int getNumFound() {
		return numFound;
	}

	public void setNumFound(int numFound) {
		this.numFound = numFound;
	}

	public int getStart() {
		return start;
	}

	public void setStart(int start) {
		this.start = start;
	}

	public List<D> getDocs() {
		return docs;
	}

	public void setDocs(List<D> docs) {
		this.docs = docs;
	}

	@Override
	public String toString() {
		return "Response [numFound=" + numFound + ", start=" + start + ", docs=" + docs + "]";
	}

}
