package com.lostfound.backend.events;

import jakarta.persistence.*;

@Entity
@Table(name = "club_accounts", uniqueConstraints = {
    @UniqueConstraint(name = "uk_club_role", columnNames = {"club_name", "role"}),
    @UniqueConstraint(name = "uk_registration_number", columnNames = {"registration_number"})
})
public class ClubAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "registration_number", nullable = false)
    private String registrationNumber;

    @Column(nullable = false)
    private String email;

    private String phone;
    private String department;
    private String yearOfStudy;

    @Column(name = "club_name", nullable = false)
    private String clubName;

    @Column(nullable = false)
    private String role;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "session_token", length = 80)
    private String sessionToken;

    public ClubAccount() {}
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String value) { fullName = value; }
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String value) { registrationNumber = value; }
    public String getEmail() { return email; }
    public void setEmail(String value) { email = value; }
    public String getPhone() { return phone; }
    public void setPhone(String value) { phone = value; }
    public String getDepartment() { return department; }
    public void setDepartment(String value) { department = value; }
    public String getYearOfStudy() { return yearOfStudy; }
    public void setYearOfStudy(String value) { yearOfStudy = value; }
    public String getClubName() { return clubName; }
    public void setClubName(String value) { clubName = value; }
    public String getRole() { return role; }
    public void setRole(String value) { role = value; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String value) { passwordHash = value; }
    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String value) { sessionToken = value; }
}
