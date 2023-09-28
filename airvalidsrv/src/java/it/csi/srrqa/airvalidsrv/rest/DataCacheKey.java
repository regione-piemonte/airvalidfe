package it.csi.srrqa.airvalidsrv.rest;

public class DataCacheKey {

	private String dbId;
	private String sensorId;
	private Long beginDate;
	private Long endDate;
	private Integer period_m;
	private Short verificationLevel;

	public DataCacheKey(String dbId, String sensorId, Long beginDate, Long endDate, Integer period_m,
			Short verificationLevel) {
		super();
		this.dbId = dbId;
		this.sensorId = sensorId;
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.period_m = period_m;
		this.verificationLevel = verificationLevel;
	}

	public String getDbId() {
		return dbId;
	}

	public String getSensorId() {
		return sensorId;
	}

	public Long getBeginDate() {
		return beginDate;
	}

	public Long getEndDate() {
		return endDate;
	}

	public Integer getPeriod_m() {
		return period_m;
	}

	public Short getVerificationLevel() {
		return verificationLevel;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((beginDate == null) ? 0 : beginDate.hashCode());
		result = prime * result + ((dbId == null) ? 0 : dbId.hashCode());
		result = prime * result + ((endDate == null) ? 0 : endDate.hashCode());
		result = prime * result + ((period_m == null) ? 0 : period_m.hashCode());
		result = prime * result + ((sensorId == null) ? 0 : sensorId.hashCode());
		result = prime * result + ((verificationLevel == null) ? 0 : verificationLevel.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		DataCacheKey other = (DataCacheKey) obj;
		if (beginDate == null) {
			if (other.beginDate != null)
				return false;
		} else if (!beginDate.equals(other.beginDate))
			return false;
		if (dbId == null) {
			if (other.dbId != null)
				return false;
		} else if (!dbId.equals(other.dbId))
			return false;
		if (endDate == null) {
			if (other.endDate != null)
				return false;
		} else if (!endDate.equals(other.endDate))
			return false;
		if (period_m == null) {
			if (other.period_m != null)
				return false;
		} else if (!period_m.equals(other.period_m))
			return false;
		if (sensorId == null) {
			if (other.sensorId != null)
				return false;
		} else if (!sensorId.equals(other.sensorId))
			return false;
		if (verificationLevel == null) {
			if (other.verificationLevel != null)
				return false;
		} else if (!verificationLevel.equals(other.verificationLevel))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "DataCacheKey [dbId=" + dbId + ", sensorId=" + sensorId + ", beginDate=" + beginDate + ", endDate="
				+ endDate + ", period_m=" + period_m + ", verificationLevel=" + verificationLevel + "]";
	}

}