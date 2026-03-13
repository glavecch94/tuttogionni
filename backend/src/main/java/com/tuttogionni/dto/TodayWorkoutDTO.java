package com.tuttogionni.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

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

    /** All days in the plan, for the "another workout" picker */
    private List<WorkoutDaySummaryDTO> availableWorkoutDays;

    /** Last 5 difficulty feedbacks per exercise name (oldest → newest) */
    private Map<String, List<String>> exerciseFeedbackHistory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkoutDaySummaryDTO {
        private int dayIndex;
        private int dayNumber;
        private String name;
    }
}
