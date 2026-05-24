package com.ticket.system.service;

import com.ticket.system.dto.TicketRequest;
import com.ticket.system.dto.TicketResponse;
import com.ticket.system.model.*;
import com.ticket.system.repository.TicketRepository;
import com.ticket.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public TicketResponse createTicket(TicketRequest request, User creator) {
        Ticket ticket = Ticket.builder()
                .subject(request.getSubject())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(Status.OPEN)
                .creator(creator)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        
        // Notify creator
        emailService.sendEmail(
                creator.getEmail(),
                "Support Ticket Raised: #" + savedTicket.getId(),
                "Hello " + creator.getUsername() + ",\n\nYour ticket has been raised successfully.\n\n" +
                "Subject: " + savedTicket.getSubject() + "\n" +
                "Priority: " + savedTicket.getPriority().name() + "\n" +
                "Status: OPEN\n\nWe will assign a support agent shortly."
        );

        return mapToTicketResponse(savedTicket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsForUser(User user, Status status, Priority priority, String search) {
        Long creatorId = null;
        Long assigneeId = null;

        if (user.getRole() == Role.USER) {
            creatorId = user.getId();
        }

        List<Ticket> tickets = ticketRepository.searchTickets(creatorId, assigneeId, status, priority, search);
        return tickets.stream()
                .map(this::mapToTicketResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long ticketId, User user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + ticketId));

        // Security check: Standard users can only view their own tickets
        if (user.getRole() == Role.USER && !ticket.getCreator().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view this ticket");
        }

        return mapToTicketResponse(ticket);
    }

    @Transactional
    public TicketResponse updateTicketStatus(Long ticketId, Status newStatus, User user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isAgent = user.getRole() == Role.SUPPORT_AGENT;
        boolean isCreator = ticket.getCreator().getId().equals(user.getId());

        // Authorization checks
        if (user.getRole() == Role.USER) {
            // Creators can only close their own tickets
            if (isCreator && newStatus == Status.CLOSED) {
                ticket.setStatus(Status.CLOSED);
            } else {
                throw new AccessDeniedException("Standard users can only close their own tickets.");
            }
        } else if (isAgent) {
            // Agents can change status if they are assigned or if the ticket is open
            if (ticket.getAssignee() != null && !ticket.getAssignee().getId().equals(user.getId())) {
                throw new AccessDeniedException("You are not the assigned agent for this ticket.");
            }
            ticket.setStatus(newStatus);
        } else if (isAdmin) {
            // Admin overrides all
            ticket.setStatus(newStatus);
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        // Notify user about status change
        emailService.sendEmail(
                updatedTicket.getCreator().getEmail(),
                "Update on Ticket #" + updatedTicket.getId() + ": Status is now " + updatedTicket.getStatus().name(),
                "Hello " + updatedTicket.getCreator().getUsername() + ",\n\n" +
                "The status of your ticket #" + updatedTicket.getId() + " has been updated to: " + updatedTicket.getStatus().name() + ".\n\n" +
                "Subject: " + updatedTicket.getSubject()
        );

        return mapToTicketResponse(updatedTicket);
    }

    @Transactional
    public TicketResponse assignTicket(Long ticketId, Long agentId, User user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        // Only Admin or Support Agent can trigger assignment
        if (user.getRole() == Role.USER) {
            throw new AccessDeniedException("Regular users cannot assign tickets.");
        }

        User agent = null;
        if (agentId != null) {
            agent = userRepository.findById(agentId)
                    .orElseThrow(() -> new IllegalArgumentException("Assigned agent not found"));
            if (agent.getRole() != Role.SUPPORT_AGENT) {
                throw new IllegalArgumentException("Target user must be a Support Agent");
            }
        }

        // Support Agent can only assign to themselves
        if (user.getRole() == Role.SUPPORT_AGENT && agent != null && !agent.getId().equals(user.getId())) {
            throw new AccessDeniedException("Support agents can only assign tickets to themselves.");
        }

        ticket.setAssignee(agent);
        // Automatically move to IN_PROGRESS upon assignment if it was OPEN
        if (agent != null && ticket.getStatus() == Status.OPEN) {
            ticket.setStatus(Status.IN_PROGRESS);
        }
        
        Ticket updatedTicket = ticketRepository.save(ticket);

        // Notify both agent and creator
        if (agent != null) {
            emailService.sendEmail(
                    agent.getEmail(),
                    "Ticket Assigned to You: #" + updatedTicket.getId(),
                    "Hello " + agent.getUsername() + ",\n\n" +
                    "Ticket #" + updatedTicket.getId() + " has been assigned to you.\n\n" +
                    "Subject: " + updatedTicket.getSubject() + "\n" +
                    "Priority: " + updatedTicket.getPriority().name()
            );
        }

        emailService.sendEmail(
                updatedTicket.getCreator().getEmail(),
                "Support Agent Assigned: Ticket #" + updatedTicket.getId(),
                "Hello " + updatedTicket.getCreator().getUsername() + ",\n\n" +
                "Support Agent " + (agent != null ? agent.getUsername() : "Unassigned") + " is now looking into your ticket.\n\n" +
                "Subject: " + updatedTicket.getSubject() + "\n" +
                "Status: " + updatedTicket.getStatus().name()
        );

        return mapToTicketResponse(updatedTicket);
    }

    @Transactional
    public TicketResponse rateTicket(Long ticketId, Integer rating, String feedback, User user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        // Only the creator can rate the ticket
        if (!ticket.getCreator().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the ticket creator can rate this resolution.");
        }

        // Ticket must be in RESOLVED or CLOSED status
        if (ticket.getStatus() != Status.RESOLVED && ticket.getStatus() != Status.CLOSED) {
            throw new IllegalArgumentException("Tickets can only be rated after resolution or closure.");
        }

        ticket.setRating(rating);
        ticket.setFeedback(feedback);
        Ticket updatedTicket = ticketRepository.save(ticket);

        return mapToTicketResponse(updatedTicket);
    }

    public TicketResponse mapToTicketResponse(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .creatorId(ticket.getCreator().getId())
                .creatorUsername(ticket.getCreator().getUsername())
                .creatorEmail(ticket.getCreator().getEmail())
                .assigneeId(ticket.getAssignee() != null ? ticket.getAssignee().getId() : null)
                .assigneeUsername(ticket.getAssignee() != null ? ticket.getAssignee().getUsername() : null)
                .assigneeEmail(ticket.getAssignee() != null ? ticket.getAssignee().getEmail() : null)
                .rating(ticket.getRating())
                .feedback(ticket.getFeedback())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
