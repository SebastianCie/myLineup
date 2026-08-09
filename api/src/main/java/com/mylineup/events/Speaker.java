package com.mylineup.events;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "speakers")
public class Speaker extends PanacheEntity {

    @Column(name = "event_id", nullable = false)
    public Long eventId;

    @Column(nullable = false)
    public String name;

    public String country;

    public String city;

    public String description;

    @Column(nullable = false)
    public boolean confirmed;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    public static List<Speaker> listForEvent(long eventId) {
        return list("eventId = ?1 order by name", eventId);
    }

    public static Speaker findInEvent(long id, long eventId) {
        return find("id = ?1 and eventId = ?2", id, eventId).firstResult();
    }
}
