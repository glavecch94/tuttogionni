package com.tuttogionni.repository;

import com.tuttogionni.model.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {

    List<WorkoutPlan> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<WorkoutPlan> findByUserIdAndIsActiveTrue(Long userId);

    @Query("SELECT wp FROM WorkoutPlan wp LEFT JOIN FETCH wp.workoutDays wd LEFT JOIN FETCH wd.exercises WHERE wp.id = :id")
    Optional<WorkoutPlan> findByIdWithDaysAndExercises(@Param("id") Long id);

    @Query("SELECT wp FROM WorkoutPlan wp LEFT JOIN FETCH wp.workoutDays wd LEFT JOIN FETCH wd.exercises WHERE wp.user.id = :userId AND wp.isActive = true")
    Optional<WorkoutPlan> findActiveByUserIdWithDaysAndExercises(@Param("userId") Long userId);
}
