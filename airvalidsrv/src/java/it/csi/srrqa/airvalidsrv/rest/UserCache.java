/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
package it.csi.srrqa.airvalidsrv.rest;

import java.util.Map;

import javax.ws.rs.NotFoundException;

import it.csi.webauth.db.model.FunctionFlags;
import it.csi.webauth.db.model.Utente;

// Cache delle informazioni di autenticazione relative all'utente e di eventuali
// altre informazioni relative all'utente
public class UserCache {

	private static final int EXPIRY_TIME_MIN = 5;
	public static final String FUNCTION_VALIDAZIONE = "validazione";
	public static final String FUNCTION_APP_ADMIN = "app_admin";
	private AuthClientProvider clientProvider;
	private String userKey;
	private CacheItem<Utente> user;
	private CacheItem<FunctionFlags> validationFlags;
	private CacheItem<FunctionFlags> appAdminFlags;
	private CacheItem<Map<Integer, FunctionFlags>> srrqaDomainFlagsMap;

	public UserCache(AuthClientProvider authClientProvider, final String userKey, final boolean enableShibbolet) {
		this.clientProvider = authClientProvider;
		this.userKey = userKey;
		user = new CacheItem<Utente>(EXPIRY_TIME_MIN) {
			@Override
			protected Utente loadItem() {
				if (enableShibbolet)
					return clientProvider.getAuthServiceClient().getUserByCode(userKey);
				return clientProvider.getAuthServiceClient().getUserByName(userKey);
			}
		};
		validationFlags = new CacheItem<FunctionFlags>(EXPIRY_TIME_MIN) {
			@Override
			protected FunctionFlags loadItem() {
				return clientProvider.getAuthServiceClient().getFunctionFlags(FUNCTION_VALIDAZIONE,
						user.getItem().getIdUtente());
			}
		};
		appAdminFlags = new CacheItem<FunctionFlags>(EXPIRY_TIME_MIN) {
			@Override
			protected FunctionFlags loadItem() {
				return clientProvider.getAuthServiceClient().getFunctionFlags(FUNCTION_APP_ADMIN,
						user.getItem().getIdUtente());
			}
		};
		srrqaDomainFlagsMap = new CacheItem<Map<Integer, FunctionFlags>>(EXPIRY_TIME_MIN) {
			@Override
			protected Map<Integer, FunctionFlags> loadItem() {
				if (enableShibbolet)
					return clientProvider.getAuthServiceClient().getDomainFunctionFlagsMapByCode(FUNCTION_VALIDAZIONE,
							userKey);
				return clientProvider.getAuthServiceClient().getDomainFunctionFlagsMap(FUNCTION_VALIDAZIONE, userKey);
			}
		};
	}

	public void invalidate() {
		user.invalidate();
		validationFlags.invalidate();
		appAdminFlags.invalidate();
		srrqaDomainFlagsMap.invalidate();
	}

	public String getUserName() {
		return userKey;
	}

	public Utente getUser() throws AuthException {
		try {
			return user.getItem();
		} catch (NotFoundException e) {
			throw new AuthException("No user found with username '" + userKey + "'", e);
		} catch (Exception e) {
			throw new AuthException("Cannot read information for username '" + userKey + "'", e);
		}
	}

	public FunctionFlags getValidationFlags() throws AuthException {
		try {
			return validationFlags.getItem();
		} catch (Exception e) {
			throw new AuthException("Cannot read permissions for username '" + userKey + "'", e);
		}
	}

	public FunctionFlags getAppAdminFlags() throws AuthException {
		try {
			return appAdminFlags.getItem();
		} catch (Exception e) {
			throw new AuthException("Cannot read permissions for username '" + userKey + "'", e);
		}
	}

	public FunctionFlags getFunctionFlags(String function) throws AuthException {
		if (FUNCTION_VALIDAZIONE.equals(function))
			return getValidationFlags();
		else if (FUNCTION_APP_ADMIN.equals(function))
			return getAppAdminFlags();
		return null;
	}

	public Map<Integer, FunctionFlags> getSrrqaDomainFlagsMap() throws AuthException {
		try {
			return srrqaDomainFlagsMap.getItem();
		} catch (Exception e) {
			throw new AuthException("Cannot read domain permissions for username '" + userKey + "'", e);
		}
	}

	public String printUserIdentity() throws AuthException {
		Utente u = getUser();
		if (u == null)
			return userKey;
		return u.getNome() + " " + u.getCognome();
	}

}
