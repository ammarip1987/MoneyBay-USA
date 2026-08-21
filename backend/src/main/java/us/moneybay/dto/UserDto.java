package us.moneybay.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import us.moneybay.model.User;
import java.time.Instant;

@Data
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String username;
    private String phone;
    private String city;
    private String avatarUrl;
    private boolean showAvatar;
    private boolean isAdmin;
    private Instant createdAt;

    public static UserDto from(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.email = user.getEmail();
        dto.username = user.getUsername();
        dto.phone = user.getPhone();
        dto.city = user.getCity();
        dto.avatarUrl = user.getAvatarUrl();
        dto.showAvatar = user.isShowAvatar();
        dto.isAdmin = user.isAdmin();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }
}
