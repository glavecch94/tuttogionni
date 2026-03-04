package com.tuttogionni.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodayWorkoutDTO {

    private Long workoutPlanId;
    private String workoutPlanName;

    private Long workoutDayId;
    private Integer workoutDayNumber;
    private String workoutDayName;
    private String workoutDayDescription;

    private List<ExerciseDTO> exercises;

    private Boolean alreadyCompletedToday;
    private Long todayLogId;

    private Boolean autoProgression;
}
