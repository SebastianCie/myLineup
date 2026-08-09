package com.mylineup.events;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "agenda_items")
public class AgendaItem extends PanacheEntity {

    @Column(name = "event_id", nullable = false)
    public Long eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public AgendaItemType type;

    @Column(nullable = false)
    public String title;

    @Column(nullable = false)
    public LocalDate day;

    @Column(name = "start_time", nullable = false)
    public LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    public LocalTime endTime;

    public String description;

    @Column(name = "room_id")
    public Long roomId;

    @Column(name = "speaker_id")
    public Long speakerId;

    @Column(name = "level_id")
    public Long levelId;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    public static List<AgendaItem> listForEvent(long eventId) {
        return list("eventId = ?1 order by day, startTime", eventId);
    }

    public static List<AgendaItem> listForEventAndDay(long eventId, LocalDate day) {
        return list("eventId = ?1 and day = ?2 order by startTime", eventId, day);
    }

    public static AgendaItem findInEvent(long id, long eventId) {
        return find("id = ?1 and eventId = ?2", id, eventId).firstResult();
    }

    public boolean overlaps(AgendaItem other) {
        return day.equals(other.day) && startTime.isBefore(other.endTime) && other.startTime.isBefore(endTime);
    }
}
