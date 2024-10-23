/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.specreport;

import java.util.ArrayList;
import java.util.List;

import it.csi.srrqa.airdb.model.NameWithKey;

public class ReportAnagraph {

	public enum ItemType {
		NETWORK, STATION, PARAMETER, SENSOR
	};

	private ItemType itemType;
	private int countMin;
	private Integer countMax;
	private boolean selectionCompleted;
	private List<NameWithKey> items;

	public ReportAnagraph() {
	}

	public ReportAnagraph(ItemType itemType, int countMin, Integer countMax, boolean selectionCompleted,
			List<? extends NameWithKey> items) {
		super();
		this.itemType = itemType;
		this.countMin = countMin;
		this.countMax = countMax;
		this.selectionCompleted = selectionCompleted;
		this.items = new ArrayList<NameWithKey>();
		if (items != null)
			this.items.addAll(items);
	}

	public ItemType getItemType() {
		return itemType;
	}

	public void setItemType(ItemType itemType) {
		this.itemType = itemType;
	}

	public int getCountMin() {
		return countMin;
	}

	public void setCountMin(int countMin) {
		this.countMin = countMin;
	}

	public Integer getCountMax() {
		return countMax;
	}

	public void setCountMax(Integer countMax) {
		this.countMax = countMax;
	}

	public boolean isSelectionCompleted() {
		return selectionCompleted;
	}

	public void setSelectionCompleted(boolean selectionCompleted) {
		this.selectionCompleted = selectionCompleted;
	}

	public List<NameWithKey> getItems() {
		return items;
	}

	public void setItems(List<NameWithKey> items) {
		this.items = items;
	}

	@Override
	public String toString() {
		return "ReportAnagraph [itemType=" + itemType + ", countMin=" + countMin + ", countMax=" + countMax
				+ ", selectionCompleted=" + selectionCompleted + ", items=" + items + "]";
	}

	public static boolean isItemType(ItemType type, String value) {
		if (type == null && value == null)
			return true;
		if (value == null || type == null)
			return false;
		return type.toString().equalsIgnoreCase(value);
	}

}
