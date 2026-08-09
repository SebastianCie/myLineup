package com.mylineup.events;

import jakarta.inject.Inject;
import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Zentraler Zugriffspunkt für Mandantentrennung: ein Admin darf nur auf eigene Events
 * (und alles, was daran hängt) zugreifen. Unbekannte oder fremde Event-IDs führen bewusst
 * zu 404 statt 403, um die Existenz fremder Events nicht zu verraten.
 */
@RequestScoped
public class EventAccess {

    @Inject
    JsonWebToken jwt;

    public long currentAdminId() {
        return Long.parseLong(jwt.getSubject());
    }

    public Event requireOwnedEvent(long eventId) {
        Event event = Event.findOwnedById(eventId, currentAdminId());
        if (event == null) {
            throw new NotFoundException("Event nicht gefunden");
        }
        return event;
    }
}
