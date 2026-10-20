package com.lostfound.backend.events;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campus_events")
public class CampusEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String title;
    @Column(length = 2000)
    private String description;
    private String venue;
    private LocalDateTime eventDateTime;
    private String registrationUrl;
    private String category = "OTHER";
    @Column(length = 1200000)
    private String posterUrl;
    private String clubName;
    private String createdBy;

    public CampusEvent() {}
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String value) { title = value; }
    public String getDescription() { return description; }
    public void setDescription(String value) { description = value; }
    public String getVenue() { return venue; }
    public void setVenue(String value) { venue = value; }
    public LocalDateTime getEventDateTime() { return eventDateTime; }
    public void setEventDateTime(LocalDateTime value) { eventDateTime = value; }
    public String getCategory() { return category; }
    public void setCategory(String value) { category = value; }
    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String value) { posterUrl = value; }
    public String getRegistrationUrl() { return registrationUrl; }
    public void setRegistrationUrl(String value) { registrationUrl = value; }
    public String getClubName() { return clubName; }
    public void setClubName(String value) { clubName = value; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String value) { createdBy = value; }
}
