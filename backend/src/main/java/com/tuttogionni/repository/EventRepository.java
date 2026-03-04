package com.tuttogionni.repository;

import com.tuttogionni.model.Event;
import com.tuttogionni.model.EventCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByUserIdOrderByDateDesc(Long userId);

    List<Event> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate startDate, LocalDate endDate);

    List<Event> findByUserIdAndCategoryOrderByDateDesc(Long userId, EventCategory category);

    List<Event> findByUserIdAndDateOrderByStartTimeAsc(Long userId, LocalDate date);

    @Query("SELECT e FROM Event e WHERE e.user.id = :userId AND e.date >= :startOfWeek AND e.date <= :endOfWeek ORDER BY e.date, e.startTime")
    List<Event> findWeeklyEvents(@Param("userId") Long userId, @Param("startOfWeek") LocalDate startOfWeek, @Param("endOfWeek") LocalDate endOfWeek);

    List<Event> findByUserIdAndRecurringTrueOrderByDateAsc(Long userId);

    @Query("SELECT e FROM Event e WHERE e.user.id = :userId AND e.date >= :startOfMonth AND e.date <= :endOfMonth ORDER BY e.date, e.startTime")
    List<Event> findMonthlyEvents(@Param("userId") Long userId, @Param("startOfMonth") LocalDate startOfMonth, @Param("endOfMonth") LocalDate endOfMonth);

    @Modifying
    @Query("DELETE FROM Event e WHERE e.workoutPlan.id = :workoutPlanId AND e.user.id = :userId")
    void deleteByWorkoutPlanIdAndUserId(@Param("workoutPlanId") Long workoutPlanId, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Event e WHERE e.workoutPlan.id = :workoutPlanId AND e.user.id = :userId AND e.completed = false")
    void deleteUncompletedByWorkoutPlanIdAndUserId(@Param("workoutPlanId") Long workoutPlanId, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Event e WHERE e.workoutPlan.id = :workoutPlanId AND e.user.id = :userId AND e.date >= :fromDate")
    void deleteFutureByWorkoutPlanIdAndUserId(@Param("workoutPlanId") Long workoutPlanId, @Param("userId") Long userId, @Param("fromDate") LocalDate fromDate);

    @Modifying
    @Query("DELETE FROM Event e WHERE e.workoutPlan.id = :workoutPlanId AND e.user.id = :userId AND e.date >= :fromDate AND e.completed = false")
    void deleteFutureUncompletedByWorkoutPlanIdAndUserId(@Param("workoutPlanId") Long workoutPlanId, @Param("userId") Long userId, @Param("fromDate") LocalDate fromDate);

    List<Event> findByWorkoutPlanIdAndUserId(Long workoutPlanId, Long userId);

    @Modifying
    @Query("DELETE FROM Event e WHERE e.goal.id = :goalId AND e.user.id = :userId AND e.completed = false")
    void deleteUncompletedByGoalIdAndUserId(@Param("goalId") Long goalId, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Event e WHERE e.goal.id = :goalId AND e.user.id = :userId AND e.date >= :fromDate AND e.completed = false")
    void deleteFutureUncompletedByGoalIdAndUserId(@Param("goalId") Long goalId, @Param("userId") Long userId, @Param("fromDate") LocalDate fromDate);

    List<Event> findByGoalIdAndUserId(Long goalId, Long userId);
}
