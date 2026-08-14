package us.moneybay.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.model.ListingFlag;
import us.moneybay.model.User;
import us.moneybay.service.FlagListingService;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
public class FlagController {

    @Autowired
    private FlagListingService flagService;

    @PostMapping("/{id}/flag")
    public ResponseEntity<?> flagListing(
            @PathVariable Long id,
            @RequestParam String reason,
            @RequestParam(required = false) String description,
            Authentication auth) {
        
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        try {
            User user = (User) auth.getPrincipal();

            ListingFlag.FlagReason flagReason = ListingFlag.FlagReason.valueOf(reason.toUpperCase());
            ListingFlag flag = flagService.flagListing(id, user, flagReason, description);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                    "id", flag.getId(),
                    "message", "Listing flagged successfully",
                    "status", "OPEN"
                ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to flag listing"));
        }
    }

    @PostMapping("/{id}/flag/resolve")
    public ResponseEntity<?> resolveFlagged(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null || !(auth.getPrincipal() instanceof User admin) || !admin.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin required"));
        }
        try {
            flagService.resolveFlaggedListing(id, admin.getEmail());
            return ResponseEntity.ok(Map.of("message", "Flags resolved"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
