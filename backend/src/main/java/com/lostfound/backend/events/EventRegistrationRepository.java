package com.lostfound.backend.events;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    boolean existsByEventIdAndRegistrationNumberIgnoreCase(Long eventId, String registrationNumber);
    void deleteByEventId(Long eventId);
}
