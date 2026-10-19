package com.lostfound.backend.events;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/club-accounts")
@CrossOrigin(origins = "http://localhost:5173")
public class ClubAccountController {
    private final ClubAccountRepository accounts;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();

    public ClubAccountController(ClubAccountRepository accounts) {
        this.accounts = accounts;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String fullName = clean(body.get("fullName"));
        String registrationNumber = clean(body.get("registrationNumber")).toUpperCase(Locale.ROOT);
        String email = clean(body.get("email"));
        String phone = clean(body.get("phone"));
        String department = clean(body.get("department"));
        String yearOfStudy = clean(body.get("yearOfStudy"));
        String clubName = clean(body.get("clubName")).toLowerCase(Locale.ROOT);
        String role = clean(body.get("role")).toUpperCase(Locale.ROOT);
        String password = body.getOrDefault("password", "");

        if (fullName.isBlank() || registrationNumber.isBlank() || email.isBlank()
                || clubName.isBlank() || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message",
                "Fill in all required fields. Password must contain at least 8 characters."));
        }
        if (!role.equals("COORDINATOR") && !role.equals("SUB_COORDINATOR")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Choose a valid club role."));
        }
        if (accounts.existsByRegistrationNumberIgnoreCase(registrationNumber)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message",
                "An account already exists for this registration number."));
        }
        if (accounts.existsByClubNameIgnoreCaseAndRole(clubName, role)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message",
                "This club's " + roleLabel(role) + " position is already filled."));
        }

        ClubAccount account = new ClubAccount();
        account.setFullName(fullName);
        account.setRegistrationNumber(registrationNumber);
        account.setEmail(email);
        account.setPhone(phone);
        account.setDepartment(department);
        account.setYearOfStudy(yearOfStudy);
        account.setClubName(clubName);
        account.setRole(role);
        account.setPasswordHash(passwordEncoder.encode(password));
        account.setSessionToken(newToken());
        try {
            ClubAccount saved = accounts.saveAndFlush(account);
            return ResponseEntity.status(HttpStatus.CREATED).body(accountResponse(saved));
        } catch (org.springframework.dao.DataIntegrityViolationException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message",
                "That registration number or club role has just been registered. Please try another role or club."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String registrationNumber = clean(body.get("registrationNumber")).toUpperCase(Locale.ROOT);
        String password = body.getOrDefault("password", "");
        var account = accounts.findByRegistrationNumberIgnoreCase(registrationNumber);
        if (account.isEmpty() || !passwordEncoder.matches(password, account.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message",
                "Incorrect registration number or password."));
        }
        ClubAccount signedIn = account.get();
        signedIn.setSessionToken(newToken());
        accounts.save(signedIn);
        return ResponseEntity.ok(accountResponse(signedIn));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return currentAccount(authorization)
            .<ResponseEntity<?>>map(account -> ResponseEntity.ok(accountResponse(account)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Please log in again.")));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(@RequestHeader(value = "Authorization", required = false) String authorization) {
        var account = currentAccount(authorization);
        if (account.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Please log in again."));
        }
        accounts.delete(account.get());
        return ResponseEntity.ok(Map.of("message", "Account deleted. The club role is available for sign-up again."));
    }

    private java.util.Optional<ClubAccount> currentAccount(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return java.util.Optional.empty();
        return accounts.findBySessionToken(authorization.substring(7).trim());
    }

    private Map<String, Object> accountResponse(ClubAccount account) {
        return Map.of(
            "id", account.getId(),
            "fullName", account.getFullName(),
            "registrationNumber", account.getRegistrationNumber(),
            "email", account.getEmail(),
            "clubName", account.getClubName(),
            "role", account.getRole(),
            "token", account.getSessionToken()
        );
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String clean(String value) { return value == null ? "" : value.trim(); }
    private String roleLabel(String role) { return role.equals("COORDINATOR") ? "Club Coordinator" : "Sub Coordinator"; }
}
