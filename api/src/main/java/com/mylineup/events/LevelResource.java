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

@Path("/api/admin/events/{eventId}/levels")
@RolesAllowed("admin")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LevelResource {

    // Kuratierte, kontraststarke Palette (jede Farbe erreicht mit schwarzem oder weißem Text
    // mindestens 4.5:1) für die zufällige Standardfarbe neuer Level. Identisch zu V5__level_color.sql.
    private static final String[] RANDOM_COLORS = {
        "#4A7FB5", "#5B8C5A", "#C68A2E", "#AC3B61", "#7B5EA7",
        "#3F9C8A", "#C1622D", "#8B8489", "#B5566B", "#456C86"
    };

    @Inject
    EventAccess eventAccess;

    public record LevelRequest(
            @NotBlank String name,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Farbe muss ein Hex-Code wie #AC3B61 sein")
                    String color) {
    }

    @GET
    public List<Level> list(@PathParam("eventId") long eventId) {
        eventAccess.requireOwnedEvent(eventId);
        return Level.listForEvent(eventId);
    }

    @POST
    @Transactional
    public Response create(@PathParam("eventId") long eventId, @Valid LevelRequest req) {
        eventAccess.requireOwnedEvent(eventId);

        Level level = new Level();
        level.eventId = eventId;
        level.name = req.name();
        level.color = req.color() != null && !req.color().isBlank() ? req.color() : randomColor();
        level.sortOrder = Level.nextSortOrder(eventId);
        level.persist();

        return Response.status(Response.Status.CREATED).entity(level).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(
            @PathParam("eventId") long eventId, @PathParam("id") long id, @Valid LevelRequest req) {
        eventAccess.requireOwnedEvent(eventId);
        Level level = Level.findInEvent(id, eventId);
        if (level == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        level.name = req.name();
        if (req.color() != null && !req.color().isBlank()) {
            level.color = req.color();
        }
        return Response.ok(level).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("eventId") long eventId, @PathParam("id") long id) {
        eventAccess.requireOwnedEvent(eventId);
        Level level = Level.findInEvent(id, eventId);
        if (level == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        level.delete();
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/move-up")
    @Transactional
    public Response moveUp(@PathParam("eventId") long eventId, @PathParam("id") long id) {
        return move(eventId, id, -1);
    }

    @POST
    @Path("/{id}/move-down")
    @Transactional
    public Response moveDown(@PathParam("eventId") long eventId, @PathParam("id") long id) {
        return move(eventId, id, 1);
    }

    private Response move(long eventId, long id, int direction) {
        eventAccess.requireOwnedEvent(eventId);
        List<Level> levels = Level.listForEvent(eventId);

        int index = -1;
        for (int i = 0; i < levels.size(); i++) {
            if (levels.get(i).id.equals(id)) {
                index = i;
                break;
            }
        }
        if (index < 0) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        int swapIndex = index + direction;
        if (swapIndex >= 0 && swapIndex < levels.size()) {
            Level a = levels.get(index);
            Level b = levels.get(swapIndex);
            int tmp = a.sortOrder;
            a.sortOrder = b.sortOrder;
            b.sortOrder = tmp;
        }

        return Response.ok(Level.listForEvent(eventId)).build();
    }

    private static String randomColor() {
        return RANDOM_COLORS[ThreadLocalRandom.current().nextInt(RANDOM_COLORS.length)];
    }
}
