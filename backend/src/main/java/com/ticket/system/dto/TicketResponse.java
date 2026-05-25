package com.ticket.system.dto;

import com.ticket.system.model.Priority;
import com.ticket.system.model.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String subject;
    private String description;
    private Priority priority;
    private Status status;
    private Long creatorId;
    private String creatorUsername;
    private String creatorEmail;
    private Long assigneeId;
    private String assigneeUsername;
    private String assigneeEmail;
    private Integer rating;
    private String feedback;
    private Instant createdAt;
    private Instant updatedAt;
}
