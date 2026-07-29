package us.moneybay.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
public class R2Config {

    @Value("${aws.r2.accessKeyId:}")
    private String accessKeyId;

    @Value("${aws.r2.secretAccessKey:}")
    private String secretAccessKey;

    @Value("${aws.r2.endpoint:https://6cdba85b64841ba23d899ad6122f7eb9.r2.cloudflarestorage.com}")
    private String endpoint;

    @Bean
    public S3Client s3Client() {
        if (accessKeyId == null || accessKeyId.isBlank() ||
            secretAccessKey == null || secretAccessKey.isBlank()) {
            throw new IllegalArgumentException(
                "R2 credentials not configured. Set AWS_R2_ACCESS_KEY_ID and AWS_R2_SECRET_ACCESS_KEY environment variables or aws.r2.accessKeyId/secretAccessKey in application.properties"
            );
        }

        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKeyId, secretAccessKey);

        return S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.US_EAST_1)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .endpointOverride(URI.create(endpoint))
                .build();
    }
}
