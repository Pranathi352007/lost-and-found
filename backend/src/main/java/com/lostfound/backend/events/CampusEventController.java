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
    private final EventRegistrationRepository registrations;

    public CampusEventController(CampusEventRepository events, ClubAccountRepository accounts, EventRegistrationRepository registrations) {
        this.events = events; this.accounts = accounts; this.registrations = registrations;
    }

    @GetMapping public List<CampusEvent> getEvents() { return events.findAll(); }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestHeader(value="Authorization", required=false) String authorization, @RequestBody Map<String,String> body) {
        Optional<ClubAccount> account = currentAccount(authorization);
        if (account.isEmpty()) return unauthorized();
        CampusEvent event = new CampusEvent();
        ResponseEntity<?> validation = applyBody(event, body);
        if (validation != null) return validation;
        event.setClubName(account.get().getClubName()); event.setCreatedBy(account.get().getFullName());
        return ResponseEntity.status(HttpStatus.CREATED).body(events.save(event));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestHeader(value="Authorization", required=false) String authorization, @RequestBody Map<String,String> body) {
        Optional<ClubAccount> account = currentAccount(authorization);
        if (account.isEmpty()) return unauthorized();
        var found = events.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        CampusEvent event = found.get();
        if (!owns(account.get(), event)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message","Only the club account that created this event can edit it."));
        ResponseEntity<?> validation = applyBody(event, body);
        if (validation != null) return validation;
        return ResponseEntity.ok(events.save(event));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, @RequestHeader(value="Authorization", required=false) String authorization) {
        Optional<ClubAccount> account = currentAccount(authorization);
        if (account.isEmpty()) return unauthorized();
        var found = events.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        if (!owns(account.get(), found.get())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message","Only the club account that created this event can cancel it."));
        registrations.deleteByEventId(id);
        events.delete(found.get());
        return ResponseEntity.ok(Map.of("message","Event cancelled."));
    }

    @PostMapping("/{id}/registrations")
    public ResponseEntity<?> register(@PathVariable Long id, @RequestBody Map<String,String> body) {
        if (events.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        String name = clean(body.get("studentName"));
        String regNo = clean(body.get("registrationNumber")).toUpperCase(java.util.Locale.ROOT);
        if (name.isBlank() || regNo.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","Name and registration number are required."));
        if (registrations.existsByEventIdAndRegistrationNumberIgnoreCase(id, regNo)) return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message","You are already registered for this event."));
        EventRegistration registration = new EventRegistration();
        registration.setEventId(id); registration.setStudentName(name); registration.setRegistrationNumber(regNo);
        registrations.save(registration);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message","Registration successful."));
    }

    private ResponseEntity<?> applyBody(CampusEvent event, Map<String,String> body) {
        String title = clean(body.get("title"));
        if (title.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","Event title is required."));
        event.setTitle(title); event.setDescription(clean(body.get("description"))); event.setVenue(clean(body.get("venue")));
        event.setRegistrationUrl(clean(body.get("registrationUrl"))); event.setCategory(clean(body.getOrDefault("category","OTHER")));
        event.setPosterUrl(clean(body.get("posterUrl")));
        String date = clean(body.get("eventDateTime"));
        if (!date.isBlank()) { try { event.setEventDateTime(LocalDateTime.parse(date)); } catch(Exception e) { return ResponseEntity.badRequest().body(Map.of("message","Enter a valid event date and time.")); } }
        else event.setEventDateTime(null);
        return null;
    }
    private boolean owns(ClubAccount account, CampusEvent event) { return account.getClubName().equalsIgnoreCase(event.getClubName()) && account.getFullName().equals(event.getCreatedBy()); }
    private Optional<ClubAccount> currentAccount(String authorization) { if (authorization == null || !authorization.startsWith("Bearer ")) return Optional.empty(); return accounts.findBySessionToken(authorization.substring(7).trim()); }
    private ResponseEntity<?> unauthorized() { return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message","Log in as a club coordinator first.")); }
    private String clean(String value) { return value == null ? "" : value.trim(); }
}
