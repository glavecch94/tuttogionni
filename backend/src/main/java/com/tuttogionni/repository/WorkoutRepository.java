package com.tuttogionni.repository;

import com.tuttogionni.model.Workout;
import com.tuttogionni.model.WorkoutType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WorkoutRepository extends JpaRepository<Workout, Long> {

    List<Workout> findByUserIdOrderByDateDesc(Long userId);

    List<Workout> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate startDate, LocalDate endDate);

    List<Workout> findByUserIdAndTypeOrderByDateDesc(Long userId, WorkoutType type);

    List<Workout> findByUserIdAndDateOrderByStartTimeAsc(Long userId, LocalDate date);

    @Query("SELECT w FROM Workout w WHERE w.user.id = :userId AND w.date >= :startOfWeek AND w.date <= :endOfWeek ORDER BY w.date, w.startTime")
    List<Workout> findWeeklyWorkouts(@Param("userId") Long userId, @Param("startOfWeek") LocalDate startOfWeek, @Param("endOfWeek") LocalDate endOfWeek);

    @Query("SELECT COUNT(w) FROM Workout w WHERE w.user.id = :userId AND w.completed = true AND w.date >= :startDate")
    Long countCompletedWorkoutsSince(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);
}
