package us.moneybay.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import us.moneybay.service.R2PhotoService;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {
    private static final Logger log = LoggerFactory.getLogger(PhotoController.class);

    @Autowired
    private R2PhotoService photoService;

    @Autowired(required = false)
    private S3Client s3Client;

    @Value("${aws.r2.bucketName}")
    private String bucketName;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadPhoto(@RequestParam("file") MultipartFile file) {
        try {
            String photoUrl = photoService.uploadPhoto(file);
            return ResponseEntity.ok(photoUrl);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/{filename}")
    public ResponseEntity<byte[]> getPhoto(@PathVariable String filename) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filename)
                    .build();

            ResponseInputStream<GetObjectResponse> response = s3Client.getObject(getObjectRequest);
            byte[] data = response.readAllBytes();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, response.response().contentType())
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(data.length))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type")
                    .body(data);
        } catch (Exception e) {
            log.error("Failed to get photo: {}", filename, e);
            return ResponseEntity.notFound().build();
        }
    }
}
