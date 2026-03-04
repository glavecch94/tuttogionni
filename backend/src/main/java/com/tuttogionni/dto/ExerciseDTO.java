package com.tuttogionni.dto;

import com.tuttogionni.model.MuscleGroup;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @NotNull(message = "Sets is required")
    @Min(value = 1, message = "Sets must be at least 1")
    private Integer sets;

    @NotNull(message = "Reps is required")
    @Min(value = 1, message = "Reps must be at least 1")
    private Integer reps;

    private Integer minReps;
    private Integer maxReps;

    private Double weight;

    private Boolean useTwoDumbbells;

    private Integer restSeconds;

    private String notes;

    private Integer exerciseOrder;
}
