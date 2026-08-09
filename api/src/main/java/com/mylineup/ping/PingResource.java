package com.mylineup.ping;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

/**
 * Öffentlicher Beispiel-Endpunkt für die User-App und zur End-to-End-Verifikation
 * (React -> Quarkus -> Postgres). Kann entfernt werden, sobald echte Fachlogik existiert.
 */
@Path("/api/ping")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PingResource {

    public record PingRequest(@NotBlank String message) {
    }

    @GET
    public List<PingEntry> list() {
        return PingEntry.listAll();
    }

    @POST
    @Transactional
    public PingEntry create(@Valid PingRequest req) {
        PingEntry entry = new PingEntry();
        entry.message = req.message();
        entry.persist();
        return entry;
    }
}
