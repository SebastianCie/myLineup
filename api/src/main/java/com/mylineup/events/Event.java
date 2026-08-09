package com.mylineup.events;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "events")
public class Event extends PanacheEntity {

    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @Column(nullable = false)
    public String name;

    @Column(name = "start_date", nullable = false)
    public LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    public LocalDate endDate;

    public String description;

    public String homepage;

    public String street;

    @Column(name = "postal_code")
    public String postalCode;

    public String city;

    public String country;

    @Column(name = "public_token", nullable = false, unique = true)
    public String publicToken;

    @Column(name = "show_on_map", nullable = false)
    public boolean showOnMap;

    @Column(name = "map_visible_from")
    public LocalDate mapVisibleFrom;

    @JsonIgnore
    @Column(name = "logo_data")
    public byte[] logoData;

    @JsonIgnore
    @Column(name = "logo_content_type")
    public String logoContentType;

    @JsonIgnore
    @Column(name = "logo_filename")
    public String logoFilename;

    @JsonIgnore
    @Column(name = "flyer_data")
    public byte[] flyerData;

    @JsonIgnore
    @Column(name = "flyer_content_type")
    public String flyerContentType;

    @JsonIgnore
    @Column(name = "flyer_filename")
    public String flyerFilename;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    @JsonProperty("hasLogo")
    public boolean hasLogo() {
        return logoData != null && logoData.length > 0;
    }

    @JsonProperty("hasFlyer")
    public boolean hasFlyer() {
        return flyerData != null && flyerData.length > 0;
    }

    public static List<Event> listForAdmin(long adminId) {
        return list("adminId = ?1 order by startDate", adminId);
    }

    public static Event findOwnedById(long id, long adminId) {
        return find("id = ?1 and adminId = ?2", id, adminId).firstResult();
    }

    public static Event findByPublicToken(String token) {
        return find("publicToken", token).firstResult();
    }

    private static final String TOKEN_CHARS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    public static String generatePublicToken() {
        var random = new java.security.SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(TOKEN_CHARS.charAt(random.nextInt(TOKEN_CHARS.length())));
        }
        return sb.toString();
    }
}
