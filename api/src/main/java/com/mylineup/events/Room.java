package com.mylineup.events;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "rooms")
public class Room extends PanacheEntity {

    @Column(name = "event_id", nullable = false)
    public Long eventId;

    @Column(nullable = false)
    public String name;

    public String address;

    @Column(nullable = false)
    public String color;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    public static List<Room> listForEvent(long eventId) {
        return list("eventId = ?1 order by name", eventId);
    }

    public static Room findInEvent(long id, long eventId) {
        return find("id = ?1 and eventId = ?2", id, eventId).firstResult();
    }
}
