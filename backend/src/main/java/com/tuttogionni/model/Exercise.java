package com.tuttogionni.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "exercises")
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Exercise exercise = (Exercise) o;
        // If both have IDs, compare by ID
        if (id != null && exercise.id != null) {
            return id.equals(exercise.id);
        }
        // For new entities, compare by business key
        return exerciseOrder != null && exerciseOrder.equals(exercise.exerciseOrder)
                && name != null && name.equals(exercise.name);
    }

    @Override
    public int hashCode() {
        // Use a constant for new entities to ensure they can be added to HashSet
        // and then properly compared using equals
        if (id != null) {
            return id.hashCode();
        }
        return 31; // Constant for new entities - equals() will differentiate them
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_day_id", nullable = false)
    private WorkoutDay workoutDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_template_id")
    private ExerciseTemplate exerciseTemplate;

    @Column(nullable = false)
    private String name;

    @Column(name = "muscle_group")
    private String muscleGroup;

    private Integer sets;

    private Integer reps;

    @Column(name = "cardio_type")
    private String cardioType;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "distance_km")
    private BigDecimal distanceKm;

    private Double weight;

    @Column(name = "rest_seconds")
    private Integer restSeconds;

    private String notes;

    @Column(name = "exercise_order", nullable = false)
    private Integer exerciseOrder;

    @Column(name = "use_two_dumbbells")
    private Boolean useTwoDumbbells;

    @Column(name = "min_reps")
    private Integer minReps;

    @Column(name = "max_reps")
    private Integer maxReps;

    @Column(name = "weight_increment")
    private Double weightIncrement;
}
