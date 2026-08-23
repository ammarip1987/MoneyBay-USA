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
    /**
     * Срок стирания закрытой учётной записи. Пока он стоит, вход работает, но
     * страницы показывают предложение восстановить — иначе передумать было бы
     * нельзя, а месяц ожидания для того и дан.
     */
    private Instant deletionScheduledAt;

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
        dto.deletionScheduledAt = user.getDeletionScheduledAt();
        return dto;
    }
}
