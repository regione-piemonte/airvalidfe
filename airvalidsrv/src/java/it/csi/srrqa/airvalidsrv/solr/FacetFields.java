package it.csi.srrqa.airvalidsrv.solr;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FacetFields {

	private @JsonProperty("rete_denominazione") List<String> networkName;
	private @JsonProperty("stazione_nome_pubblico") List<String> stationName;
	private @JsonProperty("parametro_denominazione") List<String> parameterName;
	private @JsonProperty("sensore_parametro_denominazione") List<String> sensorParamName;
	private @JsonProperty("fonte") List<String> origin;

	public FacetFields() {
	}

	public List<String> getNetworkName() {
		return networkName;
	}

	public void setNetworkName(List<String> networkName) {
		this.networkName = networkName;
	}

	public List<String> getStationName() {
		return stationName;
	}

	public void setStationName(List<String> stationName) {
		this.stationName = stationName;
	}

	public List<String> getParameterName() {
		return parameterName;
	}

	public void setParameterName(List<String> parameterName) {
		this.parameterName = parameterName;
	}

	public List<String> getSensorParamName() {
		return sensorParamName;
	}

	public void setSensorParamName(List<String> sensorParamName) {
		this.sensorParamName = sensorParamName;
	}

	public List<String> getOrigin() {
		return origin;
	}

	public void setOrigin(List<String> origin) {
		this.origin = origin;
	}

	@Override
	public String toString() {
		return "FacetFields [networkName=" + networkName + ", stationName=" + stationName + ", parameterName="
				+ parameterName + ", sensorParamName=" + sensorParamName + ", origin=" + origin + "]";
	}

}
