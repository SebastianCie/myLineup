package com.mylineup.events;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

/**
 * Öffentliche (nicht authentifizierte) Auslieferung von Event-Bilddaten, da <img src>
 * keinen Authorization-Header mitschickt.
 */
@Path("/api/events")
public class PublicEventResource {

    @GET
    @Path("/{id}/logo")
    public Response logo(@PathParam("id") long id) {
        Event event = Event.findById(id);
        if (event == null || !event.hasLogo()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(event.logoData).type(event.logoContentType).build();
    }

    @GET
    @Path("/{id}/flyer")
    public Response flyer(@PathParam("id") long id) {
        Event event = Event.findById(id);
        if (event == null || !event.hasFlyer()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(event.flyerData).type(event.flyerContentType).build();
    }
}
