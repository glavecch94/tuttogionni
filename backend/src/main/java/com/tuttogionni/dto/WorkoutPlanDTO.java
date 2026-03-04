package com.tuttogionni.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanDTO {

    private Long id;

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;

    @NotNull(message = "Workouts per week is required")
    @Min(value = 1, message = "Workouts per week must be at least 1")
    private Integer workoutsPerWeek;

    private Boolean isActive;

    private Integer currentDayIndex;

    @Valid
    private List<WorkoutDayDTO> workoutDays = new ArrayList<>();

    private List<String> trainingDays = new ArrayList<>();

    private LocalTime trainingTime;

    private Boolean autoProgression;

    public String getTrainingDaysAsString() {
        if (trainingDays == null || trainingDays.isEmpty()) {
            return null;
        }
        return String.join(",", trainingDays);
    }

    public void setTrainingDaysFromString(String trainingDaysStr) {
        if (trainingDaysStr == null || trainingDaysStr.isEmpty()) {
            this.trainingDays = new ArrayList<>();
        } else {
            this.trainingDays = new ArrayList<>(Arrays.asList(trainingDaysStr.split(",")));
        }
    }
}
