package com.tuttogionni.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "workout_days")
public class WorkoutDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WorkoutDay that = (WorkoutDay) o;
        if (id != null && that.id != null) {
            return id.equals(that.id);
        }
        return dayNumber != null && dayNumber.equals(that.dayNumber)
                && name != null && name.equals(that.name);
    }

    @Override
    public int hashCode() {
        if (id != null) {
            return id.hashCode();
        }
        return 31;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_plan_id", nullable = false)
    private WorkoutPlan workoutPlan;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "workoutDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("exerciseOrder ASC")
    private Set<Exercise> exercises = new LinkedHashSet<>();
}
