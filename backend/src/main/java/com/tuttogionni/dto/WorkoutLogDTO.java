package com.tuttogionni.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutLogDTO {

    private Long id;

    private Long workoutPlanId;
    private String workoutPlanName;

    private Long workoutDayId;
    private String workoutDayName;
    private Integer workoutDayNumber;

    private LocalDate date;

    private Boolean completed;

    private String notes;
}
