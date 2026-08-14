package us.moneybay.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class R2PhotoService {
    private static final Logger log = LoggerFactory.getLogger(R2PhotoService.class);

    @Autowired
    private S3Client s3Client;

    @Value("${aws.r2.bucketName}")
    private String bucketName;

    @Value("${aws.r2.endpoint}")
    private String endpoint;

    private static final java.util.Map<String, String> ALLOWED_TYPES = java.util.Map.of(
        "image/jpeg", "jpg",
        "image/png", "png",
        "image/webp", "webp",
        "image/gif", "gif"
    );

    public String uploadPhoto(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        String extension = contentType != null ? ALLOWED_TYPES.get(contentType) : null;
        if (extension == null) {
            throw new IOException("Unsupported file type: " + contentType + ". Allowed: JPEG, PNG, WebP, GIF");
        }
        String fileName = UUID.randomUUID().toString() + "." + extension;

        try {
            log.info("Uploading file to R2: {}", fileName);
            log.debug("Bucket: {}, Endpoint: {}", bucketName, endpoint);

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(
                    file.getInputStream(),
                    file.getSize()
            ));

            String url = "/api/photos/" + fileName;
            log.info("File uploaded to R2: {}", fileName);
            log.info("Local URL: {}", url);
            return url;
        } catch (Exception e) {
            log.error("Failed to upload file to R2: {}", fileName, e);
            throw new IOException("Failed to upload file to R2: " + e.getMessage(), e);
        }
    }
}
