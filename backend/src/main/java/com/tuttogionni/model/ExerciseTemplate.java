package com.tuttogionni.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "exercise_templates", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "name"})
})
public class ExerciseTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "muscle_group", nullable = false, columnDefinition = "muscle_group")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private MuscleGroup muscleGroup;

    @Column(name = "default_sets", nullable = false)
    private Integer defaultSets;

    @Column(name = "min_reps", nullable = false)
    private Integer minReps;

    @Column(name = "max_reps", nullable = false)
    private Integer maxReps;

    @Column(name = "initial_weight")
    private BigDecimal initialWeight;

    @Column(name = "use_two_dumbbells")
    private Boolean useTwoDumbbells;

    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
