package com.pigmypay.PSolutions.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email; // We will use email to log in

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String phoneNumber;// This will hold the encrypted password

    @Enumerated(EnumType.STRING)
    private Role role; // ADMIN, MANAGER, or AGENT

    // Add these fields to your existing User.java
    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    // ==============================================================
    // Spring Security UserDetails Methods
    // ==============================================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // This translates our Role enum into something Spring Security understands
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email; // Spring uses "username" by default, we are mapping it to our email
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}