package com.tuttogionni.service;

import com.tuttogionni.dto.WorkoutDTO;
import com.tuttogionni.model.User;
import com.tuttogionni.model.Workout;
import com.tuttogionni.model.WorkoutType;
import com.tuttogionni.repository.WorkoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutRepository workoutRepository;

    public List<WorkoutDTO> getAllWorkouts(User user) {
        return workoutRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public WorkoutDTO getWorkoutById(Long id, User user) {
        Workout workout = workoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        if (!workout.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout");
        }

        return toDTO(workout);
    }

    public List<WorkoutDTO> getWorkoutsByDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return workoutRepository.findByUserIdAndDateBetweenOrderByDateAsc(user.getId(), startDate, endDate)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<WorkoutDTO> getWorkoutsByType(User user, WorkoutType type) {
        return workoutRepository.findByUserIdAndTypeOrderByDateDesc(user.getId(), type)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<WorkoutDTO> getWeeklyWorkouts(User user, LocalDate date) {
        LocalDate startOfWeek = date.with(DayOfWeek.MONDAY);
        LocalDate endOfWeek = date.with(DayOfWeek.SUNDAY);
        return workoutRepository.findWeeklyWorkouts(user.getId(), startOfWeek, endOfWeek)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public WorkoutDTO createWorkout(WorkoutDTO dto, User user) {
        Workout workout = Workout.builder()
                .user(user)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .durationMinutes(dto.getDurationMinutes())
                .caloriesBurned(dto.getCaloriesBurned())
                .notes(dto.getNotes())
                .completed(dto.getCompleted() != null ? dto.getCompleted() : false)
                .build();

        return toDTO(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutDTO updateWorkout(Long id, WorkoutDTO dto, User user) {
        Workout workout = workoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        if (!workout.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout");
        }

        workout.setTitle(dto.getTitle());
        workout.setDescription(dto.getDescription());
        workout.setType(dto.getType());
        workout.setDate(dto.getDate());
        workout.setStartTime(dto.getStartTime());
        workout.setEndTime(dto.getEndTime());
        workout.setDurationMinutes(dto.getDurationMinutes());
        workout.setCaloriesBurned(dto.getCaloriesBurned());
        workout.setNotes(dto.getNotes());
        if (dto.getCompleted() != null) {
            workout.setCompleted(dto.getCompleted());
        }

        return toDTO(workoutRepository.save(workout));
    }

    @Transactional
    public void deleteWorkout(Long id, User user) {
        Workout workout = workoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        if (!workout.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout");
        }

        workoutRepository.delete(workout);
    }

    @Transactional
    public WorkoutDTO toggleComplete(Long id, User user) {
        Workout workout = workoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        if (!workout.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout");
        }

        workout.setCompleted(!workout.getCompleted());
        return toDTO(workoutRepository.save(workout));
    }

    private WorkoutDTO toDTO(Workout workout) {
        return WorkoutDTO.builder()
                .id(workout.getId())
                .title(workout.getTitle())
                .description(workout.getDescription())
                .type(workout.getType())
                .date(workout.getDate())
                .startTime(workout.getStartTime())
                .endTime(workout.getEndTime())
                .durationMinutes(workout.getDurationMinutes())
                .caloriesBurned(workout.getCaloriesBurned())
                .notes(workout.getNotes())
                .completed(workout.getCompleted())
                .build();
    }
}
