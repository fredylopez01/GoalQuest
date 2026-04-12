package com.goalquest.identity.config;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "gamification-service")
public interface GamificationClient {

    @PostMapping("/gamification/profile")
    void createGamificationProfile(@RequestBody CreateProfileRequest request);

    @Data
    class CreateProfileRequest {
        private String user_id;

        public CreateProfileRequest(String userId) {
            this.user_id = userId;
        }
    }
}
