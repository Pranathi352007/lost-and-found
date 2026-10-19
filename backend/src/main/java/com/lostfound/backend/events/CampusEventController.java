package com.lostfound.backend.events;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:5173")
public class CampusEventController {
    private final CampusEventRepository events;
    private final ClubAccountRepository accounts;

    public CampusEventController(CampusEventRepository events, ClubAccountRepository accounts) {
        this.events = events;
        this.accounts = accounts;
    }

    @GetMapping
    public List<CampusEvent> getEvents() {
        return events.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createEvent(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, String> body) {
        Optional<ClubAccount> account = currentAccount(authorization);
        if (account.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Log in as a club coordinator first."));
        }
        String title = clean(body.get("title"));
        if (title.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Event title is required."));
        }

        CampusEvent event = new CampusEvent();
        event.setTitle(title);
        event.setDescription(clean(body.get("description")));
        event.setVenue(clean(body.get("venue")));
        event.setRegistrationUrl(clean(body.get("registrationUrl")));
        event.setClubName(account.get().getClubName());
        event.setCreatedBy(account.get().getFullName());
        String date = clean(body.get("eventDateTime"));
        if (!date.isBlank()) {
            try {
                event.setEventDateTime(LocalDateTime.parse(date));
            } catch (Exception exception) {
                return ResponseEntity.badRequest().body(Map.of("message", "Enter a valid event date and time."));
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(events.save(event));
    }

    private Optional<ClubAccount> currentAccount(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return Optional.empty();
        return accounts.findBySessionToken(authorization.substring(7).trim());
    }
    private String clean(String value) { return value == null ? "" : value.trim(); }
}
