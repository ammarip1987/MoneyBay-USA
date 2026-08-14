package us.moneybay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import us.moneybay.model.User;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private User user;

    @JsonProperty("user")
    public User getUser() {
        return user;
    }
}
