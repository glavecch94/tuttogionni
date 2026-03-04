package com.tuttogionni.dto;

import com.tuttogionni.model.EventCategory;
import com.tuttogionni.model.RecurrencePattern;
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
public class EventDTO {

    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Category is required")
    private EventCategory category;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    private String location;

    private Boolean recurring;

    private RecurrencePattern recurrencePattern;

    private String color;

    private Boolean completed;

    private Boolean skipped;

    private Long workoutPlanId;

    private Long workoutDayId;

    private String workoutPlanName;

    private String workoutDayName;

    private Long goalId;

    private String goalName;
}
