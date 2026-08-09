package com.mylineup.participant;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/participant")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("participant")
public class ParticipantResource {

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
