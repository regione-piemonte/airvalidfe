/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import it.csi.srrqa.airvalidsrv.solr.SolrRestClient;

interface SolrClientProvider {

	public SolrRestClient getSolrServiceClient();

}
