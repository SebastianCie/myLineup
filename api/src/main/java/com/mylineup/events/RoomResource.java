package com.mylineup.events;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
import java.util.concurrent.ThreadLocalRandom;

@Path("/api/admin/events/{eventId}/rooms")
@RolesAllowed("admin")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RoomResource {

    // Kuratierte, kontraststarke Palette (jede Farbe erreicht mit schwarzem oder weißem Text
    // mindestens 4.5:1) für die zufällige Standardfarbe neuer Räume. Identisch zu V10__room_color.sql.
    private static final String[] RANDOM_COLORS = {
        "#4A7FB5", "#5B8C5A", "#C68A2E", "#AC3B61", "#7B5EA7",
        "#3F9C8A", "#C1622D", "#8B8489", "#B5566B", "#456C86"
    };

    @Inject
    EventAccess eventAccess;

    public record RoomRequest(
            @NotBlank String name,
            String address,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Farbe muss ein Hex-Code wie #AC3B61 sein")
                    String color) {
    }

    @GET
    public List<Room> list(@PathParam("eventId") long eventId) {
        eventAccess.requireOwnedEvent(eventId);
        return Room.listForEvent(eventId);
    }

    @POST
    @Transactional
    public Response create(@PathParam("eventId") long eventId, @Valid RoomRequest req) {
        eventAccess.requireOwnedEvent(eventId);

        Room room = new Room();
        room.eventId = eventId;
        room.name = req.name();
        room.address = req.address();
        room.color = req.color() != null && !req.color().isBlank() ? req.color() : randomColor();
        room.persist();

        return Response.status(Response.Status.CREATED).entity(room).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(
            @PathParam("eventId") long eventId, @PathParam("id") long id, @Valid RoomRequest req) {
        eventAccess.requireOwnedEvent(eventId);
        Room room = Room.findInEvent(id, eventId);
        if (room == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        room.name = req.name();
        room.address = req.address();
        if (req.color() != null && !req.color().isBlank()) {
            room.color = req.color();
        }
        return Response.ok(room).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("eventId") long eventId, @PathParam("id") long id) {
        eventAccess.requireOwnedEvent(eventId);
        Room room = Room.findInEvent(id, eventId);
        if (room == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        room.delete();
        return Response.noContent().build();
    }

    private static String randomColor() {
        return RANDOM_COLORS[ThreadLocalRandom.current().nextInt(RANDOM_COLORS.length)];
    }
}
