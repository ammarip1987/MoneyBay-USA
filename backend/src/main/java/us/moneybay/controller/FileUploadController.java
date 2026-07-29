package us.moneybay.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/uploads")
public class FileUploadController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("files") MultipartFile[] files, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        Path uploadPath = Paths.get(uploadDir);
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to create upload directory"));
        }

        List<String> filenames = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String original = Optional.ofNullable(file.getOriginalFilename()).orElse("file");
            String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
            String filename = UUID.randomUUID() + ext;
            try {
                Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                filenames.add(filename);
            } catch (IOException e) {
                return ResponseEntity.status(500).body(Map.of("message", "Failed to save file"));
            }
        }
        return ResponseEntity.ok(Map.of("filenames", filenames));
    }

    @PostMapping("/photos/upload")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        if (file.isEmpty()) return ResponseEntity.status(400).body(Map.of("message", "File is empty"));

        Path uploadPath = Paths.get(uploadDir);
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to create upload directory"));
        }

        String original = Optional.ofNullable(file.getOriginalFilename()).orElse("photo");
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String filename = UUID.randomUUID() + ext;
        try {
            Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(filename);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to save file"));
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serve(@PathVariable String filename) {
        try {
            Path file = Paths.get(uploadDir).resolve(filename).normalize();
            if (!file.startsWith(Paths.get(uploadDir).normalize())) {
                return ResponseEntity.status(403).build();
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();
            String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase() : "";
            MediaType type = switch (ext) {
                case "png" -> MediaType.IMAGE_PNG;
                case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
                case "gif" -> MediaType.IMAGE_GIF;
                case "webp" -> MediaType.valueOf("image/webp");
                default -> MediaType.APPLICATION_OCTET_STREAM;
            };
            return ResponseEntity.ok().contentType(type).body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
