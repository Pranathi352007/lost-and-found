package com.lostfound.backend.events;

import jakarta.persistence.*;

@Entity
@Table(name = "event_registrations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "registration_number"}))
public class EventRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "event_id", nullable = false)
    private Long eventId;
    @Column(nullable = false)
    private String studentName;
    @Column(name = "registration_number", nullable = false)
    private String registrationNumber;

    public EventRegistration() {}
    public Long getId() { return id; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long value) { eventId = value; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String value) { studentName = value; }
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String value) { registrationNumber = value; }
}
