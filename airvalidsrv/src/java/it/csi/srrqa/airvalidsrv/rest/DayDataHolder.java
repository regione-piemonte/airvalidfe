package it.csi.srrqa.airvalidsrv.rest;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import it.csi.srrqa.airdb.model.MeasureValue;

public class DayDataHolder {

	private Date day;
	private List<MeasureValue> data;

	public DayDataHolder() {
	}

	public DayDataHolder(Date day) {
		super();
		this.day = day;
		this.data = new ArrayList<MeasureValue>();
	}

	public DayDataHolder(Date day, List<MeasureValue> data) {
		super();
		this.day = day;
		this.data = data;
	}

	public Date getDay() {
		return day;
	}

	public void setDay(Date day) {
		this.day = day;
	}

	public List<MeasureValue> getData() {
		return data;
	}

	public void setData(List<MeasureValue> data) {
		this.data = data;
	}

	public void addValue(MeasureValue value) {
		if (data == null)
			data = new ArrayList<MeasureValue>();
		data.add(value);
	}

	@Override
	public String toString() {
		return "DayDataHolder [day=" + day + ", data=" + data + "]";
	}

}
