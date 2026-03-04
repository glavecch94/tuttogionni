package com.tuttogionni.service;

import com.tuttogionni.dto.ExerciseFeedbackDTO;
import com.tuttogionni.model.*;
import com.tuttogionni.repository.ExerciseFeedbackRepository;
import com.tuttogionni.repository.ExerciseRepository;
import com.tuttogionni.repository.WorkoutLogRepository;
import com.tuttogionni.repository.WorkoutPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressionService {

    private final ExerciseFeedbackRepository feedbackRepository;
    private final WorkoutLogRepository workoutLogRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final ExerciseRepository exerciseRepository;

    @Transactional
    public ExerciseFeedback saveFeedback(ExerciseFeedbackDTO dto, User user) {
        WorkoutLog log = workoutLogRepository.findById(dto.getWorkoutLogId())
                .orElseThrow(() -> new RuntimeException("Workout log not found"));

        if (!log.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout log");
        }

        if (feedbackRepository.existsByWorkoutLogIdAndExerciseName(dto.getWorkoutLogId(), dto.getExerciseName())) {
            throw new RuntimeException("Feedback already submitted for this exercise in this session");
        }

        WorkoutPlan plan = workoutPlanRepository.findById(dto.getWorkoutPlanId())
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        ExerciseFeedback feedback = ExerciseFeedback.builder()
                .user(user)
                .workoutLog(log)
                .workoutPlan(plan)
                .exerciseName(dto.getExerciseName())
                .difficulty(dto.getDifficulty())
                .weightUsed(dto.getWeightUsed())
                .setsCompleted(dto.getSetsCompleted())
                .repsCompleted(dto.getRepsCompleted())
                .build();

        return feedbackRepository.save(feedback);
    }

    @Transactional
    public void applyProgressionIfNeeded(WorkoutLog log, User user) {
        WorkoutPlan plan = log.getWorkoutPlan();

        if (plan.getAutoProgression() == null || !plan.getAutoProgression()) {
            return;
        }

        List<ExerciseFeedback> logFeedbacks = feedbackRepository.findByWorkoutLogId(log.getId());

        for (ExerciseFeedback feedback : logFeedbacks) {
            String exerciseName = feedback.getExerciseName();

            // Find the exercise in the plan's days
            Exercise exercise = findExerciseByName(plan, exerciseName);
            if (exercise == null) {
                continue;
            }

            // Resolve minReps/maxReps: exercise -> template fallback
            Integer minReps = exercise.getMinReps();
            Integer maxReps = exercise.getMaxReps();

            if (minReps == null && exercise.getExerciseTemplate() != null) {
                minReps = exercise.getExerciseTemplate().getMinReps();
            }
            if (maxReps == null && exercise.getExerciseTemplate() != null) {
                maxReps = exercise.getExerciseTemplate().getMaxReps();
            }

            // If we can't determine rep range, skip progression
            if (minReps == null || maxReps == null) {
                continue;
            }

            // Fetch recent feedbacks for this exercise
            List<ExerciseFeedback> recentFeedbacks = feedbackRepository
                    .findRecentByUserAndPlanAndExercise(user.getId(), plan.getId(), exerciseName);

            if (recentFeedbacks.isEmpty()) {
                continue;
            }

            boolean shouldProgress = false;

            // Check 3 consecutive LIGHT
            if (recentFeedbacks.size() >= 3) {
                shouldProgress = recentFeedbacks.stream()
                        .limit(3)
                        .allMatch(f -> f.getDifficulty() == Difficulty.LIGHT);
            }

            // Check 5 consecutive NEUTRAL
            if (!shouldProgress && recentFeedbacks.size() >= 5) {
                shouldProgress = recentFeedbacks.stream()
                        .limit(5)
                        .allMatch(f -> f.getDifficulty() == Difficulty.NEUTRAL);
            }

            if (shouldProgress) {
                applyIncrement(exercise, minReps, maxReps);
                exerciseRepository.save(exercise);
            }
        }
    }

    private Exercise findExerciseByName(WorkoutPlan plan, String exerciseName) {
        // Need to load the full plan with days and exercises
        WorkoutPlan fullPlan = workoutPlanRepository.findByIdWithDaysAndExercises(plan.getId())
                .orElse(null);

        if (fullPlan == null) {
            return null;
        }

        return fullPlan.getWorkoutDays().stream()
                .flatMap(day -> day.getExercises().stream())
                .filter(e -> e.getName().equals(exerciseName))
                .findFirst()
                .orElse(null);
    }

    private void applyIncrement(Exercise exercise, int minReps, int maxReps) {
        int currentReps = exercise.getReps();

        if (currentReps < maxReps) {
            // Increment reps
            int increment;
            if (maxReps <= 12) {
                increment = 2;
            } else if (minReps >= 10) {
                increment = 5;
            } else {
                increment = 2;
            }
            exercise.setReps(Math.min(currentReps + increment, maxReps));
        } else {
            // Reps at max -> increment weight, reset reps
            double currentWeight = exercise.getWeight() != null ? exercise.getWeight() : 0;
            exercise.setWeight(currentWeight + 2.0);
            exercise.setReps(minReps);
        }
    }
}
