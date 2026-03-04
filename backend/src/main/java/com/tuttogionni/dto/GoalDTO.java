package com.tuttogionni.dto;

import com.tuttogionni.model.GoalCategory;
import com.tuttogionni.model.GoalFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotNull(message = "Category is required")
    private GoalCategory category;

    @NotNull(message = "Frequency is required")
    private GoalFrequency frequency;

    private List<String> frequencyConfig;

    private LocalTime scheduledTime;

    private String color;

    private String icon;

    private Boolean active;

    private String preconfiguredKey;

    public String getFrequencyConfigAsString() {
        if (frequencyConfig == null || frequencyConfig.isEmpty()) {
            return null;
        }
        return String.join(",", frequencyConfig);
    }

    public void setFrequencyConfigFromString(String config) {
        if (config == null || config.isEmpty()) {
            this.frequencyConfig = Collections.emptyList();
        } else {
            this.frequencyConfig = Arrays.asList(config.split(","));
        }
    }
}
