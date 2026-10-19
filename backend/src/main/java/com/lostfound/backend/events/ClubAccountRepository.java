package com.lostfound.backend.events;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClubAccountRepository extends JpaRepository<ClubAccount, Long> {
    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);
    boolean existsByClubNameIgnoreCaseAndRole(String clubName, String role);
    Optional<ClubAccount> findByRegistrationNumberIgnoreCase(String registrationNumber);
    Optional<ClubAccount> findBySessionToken(String sessionToken);
}
