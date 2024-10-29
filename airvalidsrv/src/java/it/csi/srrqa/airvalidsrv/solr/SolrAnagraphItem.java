/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SolrAnagraphItem {

	private String id;
	private String rete_denominazione;
	private String stazione_nome_pubblico;
	private String sensore_parametro_denominazione;
	private String sensore_data_inizio;
	private String sensore_data_fine;
	private String rete_fl_cop;
	private String rete_fl_da_pubblicare;
	private String rete_fl_privata;
	private String rete_fl_quad_val;
	private String rete_id_rete_monit;
	private String sensore_codice_istat_comune;
	private String sensore_fl_da_pubblicare;
	private String sensore_flg_ministero;
	private String sensore_id_parametro;
	private String sensore_metodologia_misura;
	private String sensore_progr_punto_com;
	private String sensore_tempo_campionamento;
	private String stazione_denominazione;
	private String sensore_tempo_registrazione;
	private String stazione_des_stazione;
	private String stazione_fl_da_pubblicare;
	private String stazione_id_caratt_zona;
	private String stazione_id_tipologia_staz;
	private String stazione_indirizzo_localita;
	private String stazione_note;
	private String stazione_latitudine;
	private String stazione_longitudine;
	private String stazione_quota_stazione;
	private String stazione_tipologia;
	private String stazione_tipologia_staz;
	private String stazione_url;
	private String stazione_utm_x;
	private String stazione_utm_y;
	private String campo_concat_rete_stazione;
	private String campo_concat_codice_nome_stazione;
	private @JsonProperty("_version_") Long version;

	public SolrAnagraphItem() {
		super();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
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

	public String getSensore_parametro_denominazione() {
		return sensore_parametro_denominazione;
	}

	public void setSensore_parametro_denominazione(String sensore_parametro_denominazione) {
		this.sensore_parametro_denominazione = sensore_parametro_denominazione;
	}

	public String getSensore_data_inizio() {
		return sensore_data_inizio;
	}

	public void setSensore_data_inizio(String sensore_data_inizio) {
		this.sensore_data_inizio = sensore_data_inizio;
	}

	public String getSensore_data_fine() {
		return sensore_data_fine;
	}

	public void setSensore_data_fine(String sensore_data_fine) {
		this.sensore_data_fine = sensore_data_fine;
	}

	public String getRete_fl_cop() {
		return rete_fl_cop;
	}

	public void setRete_fl_cop(String rete_fl_cop) {
		this.rete_fl_cop = rete_fl_cop;
	}

	public String getRete_fl_da_pubblicare() {
		return rete_fl_da_pubblicare;
	}

	public void setRete_fl_da_pubblicare(String rete_fl_da_pubblicare) {
		this.rete_fl_da_pubblicare = rete_fl_da_pubblicare;
	}

	public String getRete_fl_privata() {
		return rete_fl_privata;
	}

	public void setRete_fl_privata(String rete_fl_privata) {
		this.rete_fl_privata = rete_fl_privata;
	}

	public String getRete_fl_quad_val() {
		return rete_fl_quad_val;
	}

	public void setRete_fl_quad_val(String rete_fl_quad_val) {
		this.rete_fl_quad_val = rete_fl_quad_val;
	}

	public String getRete_id_rete_monit() {
		return rete_id_rete_monit;
	}

	public void setRete_id_rete_monit(String rete_id_rete_monit) {
		this.rete_id_rete_monit = rete_id_rete_monit;
	}

	public String getSensore_codice_istat_comune() {
		return sensore_codice_istat_comune;
	}

	public void setSensore_codice_istat_comune(String sensore_codice_istat_comune) {
		this.sensore_codice_istat_comune = sensore_codice_istat_comune;
	}

	public String getSensore_fl_da_pubblicare() {
		return sensore_fl_da_pubblicare;
	}

	public void setSensore_fl_da_pubblicare(String sensore_fl_da_pubblicare) {
		this.sensore_fl_da_pubblicare = sensore_fl_da_pubblicare;
	}

	public String getSensore_flg_ministero() {
		return sensore_flg_ministero;
	}

	public void setSensore_flg_ministero(String sensore_flg_ministero) {
		this.sensore_flg_ministero = sensore_flg_ministero;
	}

	public String getSensore_id_parametro() {
		return sensore_id_parametro;
	}

	public void setSensore_id_parametro(String sensore_id_parametro) {
		this.sensore_id_parametro = sensore_id_parametro;
	}

	public String getSensore_metodologia_misura() {
		return sensore_metodologia_misura;
	}

	public void setSensore_metodologia_misura(String sensore_metodologia_misura) {
		this.sensore_metodologia_misura = sensore_metodologia_misura;
	}

	public String getSensore_progr_punto_com() {
		return sensore_progr_punto_com;
	}

	public void setSensore_progr_punto_com(String sensore_progr_punto_com) {
		this.sensore_progr_punto_com = sensore_progr_punto_com;
	}

	public String getSensore_tempo_campionamento() {
		return sensore_tempo_campionamento;
	}

	public void setSensore_tempo_campionamento(String sensore_tempo_campionamento) {
		this.sensore_tempo_campionamento = sensore_tempo_campionamento;
	}

	public String getStazione_denominazione() {
		return stazione_denominazione;
	}

	public void setStazione_denominazione(String stazione_denominazione) {
		this.stazione_denominazione = stazione_denominazione;
	}

	public String getSensore_tempo_registrazione() {
		return sensore_tempo_registrazione;
	}

	public void setSensore_tempo_registrazione(String sensore_tempo_registrazione) {
		this.sensore_tempo_registrazione = sensore_tempo_registrazione;
	}

	public String getStazione_des_stazione() {
		return stazione_des_stazione;
	}

	public void setStazione_des_stazione(String stazione_des_stazione) {
		this.stazione_des_stazione = stazione_des_stazione;
	}

	public String getStazione_fl_da_pubblicare() {
		return stazione_fl_da_pubblicare;
	}

	public void setStazione_fl_da_pubblicare(String stazione_fl_da_pubblicare) {
		this.stazione_fl_da_pubblicare = stazione_fl_da_pubblicare;
	}

	public String getStazione_id_caratt_zona() {
		return stazione_id_caratt_zona;
	}

	public void setStazione_id_caratt_zona(String stazione_id_caratt_zona) {
		this.stazione_id_caratt_zona = stazione_id_caratt_zona;
	}

	public String getStazione_id_tipologia_staz() {
		return stazione_id_tipologia_staz;
	}

	public void setStazione_id_tipologia_staz(String stazione_id_tipologia_staz) {
		this.stazione_id_tipologia_staz = stazione_id_tipologia_staz;
	}

	public String getStazione_indirizzo_localita() {
		return stazione_indirizzo_localita;
	}

	public void setStazione_indirizzo_localita(String stazione_indirizzo_localita) {
		this.stazione_indirizzo_localita = stazione_indirizzo_localita;
	}

	public String getStazione_note() {
		return stazione_note;
	}

	public void setStazione_note(String stazione_note) {
		this.stazione_note = stazione_note;
	}

	public String getStazione_latitudine() {
		return stazione_latitudine;
	}

	public void setStazione_latitudine(String stazione_latitudine) {
		this.stazione_latitudine = stazione_latitudine;
	}

	public String getStazione_longitudine() {
		return stazione_longitudine;
	}

	public void setStazione_longitudine(String stazione_longitudine) {
		this.stazione_longitudine = stazione_longitudine;
	}

	public String getStazione_quota_stazione() {
		return stazione_quota_stazione;
	}

	public void setStazione_quota_stazione(String stazione_quota_stazione) {
		this.stazione_quota_stazione = stazione_quota_stazione;
	}

	public String getStazione_tipologia() {
		return stazione_tipologia;
	}

	public void setStazione_tipologia(String stazione_tipologia) {
		this.stazione_tipologia = stazione_tipologia;
	}

	public String getStazione_tipologia_staz() {
		return stazione_tipologia_staz;
	}

	public void setStazione_tipologia_staz(String stazione_tipologia_staz) {
		this.stazione_tipologia_staz = stazione_tipologia_staz;
	}

	public String getStazione_url() {
		return stazione_url;
	}

	public void setStazione_url(String stazione_url) {
		this.stazione_url = stazione_url;
	}

	public String getStazione_utm_x() {
		return stazione_utm_x;
	}

	public void setStazione_utm_x(String stazione_utm_x) {
		this.stazione_utm_x = stazione_utm_x;
	}

	public String getStazione_utm_y() {
		return stazione_utm_y;
	}

	public void setStazione_utm_y(String stazione_utm_y) {
		this.stazione_utm_y = stazione_utm_y;
	}

	public String getCampo_concat_rete_stazione() {
		return campo_concat_rete_stazione;
	}

	public void setCampo_concat_rete_stazione(String campo_concat_rete_stazione) {
		this.campo_concat_rete_stazione = campo_concat_rete_stazione;
	}

	public String getCampo_concat_codice_nome_stazione() {
		return campo_concat_codice_nome_stazione;
	}

	public void setCampo_concat_codice_nome_stazione(String campo_concat_codice_nome_stazione) {
		this.campo_concat_codice_nome_stazione = campo_concat_codice_nome_stazione;
	}

	public Long getVersion() {
		return version;
	}

	public void setVersion(Long version) {
		this.version = version;
	}

	@Override
	public String toString() {
		return "SolrAnagraphItem [id=" + id + ", rete_denominazione=" + rete_denominazione + ", stazione_nome_pubblico="
				+ stazione_nome_pubblico + ", sensore_parametro_denominazione=" + sensore_parametro_denominazione
				+ ", sensore_data_inizio=" + sensore_data_inizio + ", sensore_data_fine=" + sensore_data_fine
				+ ", rete_fl_cop=" + rete_fl_cop + ", rete_fl_da_pubblicare=" + rete_fl_da_pubblicare
				+ ", rete_fl_privata=" + rete_fl_privata + ", rete_fl_quad_val=" + rete_fl_quad_val
				+ ", rete_id_rete_monit=" + rete_id_rete_monit + ", sensore_codice_istat_comune="
				+ sensore_codice_istat_comune + ", sensore_fl_da_pubblicare=" + sensore_fl_da_pubblicare
				+ ", sensore_flg_ministero=" + sensore_flg_ministero + ", sensore_id_parametro=" + sensore_id_parametro
				+ ", sensore_metodologia_misura=" + sensore_metodologia_misura + ", sensore_progr_punto_com="
				+ sensore_progr_punto_com + ", sensore_tempo_campionamento=" + sensore_tempo_campionamento
				+ ", stazione_denominazione=" + stazione_denominazione + ", sensore_tempo_registrazione="
				+ sensore_tempo_registrazione + ", stazione_des_stazione=" + stazione_des_stazione
				+ ", stazione_fl_da_pubblicare=" + stazione_fl_da_pubblicare + ", stazione_id_caratt_zona="
				+ stazione_id_caratt_zona + ", stazione_id_tipologia_staz=" + stazione_id_tipologia_staz
				+ ", stazione_indirizzo_localita=" + stazione_indirizzo_localita + ", stazione_note=" + stazione_note
				+ ", stazione_latitudine=" + stazione_latitudine + ", stazione_longitudine=" + stazione_longitudine
				+ ", stazione_quota_stazione=" + stazione_quota_stazione + ", stazione_tipologia=" + stazione_tipologia
				+ ", stazione_tipologia_staz=" + stazione_tipologia_staz + ", stazione_url=" + stazione_url
				+ ", stazione_utm_x=" + stazione_utm_x + ", stazione_utm_y=" + stazione_utm_y
				+ ", campo_concat_rete_stazione=" + campo_concat_rete_stazione + ", campo_concat_codice_nome_stazione="
				+ campo_concat_codice_nome_stazione + ", version=" + version + "]";
	}

}
