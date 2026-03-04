package com.tuttogionni.repository;

import com.tuttogionni.model.WorkoutDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutDayRepository extends JpaRepository<WorkoutDay, Long> {

    List<WorkoutDay> findByWorkoutPlanIdOrderByDayNumberAsc(Long workoutPlanId);

    @Query("SELECT wd FROM WorkoutDay wd LEFT JOIN FETCH wd.exercises WHERE wd.id = :id")
    Optional<WorkoutDay> findByIdWithExercises(@Param("id") Long id);

    @Query("SELECT wd FROM WorkoutDay wd LEFT JOIN FETCH wd.exercises WHERE wd.workoutPlan.id = :planId AND wd.dayNumber = :dayNumber")
    Optional<WorkoutDay> findByPlanIdAndDayNumberWithExercises(@Param("planId") Long planId, @Param("dayNumber") Integer dayNumber);

    @Modifying
    @Query("DELETE FROM Exercise e WHERE e.workoutDay.id IN (SELECT wd.id FROM WorkoutDay wd WHERE wd.workoutPlan.id = :planId)")
    void deleteExercisesByPlanId(@Param("planId") Long planId);

    @Modifying
    @Query("DELETE FROM WorkoutDay wd WHERE wd.workoutPlan.id = :planId")
    void deleteByWorkoutPlanId(@Param("planId") Long planId);
}
