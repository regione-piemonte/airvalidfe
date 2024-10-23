/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.Collection;

public class PaginatedReplyHolder<T> {

	private int begin;
	private int count;
	private int total;
	private Collection<NameCountHolder> filters;
	private Collection<T> items;

	public PaginatedReplyHolder() {
	}

	public PaginatedReplyHolder(int begin, int count, int total, Collection<T> items) {
		super();
		this.begin = begin;
		this.count = count;
		this.total = total;
		this.items = items;
	}

	public PaginatedReplyHolder(int begin, int count, int total, Collection<NameCountHolder> filters,
			Collection<T> items) {
		super();
		this.begin = begin;
		this.count = count;
		this.total = total;
		this.filters = filters;
		this.items = items;
	}

	public int getBegin() {
		return begin;
	}

	public void setBegin(int begin) {
		this.begin = begin;
	}

	public int getCount() {
		return count;
	}

	public void setCount(int count) {
		this.count = count;
	}

	public int getTotal() {
		return total;
	}

	public void setTotal(int total) {
		this.total = total;
	}

	public Collection<T> getItems() {
		return items;
	}

	public void setItems(Collection<T> items) {
		this.items = items;
	}

	public Collection<NameCountHolder> getFilters() {
		return filters;
	}

	public void setFilters(Collection<NameCountHolder> filters) {
		this.filters = filters;
	}

	@Override
	public String toString() {
		return "PaginatedReplyHolder [begin=" + begin + ", count=" + count + ", total=" + total + ", items=" + items
				+ ", filters=" + filters + "]";
	}

}
