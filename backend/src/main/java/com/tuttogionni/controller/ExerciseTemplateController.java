package com.tuttogionni.controller;

import com.tuttogionni.dto.ExerciseTemplateDTO;
import com.tuttogionni.model.MuscleGroup;
import com.tuttogionni.model.User;
import com.tuttogionni.service.ExerciseTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercise-templates")
@RequiredArgsConstructor
@Tag(name = "Exercise Templates", description = "Exercise library management")
@SecurityRequirement(name = "bearerAuth")
public class ExerciseTemplateController {

    private final ExerciseTemplateService exerciseTemplateService;

    @GetMapping
    @Operation(summary = "Get all exercise templates")
    public ResponseEntity<List<ExerciseTemplateDTO>> getAllTemplates(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(exerciseTemplateService.getAllTemplates(user));
    }

    @GetMapping("/grouped")
    @Operation(summary = "Get exercise templates grouped by muscle group")
    public ResponseEntity<Map<MuscleGroup, List<ExerciseTemplateDTO>>> getTemplatesGrouped(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(exerciseTemplateService.getTemplatesGroupedByMuscle(user));
    }

    @GetMapping("/muscle-group/{muscleGroup}")
    @Operation(summary = "Get exercise templates by muscle group")
    public ResponseEntity<List<ExerciseTemplateDTO>> getTemplatesByMuscleGroup(
            @PathVariable MuscleGroup muscleGroup,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(exerciseTemplateService.getTemplatesByMuscleGroup(user, muscleGroup));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exercise template by ID")
    public ResponseEntity<ExerciseTemplateDTO> getTemplateById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(exerciseTemplateService.getTemplateById(id, user));
    }

    @PostMapping
    @Operation(summary = "Create a new exercise template")
    public ResponseEntity<ExerciseTemplateDTO> createTemplate(
            @Valid @RequestBody ExerciseTemplateDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(exerciseTemplateService.createTemplate(dto, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an exercise template")
    public ResponseEntity<ExerciseTemplateDTO> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ExerciseTemplateDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(exerciseTemplateService.updateTemplate(id, dto, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an exercise template")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        exerciseTemplateService.deleteTemplate(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/muscle-groups")
    @Operation(summary = "Get all muscle group options")
    public ResponseEntity<MuscleGroup[]> getMuscleGroups() {
        return ResponseEntity.ok(MuscleGroup.values());
    }
}
