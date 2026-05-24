package com.ticket.system.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        log.info("=========================================");
        log.info("📧 [EMAIL NOTIFICATION DISPATCH]");
        log.info("To: {}", to);
        log.info("Subject: {}", subject);
        log.info("Body:\n{}", body);
        log.info("=========================================");
        
        if (mailSender == null) {
            log.info("SMTP JavaMailSender is not configured in properties. Log mode active.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent successfully via SMTP!");
        } catch (Exception e) {
            log.error("SMTP sending failed ({}). Log fallback succeeded.", e.getMessage());
        }
    }
}
