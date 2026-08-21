package us.moneybay.service;

import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Приведение аватара к единому виду: обрезка по центру до квадрата и
 * уменьшение. Клиент делает то же самое перед отправкой, но повторяем на
 * сервере — файл может прийти в обход браузера, и тогда в хранилище попал бы
 * снимок произвольного размера.
 *
 * Построено на Thumbnailator — соответствии Intervention Image для Java.
 */
@Service
public class AvatarImageService {

    /** Сторона квадрата в точках. Хватает для показа в профиле и в карточках. */
    private static final int SIDE = 400;

    public MultipartFile toSquare(MultipartFile source) throws IOException {
        BufferedImage image = ImageIO.read(source.getInputStream());
        if (image == null) throw new IOException("Not an image");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(image)
            .crop(Positions.CENTER)
            .size(SIDE, SIDE)
            .outputFormat("jpg")
            .outputQuality(0.85)
            .toOutputStream(out);

        return new InMemoryFile(out.toByteArray(), "avatar.jpg", "image/jpeg");
    }

    /** Обёртка над байтами: R2PhotoService принимает MultipartFile. */
    private record InMemoryFile(byte[] bytes, String name, String type) implements MultipartFile {
        @Override public String getName() { return "file"; }
        @Override public String getOriginalFilename() { return name; }
        @Override public String getContentType() { return type; }
        @Override public boolean isEmpty() { return bytes.length == 0; }
        @Override public long getSize() { return bytes.length; }
        @Override public byte[] getBytes() { return bytes; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(bytes); }
        @Override public void transferTo(java.io.File dest) throws IOException {
            java.nio.file.Files.write(dest.toPath(), bytes);
        }
    }
}
