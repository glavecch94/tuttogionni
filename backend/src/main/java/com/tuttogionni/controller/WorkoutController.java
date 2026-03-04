package com.tuttogionni.controller;

import com.tuttogionni.dto.WorkoutDTO;
import com.tuttogionni.model.User;
import com.tuttogionni.model.WorkoutType;
import com.tuttogionni.service.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
@Tag(name = "Workouts", description = "Workout management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class WorkoutController {

    private final WorkoutService workoutService;

    @GetMapping
    @Operation(summary = "Get all workouts for the authenticated user")
    public ResponseEntity<List<WorkoutDTO>> getAllWorkouts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.getAllWorkouts(user));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific workout by ID")
    public ResponseEntity<WorkoutDTO> getWorkoutById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.getWorkoutById(id, user));
    }

    @GetMapping("/range")
    @Operation(summary = "Get workouts within a date range")
    public ResponseEntity<List<WorkoutDTO>> getWorkoutsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.getWorkoutsByDateRange(user, startDate, endDate));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get workouts by type")
    public ResponseEntity<List<WorkoutDTO>> getWorkoutsByType(
            @PathVariable WorkoutType type,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.getWorkoutsByType(user, type));
    }

    @GetMapping("/weekly")
    @Operation(summary = "Get workouts for a specific week")
    public ResponseEntity<List<WorkoutDTO>> getWeeklyWorkouts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal User user) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(workoutService.getWeeklyWorkouts(user, targetDate));
    }

    @PostMapping
    @Operation(summary = "Create a new workout")
    public ResponseEntity<WorkoutDTO> createWorkout(
            @Valid @RequestBody WorkoutDTO workoutDTO,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.createWorkout(workoutDTO, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing workout")
    public ResponseEntity<WorkoutDTO> updateWorkout(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutDTO workoutDTO,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.updateWorkout(id, workoutDTO, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a workout")
    public ResponseEntity<Void> deleteWorkout(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        workoutService.deleteWorkout(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-complete")
    @Operation(summary = "Toggle workout completion status")
    public ResponseEntity<WorkoutDTO> toggleComplete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.toggleComplete(id, user));
    }
}
