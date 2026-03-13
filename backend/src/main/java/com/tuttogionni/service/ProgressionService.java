package com.tuttogionni.service;

import com.tuttogionni.dto.ExerciseFeedbackDTO;
import com.tuttogionni.model.*;
import com.tuttogionni.repository.ExerciseFeedbackRepository;
import com.tuttogionni.repository.ExerciseRepository;
import com.tuttogionni.repository.WorkoutLogRepository;
import com.tuttogionni.repository.WorkoutPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
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

        WorkoutPlan plan = workoutPlanRepository.findById(dto.getWorkoutPlanId())
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        // Upsert: update existing feedback if already submitted for this exercise in this session
        ExerciseFeedback feedback = feedbackRepository
                .findByWorkoutLogIdAndExerciseName(dto.getWorkoutLogId(), dto.getExerciseName())
                .map(existing -> {
                    existing.setDifficulty(dto.getDifficulty());
                    return existing;
                })
                .orElseGet(() -> ExerciseFeedback.builder()
                        .user(user)
                        .workoutLog(log)
                        .workoutPlan(plan)
                        .exerciseName(dto.getExerciseName())
                        .difficulty(dto.getDifficulty())
                        .weightUsed(dto.getWeightUsed())
                        .setsCompleted(dto.getSetsCompleted())
                        .repsCompleted(dto.getRepsCompleted())
                        .build());

        return feedbackRepository.save(feedback);
    }

    @Transactional
    public void applyProgressionIfNeeded(WorkoutLog workoutLog, User user) {
        WorkoutPlan plan = workoutLog.getWorkoutPlan();

        if (plan.getAutoProgression() == null || !plan.getAutoProgression()) {
            log.debug("Progression skipped: autoProgression is off for plan {}", plan.getId());
            return;
        }

        List<ExerciseFeedback> logFeedbacks = feedbackRepository.findByWorkoutLogId(workoutLog.getId());
        if (logFeedbacks.isEmpty()) {
            log.info("Progression check: plan={}, log={}, feedback=∅", plan.getId(), workoutLog.getId());
            return;
        }
        String sessionSummary = logFeedbacks.stream()
                .map(f -> f.getExerciseName() + "=" + difficultySymbol(f.getDifficulty()))
                .collect(java.util.stream.Collectors.joining(", "));
        log.info("Progression check: plan={}, log={}, feedback=[{}]", plan.getId(), workoutLog.getId(), sessionSummary);

        for (ExerciseFeedback feedback : logFeedbacks) {
            String exerciseName = feedback.getExerciseName();

            Exercise exercise = findExerciseByName(plan, exerciseName);
            if (exercise == null) {
                log.warn("Progression: exercise '{}' not found in plan {}", exerciseName, plan.getId());
                continue;
            }

            // Resolve minReps/maxReps: exercise → template fallback → fallback to currentReps
            Integer minReps = exercise.getMinReps();
            Integer maxReps = exercise.getMaxReps();

            if (minReps == null && exercise.getExerciseTemplate() != null) {
                minReps = exercise.getExerciseTemplate().getMinReps();
            }
            if (maxReps == null && exercise.getExerciseTemplate() != null) {
                maxReps = exercise.getExerciseTemplate().getMaxReps();
            }

            // Fallback: if no rep range defined, use current reps as fixed point
            // (progression will go straight to weight adjustment)
            if (minReps == null || maxReps == null) {
                Integer currentReps = exercise.getReps();
                if (currentReps == null) {
                    log.warn("Progression: exercise '{}' has no reps or rep range — skipping", exerciseName);
                    continue;
                }
                minReps = currentReps;
                maxReps = currentReps;
                log.info("Progression: no rep range for '{}', using currentReps={} as fixed range → weight-only adjustment", exerciseName, currentReps);
            }

            List<ExerciseFeedback> recentFeedbacks = feedbackRepository
                    .findRecentByUserAndPlanAndExercise(user.getId(), plan.getId(), exerciseName);

            String historySymbols = recentFeedbacks.stream()
                    .limit(5)
                    .map(f -> difficultySymbol(f.getDifficulty()))
                    .collect(java.util.stream.Collectors.joining(""));
            log.info("Progression '{}': history={} ({}), reps={}, minReps={}, maxReps={}, weight={}",
                    exerciseName, historySymbols, recentFeedbacks.size(), exercise.getReps(), minReps, maxReps, exercise.getWeight());

            if (recentFeedbacks.isEmpty()) {
                continue;
            }

            boolean shouldIncrease = false;
            boolean shouldDecrease = false;

            // Check 2 consecutive LIGHT (leggero) → increase difficulty
            if (recentFeedbacks.size() >= 2) {
                shouldIncrease = recentFeedbacks.stream()
                        .limit(2)
                        .allMatch(f -> f.getDifficulty() == Difficulty.LIGHT);
            }

            // Check 5 consecutive NEUTRAL (stimolante) → increase difficulty
            if (!shouldIncrease && recentFeedbacks.size() >= 5) {
                shouldIncrease = recentFeedbacks.stream()
                        .limit(5)
                        .allMatch(f -> f.getDifficulty() == Difficulty.NEUTRAL);
            }

            // Check 3 consecutive HEAVY (pesante) → decrease difficulty
            if (!shouldIncrease && recentFeedbacks.size() >= 3) {
                shouldDecrease = recentFeedbacks.stream()
                        .limit(3)
                        .allMatch(f -> f.getDifficulty() == Difficulty.HEAVY);
            }

            String verdict = shouldIncrease ? "→+" : shouldDecrease ? "→-" : "→~";
            log.info("Progression '{}': {}", exerciseName, verdict);

            if (shouldIncrease) {
                applyIncrement(exercise, minReps, maxReps);
                exerciseRepository.save(exercise);
                log.info("Progression '{}': INCREMENT applied → reps={}, weight={}", exerciseName, exercise.getReps(), exercise.getWeight());
                feedbackRepository.deleteByUserIdAndPlanIdAndExerciseName(user.getId(), plan.getId(), exerciseName);
                log.info("Progression '{}': feedback history reset", exerciseName);
            } else if (shouldDecrease) {
                applyDecrement(exercise, minReps, maxReps);
                exerciseRepository.save(exercise);
                log.info("Progression '{}': DECREMENT applied → reps={}, weight={}", exerciseName, exercise.getReps(), exercise.getWeight());
                feedbackRepository.deleteByUserIdAndPlanIdAndExerciseName(user.getId(), plan.getId(), exerciseName);
                log.info("Progression '{}': feedback history reset", exerciseName);
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

    private void applyDecrement(Exercise exercise, int minReps, int maxReps) {
        int currentReps = exercise.getReps() != null ? exercise.getReps() : minReps;

        if (currentReps > minReps) {
            // Decrement reps toward minimum
            int decrement = (maxReps <= 12) ? 2 : 5;
            exercise.setReps(Math.max(currentReps - decrement, minReps));
        } else {
            // Reps already at min -> decrement weight, reset reps to max
            double step = exercise.getWeightIncrement() != null ? exercise.getWeightIncrement() : 2.5;
            double currentWeight = exercise.getWeight() != null ? exercise.getWeight() : 0;
            if (currentWeight >= step) {
                exercise.setWeight(currentWeight - step);
            }
            exercise.setReps(maxReps);
        }
    }

    private static String difficultySymbol(Difficulty d) {
        return switch (d) {
            case LIGHT -> "+";
            case NEUTRAL -> "~";
            case HEAVY -> "-";
        };
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
            double step = exercise.getWeightIncrement() != null ? exercise.getWeightIncrement() : 2.5;
            double currentWeight = exercise.getWeight() != null ? exercise.getWeight() : 0;
            exercise.setWeight(currentWeight + step);
            exercise.setReps(minReps);
        }
    }
}
