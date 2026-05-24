package com.ticket.system.controller;

import com.ticket.system.dto.TicketRequest;
import com.ticket.system.dto.TicketResponse;
import com.ticket.system.model.Attachment;
import com.ticket.system.model.Priority;
import com.ticket.system.model.Status;
import com.ticket.system.model.User;
import com.ticket.system.repository.AttachmentRepository;
import com.ticket.system.repository.TicketRepository;
import com.ticket.system.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketRepository ticketRepository;
    private final AttachmentRepository attachmentRepository;

    private static final String UPLOAD_DIR = "D:\\ticketing-system\\uploads";

    @PostMapping
    public ResponseEntity<TicketResponse> create(
            @Valid @RequestBody TicketRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ticketService.createTicket(request, user));
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getTickets(
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ticketService.getTicketsForUser(user, status, priority, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ticketService.getTicketById(id, user));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Status status,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, status, user));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assign(
            @PathVariable Long id,
            @RequestParam(required = false) Long agentId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ticketService.assignTicket(id, agentId, user));
    }

    @PostMapping("/{id}/rate")
    public ResponseEntity<TicketResponse> rate(
            @PathVariable Long id,
            @RequestParam Integer rating,
            @RequestParam(required = false) String feedback,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ticketService.rateTicket(id, rating, feedback, user));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<Attachment> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) throws IOException {
        com.ticket.system.model.Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        // Only creator, assigned agent, or admin can upload files
        boolean isCreator = ticket.getCreator().getId().equals(user.getId());
        boolean isAgent = ticket.getAssignee() != null && ticket.getAssignee().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == com.ticket.system.model.Role.ADMIN;

        if (!isCreator && !isAgent && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to upload attachments for this ticket.");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String rawFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (rawFileName != null && rawFileName.contains(".")) {
            fileExtension = rawFileName.substring(rawFileName.lastIndexOf("."));
        }

        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Attachment attachment = Attachment.builder()
                .ticket(ticket)
                .fileName(rawFileName != null ? rawFileName : uniqueFileName)
                .fileType(file.getContentType())
                .filePath(filePath.toString())
                .uploadedAt(java.time.LocalDateTime.now())
                .build();

        return ResponseEntity.ok(attachmentRepository.save(attachment));
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<Attachment>> getAttachments(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        com.ticket.system.model.Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        if (user.getRole() == com.ticket.system.model.Role.USER && !ticket.getCreator().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view attachments for this ticket");
        }

        return ResponseEntity.ok(attachmentRepository.findByTicketId(id));
    }

    @GetMapping("/attachments/download/{id}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) throws MalformedURLException {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        com.ticket.system.model.Ticket ticket = attachment.getTicket();
        if (user.getRole() == com.ticket.system.model.Role.USER && !ticket.getCreator().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to access this attachment");
        }

        Path path = Paths.get(attachment.getFilePath());
        Resource resource = new UrlResource(path.toUri());

        if (resource.exists() || resource.isReadable()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(attachment.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getFileName() + "\"")
                    .body(resource);
        } else {
            throw new IllegalArgumentException("Could not read file");
        }
    }
}
