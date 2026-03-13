package com.tuttogionni.controller;

import com.tuttogionni.dto.*;
import com.tuttogionni.model.User;
import com.tuttogionni.service.ProgressionService;
import com.tuttogionni.service.WorkoutPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workout-plans")
@RequiredArgsConstructor
@Tag(name = "Workout Plans", description = "Workout plan management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class WorkoutPlanController {

    private final WorkoutPlanService workoutPlanService;
    private final ProgressionService progressionService;

    @GetMapping
    @Operation(summary = "Get all workout plans for the authenticated user")
    public ResponseEntity<List<WorkoutPlanDTO>> getAllPlans(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.getAllPlans(user));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a workout plan by ID with all days and exercises")
    public ResponseEntity<WorkoutPlanDTO> getPlanById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.getPlanById(id, user));
    }

    @GetMapping("/active")
    @Operation(summary = "Get the active workout plan")
    public ResponseEntity<WorkoutPlanDTO> getActivePlan(@AuthenticationPrincipal User user) {
        return workoutPlanService.getActivePlan(user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping
    @Operation(summary = "Create a new workout plan")
    public ResponseEntity<WorkoutPlanDTO> createPlan(
            @Valid @RequestBody WorkoutPlanDTO planDTO,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.createPlan(planDTO, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a workout plan")
    public ResponseEntity<WorkoutPlanDTO> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutPlanDTO planDTO,
            @RequestParam(required = false) Boolean resetCycle,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate effectiveDate,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.updatePlan(id, planDTO, user, resetCycle, effectiveDate));
    }

    @PostMapping("/{id}/update-preview")
    @Operation(summary = "Get preview of what will happen when the plan is updated")
    public ResponseEntity<Map<String, Object>> getUpdatePreview(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutPlanDTO planDTO,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.getUpdatePreview(id, planDTO, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a workout plan")
    public ResponseEntity<Void> deletePlan(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        workoutPlanService.deletePlan(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate a workout plan (deactivates any currently active plan)")
    public ResponseEntity<WorkoutPlanDTO> activatePlan(
            @PathVariable Long id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) Integer startDayIndex,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.activatePlan(id, user, startDate, startDayIndex));
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a workout plan")
    public ResponseEntity<Void> deactivatePlan(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        workoutPlanService.deactivatePlan(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/today")
    @Operation(summary = "Get today's workout from the active plan")
    public ResponseEntity<TodayWorkoutDTO> getTodayWorkout(@AuthenticationPrincipal User user) {
        TodayWorkoutDTO today = workoutPlanService.getTodayWorkout(user);
        if (today == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(today);
    }

    @PostMapping("/today/next")
    @Operation(summary = "Advance to a chosen workout day to do another workout today")
    public ResponseEntity<WorkoutLogDTO> startNextWorkoutToday(
            @RequestParam(required = false) Integer dayIndex,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.startNextWorkoutToday(user, dayIndex));
    }

    @PostMapping("/today/skip")
    @Operation(summary = "Skip today's workout and advance the cycle")
    public ResponseEntity<Void> skipTodayWorkout(@AuthenticationPrincipal User user) {
        workoutPlanService.skipTodayWorkout(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/today/start")
    @Operation(summary = "Start today's workout")
    public ResponseEntity<WorkoutLogDTO> startTodayWorkout(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.startTodayWorkout(user));
    }

    @PostMapping("/logs/{logId}/complete")
    @Operation(summary = "Complete a workout")
    public ResponseEntity<WorkoutLogDTO> completeWorkout(
            @PathVariable Long logId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(workoutPlanService.completeWorkout(logId, user, notes));
    }

    @GetMapping("/history")
    @Operation(summary = "Get workout history")
    public ResponseEntity<List<WorkoutLogDTO>> getWorkoutHistory(
            @RequestParam(required = false) Long planId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.getWorkoutHistory(user, planId));
    }

    @PostMapping("/{id}/regenerate-events")
    @Operation(summary = "Regenerate workout events for an active plan")
    public ResponseEntity<Void> regenerateEvents(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        workoutPlanService.regenerateWorkoutEvents(id, user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/clone")
    @Operation(summary = "Clone a workout plan")
    public ResponseEntity<WorkoutPlanDTO> clonePlan(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutPlanService.clonePlan(id, user));
    }

    @PostMapping("/feedback")
    @Operation(summary = "Submit exercise feedback for difficulty tracking")
    public ResponseEntity<Void> submitFeedback(
            @Valid @RequestBody ExerciseFeedbackDTO feedbackDTO,
            @AuthenticationPrincipal User user) {
        progressionService.saveFeedback(feedbackDTO, user);
        return ResponseEntity.ok().build();
    }
}
