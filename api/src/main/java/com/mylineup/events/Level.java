package com.mylineup.events;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "levels")
public class Level extends PanacheEntity {

    @Column(name = "event_id", nullable = false)
    public Long eventId;

    @Column(nullable = false)
    public String name;

    @Column(nullable = false)
    public String color;

    @Column(name = "sort_order", nullable = false)
    public int sortOrder;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    public static List<Level> listForEvent(long eventId) {
        return list("eventId = ?1 order by sortOrder", eventId);
    }

    public static Level findInEvent(long id, long eventId) {
        return find("id = ?1 and eventId = ?2", id, eventId).firstResult();
    }

    public static int nextSortOrder(long eventId) {
        Level last = find("eventId = ?1 order by sortOrder desc", eventId).firstResult();
        return last == null ? 0 : last.sortOrder + 1;
    }
}
