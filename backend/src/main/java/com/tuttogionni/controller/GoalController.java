package com.tuttogionni.controller;

import com.tuttogionni.dto.GoalDTO;
import com.tuttogionni.model.User;
import com.tuttogionni.service.GoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@Tag(name = "Goals", description = "Goal management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    @Operation(summary = "Get all goals for the authenticated user")
    public ResponseEntity<List<GoalDTO>> getAllGoals(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.getAllGoals(user));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific goal by ID")
    public ResponseEntity<GoalDTO> getGoalById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.getGoalById(id, user));
    }

    @PostMapping
    @Operation(summary = "Create a new goal")
    public ResponseEntity<GoalDTO> createGoal(
            @Valid @RequestBody GoalDTO goalDTO,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.createGoal(goalDTO, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing goal")
    public ResponseEntity<GoalDTO> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody GoalDTO goalDTO,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.updateGoal(id, goalDTO, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a goal")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        goalService.deleteGoal(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate a goal and generate events")
    public ResponseEntity<GoalDTO> activateGoal(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.activateGoal(id, user));
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a goal and remove future events")
    public ResponseEntity<GoalDTO> deactivateGoal(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.deactivateGoal(id, user));
    }
}
