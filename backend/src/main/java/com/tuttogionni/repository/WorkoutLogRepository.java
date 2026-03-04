package com.tuttogionni.repository;

import com.tuttogionni.model.WorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, Long> {

    List<WorkoutLog> findByUserIdOrderByDateDesc(Long userId);

    List<WorkoutLog> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate startDate, LocalDate endDate);

    Optional<WorkoutLog> findByUserIdAndWorkoutPlanIdAndDate(Long userId, Long workoutPlanId, LocalDate date);

    @Query("SELECT wl FROM WorkoutLog wl WHERE wl.user.id = :userId AND wl.workoutPlan.id = :planId ORDER BY wl.date DESC, wl.createdAt DESC")
    List<WorkoutLog> findByUserIdAndPlanIdOrderByDateDesc(@Param("userId") Long userId, @Param("planId") Long planId);

    @Query("SELECT COUNT(wl) FROM WorkoutLog wl WHERE wl.user.id = :userId AND wl.workoutPlan.id = :planId AND wl.completed = true")
    Long countCompletedByUserIdAndPlanId(@Param("userId") Long userId, @Param("planId") Long planId);

    Optional<WorkoutLog> findFirstByUserIdAndWorkoutPlanIdAndCompletedTrueOrderByDateDescCreatedAtDesc(Long userId, Long workoutPlanId);
}
