package com.tuttogionni.repository;

import com.tuttogionni.model.ExerciseFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseFeedbackRepository extends JpaRepository<ExerciseFeedback, Long> {

    @Query("SELECT ef FROM ExerciseFeedback ef WHERE ef.user.id = :userId AND ef.workoutPlan.id = :planId AND ef.exerciseName = :exerciseName ORDER BY ef.createdAt DESC")
    List<ExerciseFeedback> findRecentByUserAndPlanAndExercise(
            @Param("userId") Long userId,
            @Param("planId") Long planId,
            @Param("exerciseName") String exerciseName);

    List<ExerciseFeedback> findByWorkoutLogId(Long workoutLogId);

    boolean existsByWorkoutLogIdAndExerciseName(Long workoutLogId, String exerciseName);
}
