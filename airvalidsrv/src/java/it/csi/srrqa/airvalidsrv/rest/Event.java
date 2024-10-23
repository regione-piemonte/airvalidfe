/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

import it.csi.srrqa.airdb.model.DataUtils;
import it.csi.srrqa.airvalidsrv.solr.Solr;
import it.csi.srrqa.airvalidsrv.solr.SolrSensorEvent;

public class Event implements Comparable<Event>{

	private String origin;
	private String type;
	private Long beginDate;
	private Long endDate;
	private List<String> notes;

	public Event() {
	}

	public Event(String origin, String type, Long beginDate, Long endDate, List<String> notes) {
		super();
		this.origin = origin;
		this.type = type;
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.notes = notes;
	}

	public Event(SolrSensorEvent solrSensorEvent) throws AppException {
		origin = solrSensorEvent.getFonte();
		type = solrSensorEvent.getTipologia();
		String tmpDate;
		tmpDate = solrSensorEvent.getData_inizio_intervento() != null ? solrSensorEvent.getData_inizio_intervento()
				: solrSensorEvent.getData_inizio();
		beginDate = parseSolrDate(tmpDate);
		tmpDate = solrSensorEvent.getData_fine_intervento() != null ? solrSensorEvent.getData_fine_intervento()
				: solrSensorEvent.getData_fine();
		endDate = parseSolrDate(tmpDate);
		notes = new ArrayList<String>();
		if (solrSensorEvent.getNote_a() != null && !solrSensorEvent.getNote_a().isEmpty())
			notes.add(solrSensorEvent.getNote_a());
		if (solrSensorEvent.getNote_b() != null && !solrSensorEvent.getNote_b().isEmpty())
			notes.add(solrSensorEvent.getNote_b());
	}

	public String getOrigin() {
		return origin;
	}

	public void setOrigin(String origin) {
		this.origin = origin;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public Long getBeginDate() {
		return beginDate;
	}

	public void setBeginDate(Long beginDate) {
		this.beginDate = beginDate;
	}

	public Long getEndDate() {
		return endDate;
	}

	public void setEndDate(Long endDate) {
		this.endDate = endDate;
	}

	public List<String> getNotes() {
		return notes;
	}

	public void setNotes(List<String> notes) {
		this.notes = notes;
	}

	@Override
	public String toString() {
		return "Event [origin=" + origin + ", type=" + type + ", beginDate=" + beginDate + ", endDate=" + endDate
				+ ", notes=" + notes + "]";
	}

	private Long parseSolrDate(String date) throws AppException {
		if (date == null || date.trim().isEmpty())
			return null;
		SimpleDateFormat sdf = new SimpleDateFormat(Solr.TIMESTAMP_FMT);
		try {
			return sdf.parse(date.trim()).getTime();
		} catch (ParseException e) {
			throw new AppException(
					"Cannot parse timestamp from '" + date + "' using format '" + Solr.TIMESTAMP_FMT + "'");
		}
	}

	@Override
	public int compareTo(Event o) {
		int result = DataUtils.compareLong(beginDate, o.getBeginDate());
		if (result != 0)
			return result;
		return DataUtils.compareLong(endDate, o.getEndDate());
	}

}
