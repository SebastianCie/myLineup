package com.mylineup.events;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
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
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.util.List;
import java.util.Set;

@Path("/api/admin/events")
@RolesAllowed("admin")
@Produces(MediaType.APPLICATION_JSON)
public class EventResource {

    private static final Set<String> ALLOWED_LOGO_TYPES =
            Set.of("image/svg+xml", "image/gif", "image/jpeg", "image/png");
    private static final long MAX_LOGO_SIZE = 3_000_000; // 3 MB
    private static final long MAX_FLYER_SIZE = 8_000_000; // 8 MB

    @Inject
    EventAccess eventAccess;

    public record ErrorResponse(String message) {
    }

    @GET
    public List<Event> list() {
        return Event.listForAdmin(eventAccess.currentAdminId());
    }

    @GET
    @Path("/{id}")
    public Event get(@PathParam("id") long id) {
        return eventAccess.requireOwnedEvent(id);
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Transactional
    public Response create(EventForm form) {
        Response validationError = validate(form);
        if (validationError != null) {
            return validationError;
        }

        Event event = new Event();
        event.adminId = eventAccess.currentAdminId();
        event.publicToken = uniquePublicToken();
        applyForm(event, form);
        event.persist();

        return Response.status(Response.Status.CREATED).entity(event).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Transactional
    public Response update(@PathParam("id") long id, EventForm form) {
        Event event = eventAccess.requireOwnedEvent(id);

        Response validationError = validate(form);
        if (validationError != null) {
            return validationError;
        }

        applyForm(event, form);
        return Response.ok(event).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") long id) {
        Event event = eventAccess.requireOwnedEvent(id);
        event.delete();
        return Response.noContent().build();
    }

    private Response validate(EventForm form) {
        if (form.name == null || form.name.isBlank()) {
            return badRequest("Name ist erforderlich");
        }
        if (form.startDate == null || form.endDate == null) {
            return badRequest("Start- und Enddatum sind erforderlich");
        }
        if (form.endDate.isBefore(form.startDate)) {
            return badRequest("Enddatum darf nicht vor dem Startdatum liegen");
        }
        if (form.logo != null) {
            String contentType = form.logo.contentType();
            if (contentType == null || !ALLOWED_LOGO_TYPES.contains(contentType)) {
                return badRequest("Logo muss SVG, GIF, JPG oder PNG sein");
            }
            if (form.logo.size() > MAX_LOGO_SIZE) {
                return badRequest("Logo darf maximal 3 MB groß sein");
            }
        }
        if (form.flyer != null) {
            String contentType = form.flyer.contentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return badRequest("Flyer muss ein Bild sein");
            }
            if (form.flyer.size() > MAX_FLYER_SIZE) {
                return badRequest("Flyer darf maximal 8 MB groß sein");
            }
        }
        if (form.showOnMap && form.mapVisibleFrom == null) {
            return badRequest("Für die Kartenanzeige wird ein \"Sichtbar ab\"-Datum benötigt");
        }
        return null;
    }

    private String uniquePublicToken() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = Event.generatePublicToken();
            if (Event.findByPublicToken(candidate) == null) {
                return candidate;
            }
        }
        throw new IllegalStateException("Konnte keinen eindeutigen Event-Token generieren");
    }

    private void applyForm(Event event, EventForm form) {
        event.name = form.name;
        event.startDate = form.startDate;
        event.endDate = form.endDate;
        event.description = form.description;
        event.homepage = form.homepage;
        event.street = form.street;
        event.postalCode = form.postalCode;
        event.city = form.city;
        event.country = form.country;
        event.showOnMap = form.showOnMap;
        event.mapVisibleFrom = form.showOnMap ? form.mapVisibleFrom : null;

        if (form.logo != null) {
            try {
                event.logoData = Files.readAllBytes(form.logo.uploadedFile());
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
            event.logoContentType = form.logo.contentType();
            event.logoFilename = form.logo.fileName();
        }

        if (form.flyer != null) {
            try {
                event.flyerData = Files.readAllBytes(form.flyer.uploadedFile());
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
            event.flyerContentType = form.flyer.contentType();
            event.flyerFilename = form.flyer.fileName();
        }
    }

    private Response badRequest(String message) {
        return Response.status(422).entity(new ErrorResponse(message)).build();
    }
}
