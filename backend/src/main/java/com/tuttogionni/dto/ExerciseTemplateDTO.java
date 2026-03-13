package com.tuttogionni.dto;

import com.tuttogionni.model.MuscleGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseTemplateDTO {
    private Long id;
    private String name;
    private MuscleGroup muscleGroup;
    private Integer defaultSets;
    private Integer minReps;
    private Integer maxReps;
    private BigDecimal initialWeight;
    private Boolean useTwoDumbbells;
    private String notes;

    // Cardio-specific fields
    private String cardioType;
    private Integer defaultDurationMinutes;
}
