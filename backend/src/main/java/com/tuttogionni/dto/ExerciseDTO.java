package com.tuttogionni.dto;

import com.tuttogionni.model.MuscleGroup;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseDTO {

    private Long id;

    private Long exerciseTemplateId;

    @NotBlank(message = "Exercise name is required")
    private String name;

    private MuscleGroup muscleGroup;

    private Integer sets;
    private Integer reps;
    private Integer minReps;
    private Integer maxReps;
    private Double weight;
    private Boolean useTwoDumbbells;
    private Integer restSeconds;
    private String notes;
    private Integer exerciseOrder;

    private Double weightIncrement;

    // Cardio-specific fields
    private String cardioType;
    private Integer durationMinutes;
    private BigDecimal distanceKm;
}
