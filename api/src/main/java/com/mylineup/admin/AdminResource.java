package com.mylineup.admin;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

import jakarta.inject.Inject;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("admin")
public class AdminResource {

    @Inject
    JsonWebToken jwt;

    public record MeResponse(String id, String email, String name) {
    }

    @GET
    @Path("/me")
    public MeResponse me() {
        return new MeResponse(jwt.getSubject(), jwt.getName(), jwt.getClaim("name"));
    }
}
