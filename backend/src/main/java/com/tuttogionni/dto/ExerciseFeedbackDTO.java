package com.tuttogionni.dto;

import com.tuttogionni.model.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseFeedbackDTO {

    @NotNull(message = "Workout log ID is required")
    private Long workoutLogId;

    @NotBlank(message = "Exercise name is required")
    private String exerciseName;

    @NotNull(message = "Workout plan ID is required")
    private Long workoutPlanId;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    private BigDecimal weightUsed;

    private Integer setsCompleted;

    private Integer repsCompleted;
}
