package com.lostfound.backend.events;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CampusEventRepository extends JpaRepository<CampusEvent, Long> {
}
