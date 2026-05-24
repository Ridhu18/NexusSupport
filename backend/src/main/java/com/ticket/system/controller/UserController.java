package com.ticket.system.controller;

import com.ticket.system.dto.RegisterRequest;
import com.ticket.system.dto.UserResponse;
import com.ticket.system.model.Role;
import com.ticket.system.model.User;
import com.ticket.system.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ADMIN only endpoints (secured via SecurityConfig matcher "/api/admin/**")
    
    @GetMapping("/api/admin/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/api/admin/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody RegisterRequest request) {
        // Enforce registration through admin panel
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PutMapping("/api/admin/users/{id}/role")
    public ResponseEntity<UserResponse> updateRole(@PathVariable Long id, @RequestParam Role role) {
        return ResponseEntity.ok(userService.updateUserRole(id, role));
    }

    @DeleteMapping("/api/admin/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // Shared endpoints (secured via ".anyRequest().authenticated()")

    @GetMapping("/api/users/agents")
    public ResponseEntity<List<UserResponse>> getSupportAgents(@AuthenticationPrincipal User user) {
        // Enforce that only ADMIN or SUPPORT_AGENT can see agent listing
        if (user.getRole() == Role.USER) {
            throw new AccessDeniedException("Regular users cannot view the agent list.");
        }
        return ResponseEntity.ok(userService.getUsersByRole(Role.SUPPORT_AGENT));
    }
}
