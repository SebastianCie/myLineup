package com.mylineup.events;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Path("/api/admin/events/{eventId}/agenda-items")
@RolesAllowed("admin")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AgendaItemResource {

    @Inject
    EventAccess eventAccess;

    @Inject
    EntityManager em;

    public record AgendaItemRequest(
            @NotNull AgendaItemType type,
            String title,
            @NotNull LocalDate day,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime,
            String description,
            Long roomId,
            Long speakerId,
            Long levelId) {
    }

    public record ErrorResponse(String message) {
    }

    @GET
    public List<AgendaItem> list(@PathParam("eventId") long eventId, @QueryParam("day") LocalDate day) {
        eventAccess.requireOwnedEvent(eventId);
        return day != null ? AgendaItem.listForEventAndDay(eventId, day) : AgendaItem.listForEvent(eventId);
    }

    @POST
    @Transactional
    public Response create(@PathParam("eventId") long eventId, @Valid AgendaItemRequest req) {
        Event event = eventAccess.requireOwnedEvent(eventId);

        AgendaItem candidate = new AgendaItem();
        candidate.eventId = eventId;
        apply(candidate, req);

        Response validationError = validate(event, candidate, null);
        if (validationError != null) {
            return validationError;
        }

        return persistOrConflict(candidate, () -> Response.status(Response.Status.CREATED).entity(candidate).build());
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(
            @PathParam("eventId") long eventId, @PathParam("id") long id, @Valid AgendaItemRequest req) {
        Event event = eventAccess.requireOwnedEvent(eventId);
        AgendaItem item = AgendaItem.findInEvent(id, eventId);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        apply(item, req);

        Response validationError = validate(event, item, id);
        if (validationError != null) {
            return validationError;
        }

        return persistOrConflict(item, () -> Response.ok(item).build());
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("eventId") long eventId, @PathParam("id") long id) {
        eventAccess.requireOwnedEvent(eventId);
        AgendaItem item = AgendaItem.findInEvent(id, eventId);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        item.delete();
        return Response.noContent().build();
    }

    private void apply(AgendaItem item, AgendaItemRequest req) {
        item.type = req.type();
        item.title = req.title();
        item.day = req.day();
        item.startTime = req.startTime();
        item.endTime = req.endTime();
        item.description = req.description();
        item.roomId = req.roomId();
        // Nur Workshops haben einen Dozenten bzw. ein Level.
        item.speakerId = req.type() == AgendaItemType.WORKSHOP ? req.speakerId() : null;
        item.levelId = req.type() == AgendaItemType.WORKSHOP ? req.levelId() : null;
    }

    private Response validate(Event event, AgendaItem candidate, Long excludeId) {
        if (candidate.title == null || candidate.title.isBlank()) {
            return badRequest("Titel ist erforderlich");
        }
        if (!candidate.endTime.isAfter(candidate.startTime)) {
            return badRequest("Endzeit muss nach der Startzeit liegen");
        }
        if (candidate.day.isBefore(event.startDate) || candidate.day.isAfter(event.endDate)) {
            return badRequest("Tag muss innerhalb des Event-Zeitraums liegen");
        }
        if (candidate.type == AgendaItemType.WORKSHOP
                && (candidate.roomId == null || candidate.speakerId == null)) {
            return badRequest("Workshop benötigt Raum und Dozent");
        }

        String roomConflict = findRoomConflict(candidate, excludeId);
        if (roomConflict != null) {
            return conflict(roomConflict);
        }
        String speakerConflict = findSpeakerConflict(candidate, excludeId);
        if (speakerConflict != null) {
            return conflict(speakerConflict);
        }
        return null;
    }

    private String findRoomConflict(AgendaItem candidate, Long excludeId) {
        if (candidate.roomId == null) {
            return null;
        }
        List<AgendaItem> sameRoomDay = AgendaItem.list(
                "eventId = ?1 and roomId = ?2 and day = ?3", candidate.eventId, candidate.roomId, candidate.day);
        for (AgendaItem existing : sameRoomDay) {
            if (excludeId != null && existing.id.equals(excludeId)) {
                continue;
            }
            if (existing.overlaps(candidate)) {
                return "Raum ist zu dieser Zeit bereits belegt";
            }
        }
        return null;
    }

    private String findSpeakerConflict(AgendaItem candidate, Long excludeId) {
        if (candidate.speakerId == null) {
            return null;
        }
        List<AgendaItem> sameSpeakerDay = AgendaItem.list(
                "eventId = ?1 and speakerId = ?2 and day = ?3",
                candidate.eventId,
                candidate.speakerId,
                candidate.day);
        for (AgendaItem existing : sameSpeakerDay) {
            if (excludeId != null && existing.id.equals(excludeId)) {
                continue;
            }
            if (existing.overlaps(candidate)) {
                return "Dozent ist zu dieser Zeit bereits an anderer Stelle eingeteilt";
            }
        }
        return null;
    }

    private Response persistOrConflict(AgendaItem item, java.util.function.Supplier<Response> onSuccess) {
        try {
            if (item.id == null) {
                item.persist();
            }
            em.flush();
            return onSuccess.get();
        } catch (PersistenceException e) {
            return conflict("Raum oder Dozent ist zu dieser Zeit bereits belegt");
        }
    }

    private Response badRequest(String message) {
        return Response.status(422).entity(new ErrorResponse(message)).build();
    }

    private Response conflict(String message) {
        return Response.status(Response.Status.CONFLICT).entity(new ErrorResponse(message)).build();
    }
}
