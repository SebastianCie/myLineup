package com.mylineup.events;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/admin/events/{eventId}/speakers")
@RolesAllowed("admin")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class SpeakerResource {

    @Inject
    EventAccess eventAccess;

    public record SpeakerRequest(
            @NotBlank String name,
            String country,
            String city,
            String description,
            boolean confirmed) {
    }

    @GET
    public List<Speaker> list(@PathParam("eventId") long eventId) {
        eventAccess.requireOwnedEvent(eventId);
        return Speaker.listForEvent(eventId);
    }

    @POST
    @Transactional
    public Response create(@PathParam("eventId") long eventId, @Valid SpeakerRequest req) {
        eventAccess.requireOwnedEvent(eventId);

        Speaker speaker = new Speaker();
        speaker.eventId = eventId;
        apply(speaker, req);
        speaker.persist();

        return Response.status(Response.Status.CREATED).entity(speaker).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(
            @PathParam("eventId") long eventId, @PathParam("id") long id, @Valid SpeakerRequest req) {
        eventAccess.requireOwnedEvent(eventId);
        Speaker speaker = Speaker.findInEvent(id, eventId);
        if (speaker == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        apply(speaker, req);
        return Response.ok(speaker).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("eventId") long eventId, @PathParam("id") long id) {
        eventAccess.requireOwnedEvent(eventId);
        Speaker speaker = Speaker.findInEvent(id, eventId);
        if (speaker == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        speaker.delete();
        return Response.noContent().build();
    }

    private void apply(Speaker speaker, SpeakerRequest req) {
        speaker.name = req.name();
        speaker.country = req.country();
        speaker.city = req.city();
        speaker.description = req.description();
        speaker.confirmed = req.confirmed();
    }
}
