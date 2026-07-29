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

    public String uploadPhoto(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String extension = "jpg";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".") + 1).replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        }
        String fileName = UUID.randomUUID().toString() + "." + extension;

        try {
            log.info("Uploading file to R2: {}", fileName);
            log.debug("Bucket: {}, Endpoint: {}", bucketName, endpoint);

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
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
