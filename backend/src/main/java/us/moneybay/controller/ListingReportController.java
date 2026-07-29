package us.moneybay.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.model.Listing;
import us.moneybay.model.ListingReport;
import us.moneybay.model.ListingReport.Reason;
import us.moneybay.model.ListingReport.Status;
import us.moneybay.model.User;
import us.moneybay.repository.ListingReportRepository;
import us.moneybay.repository.ListingRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ListingReportController {

    private static final Logger log = LoggerFactory.getLogger(ListingReportController.class);
    private static final long AUTO_HIDE_THRESHOLD = 3;

    private final ListingRepository listingRepository;
    private final ListingReportRepository reportRepository;

    public ListingReportController(ListingRepository listingRepository,
                                   ListingReportRepository reportRepository) {
        this.listingRepository = listingRepository;
        this.reportRepository = reportRepository;
    }

    @PostMapping("/listings/{id}/report")
    public ResponseEntity<?> report(@PathVariable Long id,
                                    @RequestBody Map<String, String> body,
                                    Authentication auth,
                                    HttpServletRequest request) {
        Listing listing = listingRepository.findById(id).orElse(null);
        if (listing == null || listing.isDeleted()) {
            return ResponseEntity.notFound().build();
        }

        String reasonStr = body.get("reason");
        String details = body.get("details");

        Reason reason;
        try {
            reason = Reason.valueOf(reasonStr == null ? "OTHER" : reasonStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "code", "INVALID_REASON",
                "message", "Invalid report reason"
            ));
        }

        ListingReport rep = new ListingReport();
        rep.setListing(listing);
        rep.setReason(reason);
        rep.setDetails(details);
        rep.setReporterIp(resolveClientIp(request));
        if (auth != null && auth.getPrincipal() instanceof User u) {
            rep.setReporter(u);
        }
        reportRepository.save(rep);

        long openCount = reportRepository.countOpenReportsForListing(id);
        boolean autoHidden = false;
        if (openCount >= AUTO_HIDE_THRESHOLD && !listing.isAutoHidden()) {
            listing.setAutoHidden(true);
            listing.setActive(false);
            listingRepository.save(listing);
            autoHidden = true;
            log.warn("[ListingReport] Auto-hidden listing {} after {} reports", id, openCount);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Thank you. Our team will review this listing.");
        response.put("reports_count", openCount);
        response.put("auto_hidden", autoHidden);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/reports")
    public ResponseEntity<?> listOpenReports(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof User u) || !u.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        }
        return ResponseEntity.ok(reportRepository.findByStatusOrderByCreatedAtDesc(Status.OPEN).stream()
            .map(this::toDto).toList());
    }

    @GetMapping("/admin/listings/{id}/reports")
    public ResponseEntity<?> reportsForListing(@PathVariable Long id, Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof User u) || !u.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        }
        return ResponseEntity.ok(reportRepository.findByListingIdOrderByCreatedAtDesc(id).stream()
            .map(this::toDto).toList());
    }

    @PostMapping("/admin/reports/{reportId}/review")
    public ResponseEntity<?> reviewReport(@PathVariable Long reportId,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof User admin) || !admin.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        }

        ListingReport rep = reportRepository.findById(reportId).orElse(null);
        if (rep == null) return ResponseEntity.notFound().build();

        String resolution = body.getOrDefault("resolution", "DISMISSED").toUpperCase();
        Status newStatus;
        try {
            newStatus = Status.valueOf(resolution);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid resolution"));
        }

        rep.setStatus(newStatus);
        rep.setReviewedBy(admin);
        rep.setReviewedAt(Instant.now());
        rep.setAdminNotes(body.get("notes"));
        reportRepository.save(rep);

        if (newStatus == Status.REVIEWED_VALID) {
            Listing listing = rep.getListing();
            listing.setActive(false);
            listing.setAutoHidden(true);
            listingRepository.save(listing);
        } else if (newStatus == Status.REVIEWED_INVALID && rep.getListing().isAutoHidden()) {
            Listing listing = rep.getListing();
            listing.setActive(true);
            listing.setAutoHidden(false);
            listingRepository.save(listing);
        }

        return ResponseEntity.ok(Map.of("success", true, "status", newStatus));
    }

    private Map<String, Object> toDto(ListingReport r) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", r.getId());
        dto.put("listing_id", r.getListing() != null ? r.getListing().getId() : null);
        dto.put("listing_title", r.getListing() != null ? r.getListing().getTitle() : null);
        dto.put("reporter_id", r.getReporter() != null ? r.getReporter().getId() : null);
        dto.put("reporter_username", r.getReporter() != null ? r.getReporter().getUsername() : null);
        dto.put("reason", r.getReason());
        dto.put("details", r.getDetails());
        dto.put("status", r.getStatus());
        dto.put("admin_notes", r.getAdminNotes());
        dto.put("reviewed_by", r.getReviewedBy() != null ? r.getReviewedBy().getUsername() : null);
        dto.put("reviewed_at", r.getReviewedAt());
        dto.put("created_at", r.getCreatedAt());
        return dto;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp;
        return request.getRemoteAddr();
    }
}
