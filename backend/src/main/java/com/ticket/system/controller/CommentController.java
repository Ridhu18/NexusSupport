package com.ticket.system.controller;

import com.ticket.system.dto.CommentRequest;
import com.ticket.system.dto.CommentResponse;
import com.ticket.system.model.User;
import com.ticket.system.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(commentService.addComment(ticketId, request, user));
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(commentService.getCommentsByTicketId(ticketId, user));
    }
}
