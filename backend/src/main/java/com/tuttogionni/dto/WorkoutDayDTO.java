package com.tuttogionni.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutDayDTO {

    private Long id;

    @NotNull(message = "Day number is required")
    private Integer dayNumber;

    @NotBlank(message = "Day name is required")
    private String name;

    private String description;

    @Valid
    private List<ExerciseDTO> exercises = new ArrayList<>();
}
