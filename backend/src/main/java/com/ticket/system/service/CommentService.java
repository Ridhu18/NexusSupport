package com.ticket.system.service;

import com.ticket.system.dto.CommentRequest;
import com.ticket.system.dto.CommentResponse;
import com.ticket.system.model.Comment;
import com.ticket.system.model.Role;
import com.ticket.system.model.Ticket;
import com.ticket.system.model.User;
import com.ticket.system.repository.CommentRepository;
import com.ticket.system.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final EmailService emailService;

    @Transactional
    public CommentResponse addComment(Long ticketId, CommentRequest request, User user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        // Permissions check
        if (user.getRole() == Role.USER && !ticket.getCreator().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to comment on this ticket.");
        }

        Comment comment = Comment.builder()
                .ticket(ticket)
                .user(user)
                .commentText(request.getCommentText())
                .createdAt(java.time.LocalDateTime.now())
                .build();

        Comment savedComment = commentRepository.save(comment);

        // Send email notifications
        if (user.getId().equals(ticket.getCreator().getId())) {
            // Creator commented -> notify assignee (agent)
            if (ticket.getAssignee() != null) {
                emailService.sendEmail(
                        ticket.getAssignee().getEmail(),
                        "New Comment on Ticket #" + ticket.getId(),
                        "Hello " + ticket.getAssignee().getUsername() + ",\n\n" +
                        "The ticket creator (" + user.getUsername() + ") left a new comment on Ticket #" + ticket.getId() + ".\n\n" +
                        "Comment:\n\"" + savedComment.getCommentText() + "\""
                );
            }
        } else {
            // Support Agent or Admin commented -> notify creator
            emailService.sendEmail(
                    ticket.getCreator().getEmail(),
                    "New Comment on Ticket #" + ticket.getId(),
                    "Hello " + ticket.getCreator().getUsername() + ",\n\n" +
                    "Support Agent " + user.getUsername() + " left a comment on your Ticket #" + ticket.getId() + ".\n\n" +
                    "Comment:\n\"" + savedComment.getCommentText() + "\""
            );
        }

        return mapToCommentResponse(savedComment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByTicketId(Long ticketId, User user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        // Permissions check
        if (user.getRole() == Role.USER && !ticket.getCreator().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view comments for this ticket.");
        }

        List<Comment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        return comments.stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse mapToCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getUsername())
                .userRole(comment.getUser().getRole())
                .commentText(comment.getCommentText())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
