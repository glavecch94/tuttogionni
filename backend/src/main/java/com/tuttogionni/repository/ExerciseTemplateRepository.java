package com.tuttogionni.repository;

import com.tuttogionni.model.ExerciseTemplate;
import com.tuttogionni.model.MuscleGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseTemplateRepository extends JpaRepository<ExerciseTemplate, Long> {

    List<ExerciseTemplate> findByUserIdOrderByMuscleGroupAscNameAsc(Long userId);

    List<ExerciseTemplate> findByUserIdAndMuscleGroupOrderByNameAsc(Long userId, MuscleGroup muscleGroup);

    Optional<ExerciseTemplate> findByUserIdAndName(Long userId, String name);

    Optional<ExerciseTemplate> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndName(Long userId, String name);
}
