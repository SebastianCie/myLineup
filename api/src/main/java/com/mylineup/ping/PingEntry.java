package com.mylineup.ping;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "ping_entries")
public class PingEntry extends PanacheEntity {

    @Column(nullable = false)
    public String message;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();
}
