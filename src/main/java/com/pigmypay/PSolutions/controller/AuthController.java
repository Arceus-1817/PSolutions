package com.pigmypay.PSolutions.controller;

import com.pigmypay.PSolutions.model.User;
import com.pigmypay.PSolutions.repository.UserRepository;
import com.pigmypay.PSolutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin // Don't forget CORS!
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    // We use a Map<String, String> to easily accept a JSON object like {"email": "x", "password": "y"}
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        // 1. Find the user in the database
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // 2. Check if the password matches the encrypted password in the database
            if (passwordEncoder.matches(password, user.getPassword())) {

                // 3. Password matches! Print the token.
                String token = jwtService.generateToken(user);

                // 4. Send back the token AND the user info so React knows who logged in
                return ResponseEntity.ok(Map.of(
                        "token", token,
                        "userId", user.getId(),
                        "name", user.getName(),
                        "role", user.getRole()
                ));
            }
        }

        // If email not found OR password doesn't match, return Unauthorized
        return ResponseEntity.status(401).body("Invalid email or password");
    }
}