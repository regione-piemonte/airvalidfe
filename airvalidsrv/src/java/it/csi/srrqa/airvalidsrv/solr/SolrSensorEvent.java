/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SolrSensorEvent {

	private String id;
	private String fonte;
	private String fonte_id;
	private String rete_id_rete_monit;
	private String codice_istat_comune;
	private String progr_punto_com;
	private String parametro_id_parametro;
	private String parametro_denominazione;
	private String data_inizio;
	private String data_fine;
	private String note_a;
	private String note_b;
	private String data_inizio_intervento;
	private String data_fine_intervento;
	private String tipologia;
	private String rete_denominazione;
	private String stazione_nome_pubblico;
	private @JsonProperty("_version_") Long version;

	public SolrSensorEvent() {
	}

	public SolrSensorEvent(String id, String fonte, String fonte_id, String rete_id_rete_monit,
			String codice_istat_comune, String progr_punto_com, String parametro_id_parametro,
			String parametro_denominazione, String data_inizio, String data_fine, String note_a, String note_b,
			String data_inizio_intervento, String data_fine_intervento, String tipologia, String rete_denominazione,
			String stazione_nome_pubblico, Long version) {
		super();
		this.id = id;
		this.fonte = fonte;
		this.fonte_id = fonte_id;
		this.rete_id_rete_monit = rete_id_rete_monit;
		this.codice_istat_comune = codice_istat_comune;
		this.progr_punto_com = progr_punto_com;
		this.parametro_id_parametro = parametro_id_parametro;
		this.parametro_denominazione = parametro_denominazione;
		this.data_inizio = data_inizio;
		this.data_fine = data_fine;
		this.note_a = note_a;
		this.note_b = note_b;
		this.data_inizio_intervento = data_inizio_intervento;
		this.data_fine_intervento = data_fine_intervento;
		this.tipologia = tipologia;
		this.rete_denominazione = rete_denominazione;
		this.stazione_nome_pubblico = stazione_nome_pubblico;
		this.version = version;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getFonte() {
		return fonte;
	}

	public void setFonte(String fonte) {
		this.fonte = fonte;
	}

	public String getFonte_id() {
		return fonte_id;
	}

	public void setFonte_id(String fonte_id) {
		this.fonte_id = fonte_id;
	}

	public String getRete_id_rete_monit() {
		return rete_id_rete_monit;
	}

	public void setRete_id_rete_monit(String rete_id_rete_monit) {
		this.rete_id_rete_monit = rete_id_rete_monit;
	}

	public String getCodice_istat_comune() {
		return codice_istat_comune;
	}

	public void setCodice_istat_comune(String codice_istat_comune) {
		this.codice_istat_comune = codice_istat_comune;
	}

	public String getProgr_punto_com() {
		return progr_punto_com;
	}

	public void setProgr_punto_com(String progr_punto_com) {
		this.progr_punto_com = progr_punto_com;
	}

	public String getParametro_id_parametro() {
		return parametro_id_parametro;
	}

	public void setParametro_id_parametro(String parametro_id_parametro) {
		this.parametro_id_parametro = parametro_id_parametro;
	}

	public String getParametro_denominazione() {
		return parametro_denominazione;
	}

	public void setParametro_denominazione(String parametro_denominazione) {
		this.parametro_denominazione = parametro_denominazione;
	}

	public String getData_inizio() {
		return data_inizio;
	}

	public void setData_inizio(String data_inizio) {
		this.data_inizio = data_inizio;
	}

	public String getData_fine() {
		return data_fine;
	}

	public void setData_fine(String data_fine) {
		this.data_fine = data_fine;
	}

	public String getNote_a() {
		return note_a;
	}

	public void setNote_a(String note_a) {
		this.note_a = note_a;
	}

	public String getNote_b() {
		return note_b;
	}

	public void setNote_b(String note_b) {
		this.note_b = note_b;
	}

	public String getData_inizio_intervento() {
		return data_inizio_intervento;
	}

	public void setData_inizio_intervento(String data_inizio_intervento) {
		this.data_inizio_intervento = data_inizio_intervento;
	}

	public String getData_fine_intervento() {
		return data_fine_intervento;
	}

	public void setData_fine_intervento(String data_fine_intervento) {
		this.data_fine_intervento = data_fine_intervento;
	}

	public String getTipologia() {
		return tipologia;
	}

	public void setTipologia(String tipologia) {
		this.tipologia = tipologia;
	}

	public String getRete_denominazione() {
		return rete_denominazione;
	}

	public void setRete_denominazione(String rete_denominazione) {
		this.rete_denominazione = rete_denominazione;
	}

	public String getStazione_nome_pubblico() {
		return stazione_nome_pubblico;
	}

	public void setStazione_nome_pubblico(String stazione_nome_pubblico) {
		this.stazione_nome_pubblico = stazione_nome_pubblico;
	}

	public Long getVersion() {
		return version;
	}

	public void setVersion(Long version) {
		this.version = version;
	}

	@Override
	public String toString() {
		return "SolrSensorEvent [id=" + id + ", fonte=" + fonte + ", fonte_id=" + fonte_id + ", rete_id_rete_monit="
				+ rete_id_rete_monit + ", codice_istat_comune=" + codice_istat_comune + ", progr_punto_com="
				+ progr_punto_com + ", parametro_id_parametro=" + parametro_id_parametro + ", parametro_denominazione="
				+ parametro_denominazione + ", data_inizio=" + data_inizio + ", data_fine=" + data_fine + ", note_a="
				+ note_a + ", note_b=" + note_b + ", data_inizio_intervento=" + data_inizio_intervento
				+ ", data_fine_intervento=" + data_fine_intervento + ", tipologia=" + tipologia
				+ ", rete_denominazione=" + rete_denominazione + ", stazione_nome_pubblico=" + stazione_nome_pubblico
				+ ", version=" + version + "]";
	}

}
