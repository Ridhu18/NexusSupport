package com.ticket.system.dto;

import com.ticket.system.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long ticketId;
    private Long userId;
    private String username;
    private Role userRole;
    private String commentText;
    private LocalDateTime createdAt;
}
