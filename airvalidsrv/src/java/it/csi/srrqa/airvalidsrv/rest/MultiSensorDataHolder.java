package it.csi.srrqa.airvalidsrv.rest;

import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class MultiSensorDataHolder {

	private String sensorId;
	private List<MeasureValue> data;

	public MultiSensorDataHolder() {
	}

	public MultiSensorDataHolder(String sensorId, List<MeasureValue> data) {
		super();
		this.sensorId = sensorId;
		this.data = data;
	}

	public String getSensorId() {
		return sensorId;
	}

	public void setSensorId(String sensorId) {
		this.sensorId = sensorId;
	}

	public List<MeasureValue> getData() {
		return data;
	}

	public void setData(List<MeasureValue> data) {
		this.data = data;
	}

	@Override
	public String toString() {
		return "DayDataHolder [sensorId=" + sensorId + ", data=" + data + "]";
	}

}
