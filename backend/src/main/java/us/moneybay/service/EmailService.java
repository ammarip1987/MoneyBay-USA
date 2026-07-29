package us.moneybay.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:1100}")
    private String frontendUrl;

    @Value("${app.mail.from:no-reply@moneybay.us}")
    private String fromAddress;

    @Value("${app.mail.from-name:MoneyBay}")
    private String fromName;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Async
    public void sendVerificationEmail(String to, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        String subject = "Verify your MoneyBay email";
        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #002f34;">Welcome to MoneyBay</h2>
              <p>Click the button below to verify your email address:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background: #3d7ebf; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
              </p>
              <p>Or copy this link: <br><a href="%s">%s</a></p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #6b7280; font-size: 12px;">MoneyBay LLC. All rights reserved.</p>
            </div>
            """.formatted(link, link, link);
        send(to, subject, html);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String subject = "Reset your MoneyBay password";
        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #002f34;">Password Reset Request</h2>
              <p>Click the button below to reset your password. This link expires in 1 hour.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background: #3d7ebf; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
              </p>
              <p>Or copy this link: <br><a href="%s">%s</a></p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, ignore this email. Your password will not change.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #6b7280; font-size: 12px;">MoneyBay LLC. All rights reserved.</p>
            </div>
            """.formatted(link, link, link);
        send(to, subject, html);
    }

    @Async
    public void sendNewMessageNotification(String to, String fromUser) {
        String link = frontendUrl + "/messages";
        String subject = "New message on MoneyBay from " + fromUser;
        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #002f34;">New Message</h2>
              <p>You have a new message from <strong>%s</strong>.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background: #3d7ebf; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Message</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #6b7280; font-size: 12px;">MoneyBay LLC. Unsubscribe from notifications in your profile settings.</p>
            </div>
            """.formatted(fromUser, link);
        send(to, subject, html);
    }

    private void send(String to, String subject, String htmlBody) {
        if (!mailEnabled || mailSender == null) {
            log.info("[EmailService] (disabled) To: {} | Subject: {}", to, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("[EmailService] Sent email to {} | Subject: {}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("[EmailService] Failed to send email to {} | Subject: {} | Error: {}",
                to, subject, e.getMessage());
        } catch (Exception e) {
            log.error("[EmailService] Unexpected error sending email to {} | Subject: {} | Error: {}",
                to, subject, e.getMessage(), e);
        }
    }
}
