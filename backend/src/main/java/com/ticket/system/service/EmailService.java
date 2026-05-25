package com.ticket.system.service;

import com.ticket.system.model.Ticket;
import com.ticket.system.model.User;
import com.ticket.system.model.Status;
import com.ticket.system.model.Priority;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private static final String APP_URL = "http://localhost:3000";

    /**
     * Dispatch HTML Email notification. Falls back to writing to local directory
     * for previewing if SMTP is not configured.
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent, String ticketId, String eventName) {
        log.info("=========================================");
        log.info("📧 [EMAIL NOTIFICATION DISPATCH] | Event: {}", eventName);
        log.info("To: {}", to);
        log.info("Subject: {}", subject);
        log.info("=========================================");

        // Write HTML to local directory for visual inspection and local development support
        try {
            Path emailsDir = Paths.get("d:/ticketing-system/uploads/emails");
            if (!Files.exists(emailsDir)) {
                Files.createDirectories(emailsDir);
            }
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = String.format("ticket_%s_%s_%s.html", ticketId, eventName, timestamp);
            Path filePath = emailsDir.resolve(fileName);
            Files.writeString(filePath, htmlContent);
            log.info("👉 [LOCAL PREVIEW GENERATED]: file:///d:/ticketing-system/uploads/emails/{}", fileName);
        } catch (Exception e) {
            log.warn("Could not save email preview file to disk: {}", e.getMessage());
        }

        if (mailSender == null) {
            log.info("SMTP JavaMailSender is not configured. Log HTML mode active.");
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true sets Content-Type to text/html
            mailSender.send(mimeMessage);
            log.info("HTML Email sent successfully via SMTP!");
        } catch (Exception e) {
            log.error("SMTP HTML dispatch failed ({}). Fallback preview was generated successfully.", e.getMessage());
        }
    }

    // ----------------------------------------------------
    // SEMANTIC TRIGGERS
    // ----------------------------------------------------

    public void sendTicketCreatedEmail(User creator, Ticket ticket) {
        String greeting = creator.getUsername();
        String subject = "Support Ticket Raised: #" + ticket.getId() + " - " + ticket.getSubject();
        String lead = "Your support ticket has been successfully raised in the NexusSupport platform. Our team will assign a support specialist to review it shortly.";
        
        String htmlBody = buildHtmlTemplate(
            greeting,
            lead,
            "#3b82f6", // Cyber Blue
            String.valueOf(ticket.getId()),
            ticket.getSubject(),
            ticket.getStatus(),
            ticket.getPriority(),
            ticket.getAssignee(),
            "Description of the Ticket",
            ticket.getDescription()
        );

        sendHtmlEmail(creator.getEmail(), subject, htmlBody, String.valueOf(ticket.getId()), "created");
    }

    public void sendTicketAssignedToAgentEmail(User agent, Ticket ticket) {
        String greeting = agent.getUsername();
        String subject = "Ticket Assigned to You: #" + ticket.getId() + " - " + ticket.getSubject();
        String lead = "A support ticket has been assigned to you for resolution. Please check the ticket details below and begin your investigation.";

        String htmlBody = buildHtmlTemplate(
            greeting,
            lead,
            "#06b6d4", // Cyber Cyan
            String.valueOf(ticket.getId()),
            ticket.getSubject(),
            ticket.getStatus(),
            ticket.getPriority(),
            agent,
            "Description of the Ticket",
            ticket.getDescription()
        );

        sendHtmlEmail(agent.getEmail(), subject, htmlBody, String.valueOf(ticket.getId()), "assigned_agent");
    }

    public void sendTicketAssignedToCreatorEmail(User creator, User agent, Ticket ticket) {
        String greeting = creator.getUsername();
        String subject = "Support Agent Assigned: Ticket #" + ticket.getId();
        String lead = "A support specialist has been assigned to your ticket and has started reviewing your request. We will update you as soon as progress is made.";
        String agentName = agent != null ? agent.getUsername() : "Unassigned";

        String htmlBody = buildHtmlTemplate(
            greeting,
            lead,
            "#06b6d4", // Cyber Cyan
            String.valueOf(ticket.getId()),
            ticket.getSubject(),
            ticket.getStatus(),
            ticket.getPriority(),
            agent,
            "Updates",
            "Support Agent **" + agentName + "** has been assigned to look into your ticket."
        );

        sendHtmlEmail(creator.getEmail(), subject, htmlBody, String.valueOf(ticket.getId()), "assigned_creator");
    }

    public void sendTicketStatusChangedEmail(User creator, Ticket ticket, Status oldStatus) {
        String greeting = creator.getUsername();
        String subject = "Update on Ticket #" + ticket.getId() + ": Status is now " + ticket.getStatus().name();
        
        String lead = "The status of your support ticket has been updated from **" + oldStatus.name() + "** to **" + ticket.getStatus().name() + "**.";
        
        String accentColor = "#3b82f6"; // Blue default
        String noteTitle = null;
        String noteBody = null;

        if (ticket.getStatus() == Status.RESOLVED) {
            accentColor = "#10b981"; // Emerald Green
            lead = "Excellent news! Your support ticket has been marked as **RESOLVED** by our support specialist.";
            noteTitle = "Resolution Confirmation Required";
            noteBody = "Please log in to your account to confirm the resolution. You can also rate the quality of service and leave feedback to help us improve.";
        } else if (ticket.getStatus() == Status.CLOSED) {
            accentColor = "#6b7280"; // Gray
            lead = "Your support ticket has been marked as **CLOSED**.";
            noteTitle = "Ticket Closed";
            noteBody = "This ticket has been officially closed. If you require further assistance with this or a new issue, please raise a new support ticket.";
        } else if (ticket.getStatus() == Status.IN_PROGRESS) {
            accentColor = "#8b5cf6"; // Purple
        }

        String htmlBody = buildHtmlTemplate(
            greeting,
            lead,
            accentColor,
            String.valueOf(ticket.getId()),
            ticket.getSubject(),
            ticket.getStatus(),
            ticket.getPriority(),
            ticket.getAssignee(),
            noteTitle,
            noteBody
        );

        sendHtmlEmail(creator.getEmail(), subject, htmlBody, String.valueOf(ticket.getId()), "status_" + ticket.getStatus().name().toLowerCase());
    }

    public void sendNewCommentEmail(User recipient, User commenter, Ticket ticket, String commentText) {
        String greeting = recipient.getUsername();
        String subject = "New Comment on Ticket #" + ticket.getId() + " - " + ticket.getSubject();
        String lead = "A new message was added to the discussion thread on your ticket by **" + commenter.getUsername() + "** (" + commenter.getRole().name() + "):";

        String htmlBody = buildHtmlTemplate(
            greeting,
            lead,
            "#3b82f6", // Cyber Blue
            String.valueOf(ticket.getId()),
            ticket.getSubject(),
            ticket.getStatus(),
            ticket.getPriority(),
            ticket.getAssignee(),
            "Message Content",
            "\"" + commentText + "\""
        );

        sendHtmlEmail(recipient.getEmail(), subject, htmlBody, String.valueOf(ticket.getId()), "comment");
    }

    // ----------------------------------------------------
    // EMAIL HTML TEMPLATE BUILDER
    // ----------------------------------------------------

    private String buildHtmlTemplate(
            String greeting,
            String leadMessage,
            String accentColorHex,
            String ticketId,
            String subject,
            Status status,
            Priority priority,
            User assignee,
            String additionalTitle,
            String additionalBody) {

        // Badge styling for status
        String statusBg = "#3b82f6";
        if (status == Status.IN_PROGRESS) statusBg = "#8b5cf6";
        else if (status == Status.RESOLVED) statusBg = "#10b981";
        else if (status == Status.CLOSED) statusBg = "#6b7280";

        // Badge styling for priority
        String priorityBg = "#10b981"; // Low
        if (priority == Priority.MEDIUM) priorityBg = "#f59e0b"; // Amber
        else if (priority == Priority.HIGH) priorityBg = "#f97316"; // Orange
        else if (priority == Priority.URGENT) priorityBg = "#ef4444"; // Red

        String assigneeName = assignee != null ? assignee.getUsername() : "Unassigned";

        // Build optional section
        String additionalSection = "";
        if (additionalTitle != null && additionalBody != null && !additionalBody.isBlank()) {
            additionalSection = 
                "<tr>" +
                "  <td style='padding: 24px 0 12px 0;'>" +
                "    <h4 style=\"font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 10px 0;\">" + additionalTitle + "</h4>" +
                "    <div style=\"background-color: rgba(255, 255, 255, 0.02); border-left: 3px solid " + accentColorHex + "; padding: 16px 20px; border-radius: 0 8px 8px 0; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 22px; color: #d1d5db; font-style: italic;\">" +
                        additionalBody.replace("\n", "<br/>") +
                "    </div>" +
                "  </td>" +
                "</tr>";
        }

        String ticketUrl = APP_URL + "/tickets/" + ticketId;

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='utf-8'>" +
                "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "  <title>" + subject + "</title>" +
                "  <style>" +
                "    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@500;600;700&display=swap');" +
                "    body { margin: 0; padding: 0; background-color: #0b0f19; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; }" +
                "    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }" +
                "    a { text-decoration: none; }" +
                "  </style>" +
                "</head>" +
                "<body style=\"background-color: #0b0f19; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 10px; color: #f3f4f6;\">" +
                "  <table width='100%' cellpadding='0' cellspacing='0' border='0'>" +
                "    <tr>" +
                "      <td align='center'>" +
                "        <table width='100%' max-width='600' style='max-width: 600px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);' cellpadding='0' cellspacing='0' border='0'>" +
                "          <!-- Accent Bar -->" +
                "          <tr>" +
                "            <td height='6' style='background-color: " + accentColorHex + "; line-height: 6px; font-size: 1px;'>&nbsp;</td>" +
                "          </tr>" +
                "          " +
                "          <!-- Content -->" +
                "          <tr>" +
                "            <td style='padding: 36px 32px 28px 32px;'>" +
                "              <!-- Brand Header -->" +
                "              <table width='100%' cellpadding='0' cellspacing='0'>" +
                "                <tr>" +
                "                  <td>" +
                "                    <h2 style=\"font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 4px 0;\">NexusSupport</h2>" +
                "                    <div style=\"font-size: 11px; color: #6b7280; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 24px 0;\">Ticketing Platform</div>" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "              " +
                "              <!-- Greeting & Main Message -->" +
                "              <p style=\"font-size: 16px; line-height: 24px; color: #ffffff; margin: 0 0 12px 0; font-weight: 600;\">Hello " + greeting + ",</p>" +
                "              <p style=\"font-size: 15px; line-height: 24px; color: #9ca3af; margin: 0 0 28px 0; font-weight: 400;\">" + leadMessage + "</p>" +
                "              " +
                "              <!-- Ticket Info Box -->" +
                "              <table width='100%' style='background-color: #1f2937; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); padding: 22px;' cellpadding='0' cellspacing='0'>" +
                "                <tr>" +
                "                  <td style='padding-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);'>" +
                "                    <span style=\"font-family: 'Outfit', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff;\">Ticket #" + ticketId + "</span>" +
                "                  </td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td style='padding-top: 16px;'>" +
                "                    <table width='100%' cellpadding='0' cellspacing='0'>" +
                "                      <!-- Subject -->" +
                "                      <tr>" +
                "                        <td width='30%' style=\"font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; padding-bottom: 10px;\">Subject:</td>" +
                "                        <td width='70%' style=\"font-size: 14px; font-weight: 600; color: #ffffff; padding-bottom: 10px;\">" + subject + "</td>" +
                "                      </tr>" +
                "                      <!-- Status -->" +
                "                      <tr>" +
                "                        <td style=\"font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; padding-bottom: 10px;\">Status:</td>" +
                "                        <td style='padding-bottom: 10px;'>" +
                "                          <span style=\"display: inline-block; background-color: " + statusBg + "; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 9999px; letter-spacing: 0.05em;\">" + status.name() + "</span>" +
                "                        </td>" +
                "                      </tr>" +
                "                      <!-- Priority -->" +
                "                      <tr>" +
                "                        <td style=\"font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; padding-bottom: 10px;\">Priority:</td>" +
                "                        <td style='padding-bottom: 10px;'>" +
                "                          <span style=\"display: inline-block; background-color: " + priorityBg + "; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 9999px; letter-spacing: 0.05em;\">" + priority.name() + "</span>" +
                "                        </td>" +
                "                      </tr>" +
                "                      <!-- Assignee -->" +
                "                      <tr>" +
                "                        <td style=\"font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase;\">Assignee:</td>" +
                "                        <td style=\"font-size: 14px; color: #d1d5db; font-weight: 500;\">" + assigneeName + "</td>" +
                "                      </tr>" +
                "                    </table>" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "              " +
                "              <!-- Additional Section (Description/Comment/Custom Details) -->" +
                "              <table width='100%' cellpadding='0' cellspacing='0'>" +
                "                " + additionalSection +
                "              </table>" +
                "              " +
                "              <!-- Call To Action -->" +
                "              <table width='100%' cellpadding='0' cellspacing='0'>" +
                "                <tr>" +
                "                  <td align='center' style='padding-top: 36px;'>" +
                "                    <a href='" + ticketUrl + "' style=\"display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: #ffffff; font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);\">View Ticket on Dashboard</a>" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "            </td>" +
                "          </tr>" +
                "          " +
                "          <!-- Divider -->" +
                "          <tr>" +
                "            <td style='padding: 0 32px;'><div style='border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 1px; line-height: 1px;'>&nbsp;</div></td>" +
                "          </tr>" +
                "          " +
                "          <!-- Footer -->" +
                "          <tr>" +
                "            <td style=\"padding: 24px 32px 36px 32px; font-size: 12px; color: #4b5563; text-align: center; line-height: 18px; font-family: 'Inter', sans-serif;\">" +
                "              This is an automated notification from the NexusSupport Helpdesk platform. Please do not reply directly to this email.<br/>" +
                "              <span style='color: #6b7280; font-weight: 500;'>NexusSupport Inc. &bull; Cyberpark Sector 5, Bangalore</span>" +
                "            </td>" +
                "          </tr>" +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>";
    }
}
