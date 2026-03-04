package com.tuttogionni.dto;

import com.tuttogionni.model.WorkoutType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutDTO {

    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Workout type is required")
    private WorkoutType type;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer durationMinutes;

    private Integer caloriesBurned;

    private String notes;

    private Boolean completed;
}
