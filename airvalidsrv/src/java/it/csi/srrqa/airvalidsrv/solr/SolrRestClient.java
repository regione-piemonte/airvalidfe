/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.solr;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

@Path("/")
public interface SolrRestClient {

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/airnet/select")
	public ResponseHolder<Object, ParametersStatsFields> getAirnetSelectParameters(//
			@QueryParam("q.op") String q_op, //
			@QueryParam("q") String q, //
			@QueryParam("rows") int rows, //
			@QueryParam("df") String df, //
			@QueryParam("stats") String stats, //
			@QueryParam("stats.field") String stats_field, //
			@QueryParam("stats.calcdistinct") boolean stats_calcdistinct);

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/airnetcop/select")
	public ResponseHolder<Object, ParametersStatsFields> getAirnetCopSelectParameters(//
			@QueryParam("q.op") String q_op, //
			@QueryParam("q") String q, //
			@QueryParam("rows") int rows, //
			@QueryParam("df") String df, //
			@QueryParam("stats") String stats, //
			@QueryParam("stats.field") String stats_field, //
			@QueryParam("stats.calcdistinct") boolean stats_calcdistinct);

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/airnet/select")
	public ResponseHolder<Object, StationsStatsFields> getAirnetSelectStations(//
			@QueryParam("q.op") String q_op, //
			@QueryParam("q") String q, //
			@QueryParam("rows") int rows, //
			@QueryParam("df") String df, //
			@QueryParam("stats") String stats, //
			@QueryParam("stats.field") String stats_field, //
			@QueryParam("stats.calcdistinct") boolean stats_calcdistinct);

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/airnetcop/select")
	public ResponseHolder<Object, StationsStatsFields> getAirnetCopSelectStations(//
			@QueryParam("q.op") String q_op, //
			@QueryParam("q") String q, //
			@QueryParam("rows") int rows, //
			@QueryParam("df") String df, //
			@QueryParam("stats") String stats, //
			@QueryParam("stats.field") String stats_field, //
			@QueryParam("stats.calcdistinct") boolean stats_calcdistinct);

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/airnet/select")
	public ResponseHolder<SolrAnagraphItem, Object> getAirnetSelectFacet(//
			@QueryParam("q") String q, //
			@QueryParam("rows") int rows, //
			@QueryParam("start") int start, //
			@QueryParam("facet") String facet, //
			@QueryParam("facet.mincount") int facet_mincount, //
			@QueryParam("facet.field") String[] facet_field);

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/airnetcop/select")
	public ResponseHolder<SolrAnagraphItem, Object> getAirnetCopSelectFacet(//
			@QueryParam("q") String q, //
			@QueryParam("rows") int rows, //
			@QueryParam("start") int start, //
			@QueryParam("facet") String facet, //
			@QueryParam("facet.mincount") int facet_mincount, //
			@QueryParam("facet.field") String[] facet_field);

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/airgest/select")
	public ResponseHolder<SolrSensorEvent, Object> getAirgestSensorEvents(//
			@QueryParam("q.op") String q_op, //
			@QueryParam("q") String q, //
			@QueryParam("rows") int rows, //
			@QueryParam("sort") String sort);

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/airgest/select")
	public ResponseHolder<SolrSensorEvent, Object> getAirgestSelectFacet(//
			@QueryParam("q") String q, //
			@QueryParam("rows") int rows, //
			@QueryParam("start") int start, //
			@QueryParam("facet") String facet, //
			@QueryParam("facet.mincount") int facet_mincount, //
			@QueryParam("facet.field") String[] facet_field);

}
