package com.mylineup.events;

import com.mylineup.geo.GermanGeocoder;
import com.mylineup.geo.LatLng;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Öffentliche (nicht authentifizierte) Endpunkte für die Besucher-App: Events, die aktuell auf
 * der Landkarte sichtbar sind, sowie Detailauflösung eines Events per Direktlink-Token.
 */
@Path("/api/public")
@Produces(MediaType.APPLICATION_JSON)
public class PublicMapResource {

    public record MapEvent(
            long id,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            String city,
            String postalCode,
            String bundesland,
            double lat,
            double lng,
            String publicToken) {
    }

    public record PublicEventDetail(
            long id,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            String description,
            String homepage,
            String street,
            String postalCode,
            String city,
            String country,
            boolean hasLogo,
            boolean hasFlyer,
            String publicToken) {
    }

    @GET
    @Path("/map-events")
    public List<MapEvent> mapEvents() {
        List<Event> events = Event.list("showOnMap = true");
        List<MapEvent> result = new ArrayList<>();
        for (Event event : events) {
            if (!isCurrentlyVisible(event)) {
                continue;
            }
            Optional<LatLng> position = GermanGeocoder.resolve(event.city, event.postalCode);
            if (position.isEmpty()) {
                continue;
            }
            result.add(new MapEvent(
                    event.id,
                    event.name,
                    event.startDate,
                    event.endDate,
                    event.city,
                    event.postalCode,
                    GermanGeocoder.resolveState(event.city).orElse(null),
                    position.get().lat(),
                    position.get().lng(),
                    event.publicToken));
        }
        return result;
    }

    public record PublicAgendaRoom(long id, String name, String color) {
    }

    public record PublicAgendaSpeaker(long id, String name, String country, String city) {
    }

    public record PublicAgendaLevel(long id, String name, String color) {
    }

    public record PublicAgendaItem(
            long id,
            String type,
            String title,
            LocalDate day,
            LocalTime startTime,
            LocalTime endTime,
            String description,
            PublicAgendaRoom room,
            PublicAgendaSpeaker speaker,
            PublicAgendaLevel level) {
    }

    @GET
    @Path("/events/{token}/agenda")
    public Response agenda(@PathParam("token") String token) {
        Event event = Event.findByPublicToken(token);
        if (event == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Map<Long, Room> rooms =
                Room.listForEvent(event.id).stream().collect(Collectors.toMap(r -> r.id, r -> r));
        Map<Long, Speaker> speakers =
                Speaker.listForEvent(event.id).stream().collect(Collectors.toMap(s -> s.id, s -> s));
        Map<Long, Level> levels =
                Level.listForEvent(event.id).stream().collect(Collectors.toMap(l -> l.id, l -> l));

        List<PublicAgendaItem> result = AgendaItem.listForEvent(event.id).stream()
                .map(item -> new PublicAgendaItem(
                        item.id,
                        item.type.name(),
                        item.title,
                        item.day,
                        item.startTime,
                        item.endTime,
                        item.description,
                        toRoom(rooms.get(item.roomId)),
                        toSpeaker(speakers.get(item.speakerId)),
                        toLevel(levels.get(item.levelId))))
                .toList();
        return Response.ok(result).build();
    }

    private PublicAgendaRoom toRoom(Room room) {
        return room == null ? null : new PublicAgendaRoom(room.id, room.name, room.color);
    }

    private PublicAgendaSpeaker toSpeaker(Speaker speaker) {
        return speaker == null ? null : new PublicAgendaSpeaker(speaker.id, speaker.name, speaker.country, speaker.city);
    }

    private PublicAgendaLevel toLevel(Level level) {
        return level == null ? null : new PublicAgendaLevel(level.id, level.name, level.color);
    }

    public record PublicSpeakerDetail(long id, String name, String country, String city, String description) {
    }

    @GET
    @Path("/events/{token}/speakers")
    public Response speakers(@PathParam("token") String token) {
        Event event = Event.findByPublicToken(token);
        if (event == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        List<PublicSpeakerDetail> result = Speaker.listForEvent(event.id).stream()
                .map(s -> new PublicSpeakerDetail(s.id, s.name, s.country, s.city, s.description))
                .toList();
        return Response.ok(result).build();
    }

    @GET
    @Path("/events/{token}")
    public Response eventByToken(@PathParam("token") String token) {
        Event event = Event.findByPublicToken(token);
        if (event == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(new PublicEventDetail(
                        event.id,
                        event.name,
                        event.startDate,
                        event.endDate,
                        event.description,
                        event.homepage,
                        event.street,
                        event.postalCode,
                        event.city,
                        event.country,
                        event.hasLogo(),
                        event.hasFlyer(),
                        event.publicToken))
                .build();
    }

    /** Sichtbar ab mapVisibleFrom, standardmäßig bis 24h nach Event-Ende. */
    private boolean isCurrentlyVisible(Event event) {
        if (event.mapVisibleFrom == null) {
            return false;
        }
        LocalDate today = LocalDate.now();
        if (today.isBefore(event.mapVisibleFrom)) {
            return false;
        }
        Instant cutoff = event.endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()
                .plusSeconds(24 * 3600);
        return Instant.now().isBefore(cutoff);
    }
}
