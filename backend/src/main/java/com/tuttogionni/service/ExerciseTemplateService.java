package com.tuttogionni.service;

import com.tuttogionni.dto.ExerciseTemplateDTO;
import com.tuttogionni.model.ExerciseTemplate;
import com.tuttogionni.model.MuscleGroup;
import com.tuttogionni.model.User;
import com.tuttogionni.repository.ExerciseTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseTemplateService {

    private final ExerciseTemplateRepository exerciseTemplateRepository;

    public List<ExerciseTemplateDTO> getAllTemplates(User user) {
        return exerciseTemplateRepository.findByUserIdOrderByMuscleGroupAscNameAsc(user.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public Map<MuscleGroup, List<ExerciseTemplateDTO>> getTemplatesGroupedByMuscle(User user) {
        return exerciseTemplateRepository.findByUserIdOrderByMuscleGroupAscNameAsc(user.getId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.groupingBy(ExerciseTemplateDTO::getMuscleGroup));
    }

    public List<ExerciseTemplateDTO> getTemplatesByMuscleGroup(User user, MuscleGroup muscleGroup) {
        return exerciseTemplateRepository.findByUserIdAndMuscleGroupOrderByNameAsc(user.getId(), muscleGroup)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public ExerciseTemplateDTO getTemplateById(Long id, User user) {
        ExerciseTemplate template = exerciseTemplateRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Exercise template not found"));
        return toDTO(template);
    }

    @Transactional
    public ExerciseTemplateDTO createTemplate(ExerciseTemplateDTO dto, User user) {
        if (exerciseTemplateRepository.existsByUserIdAndName(user.getId(), dto.getName())) {
            throw new RuntimeException("An exercise with this name already exists");
        }

        ExerciseTemplate template = ExerciseTemplate.builder()
                .user(user)
                .name(dto.getName())
                .muscleGroup(dto.getMuscleGroup())
                .defaultSets(dto.getDefaultSets() != null ? dto.getDefaultSets() : 3)
                .minReps(dto.getMinReps() != null ? dto.getMinReps() : 8)
                .maxReps(dto.getMaxReps() != null ? dto.getMaxReps() : 12)
                .initialWeight(dto.getInitialWeight())
                .useTwoDumbbells(dto.getUseTwoDumbbells() != null ? dto.getUseTwoDumbbells() : false)
                .notes(dto.getNotes())
                .build();

        return toDTO(exerciseTemplateRepository.save(template));
    }

    @Transactional
    public ExerciseTemplateDTO updateTemplate(Long id, ExerciseTemplateDTO dto, User user) {
        ExerciseTemplate template = exerciseTemplateRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Exercise template not found"));

        // Check if name is being changed to an existing name
        if (!template.getName().equals(dto.getName()) &&
            exerciseTemplateRepository.existsByUserIdAndName(user.getId(), dto.getName())) {
            throw new RuntimeException("An exercise with this name already exists");
        }

        template.setName(dto.getName());
        template.setMuscleGroup(dto.getMuscleGroup());
        template.setDefaultSets(dto.getDefaultSets());
        template.setMinReps(dto.getMinReps());
        template.setMaxReps(dto.getMaxReps());
        template.setInitialWeight(dto.getInitialWeight());
        template.setUseTwoDumbbells(dto.getUseTwoDumbbells());
        template.setNotes(dto.getNotes());

        return toDTO(exerciseTemplateRepository.save(template));
    }

    @Transactional
    public void deleteTemplate(Long id, User user) {
        ExerciseTemplate template = exerciseTemplateRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Exercise template not found"));
        exerciseTemplateRepository.delete(template);
    }

    private ExerciseTemplateDTO toDTO(ExerciseTemplate template) {
        return ExerciseTemplateDTO.builder()
                .id(template.getId())
                .name(template.getName())
                .muscleGroup(template.getMuscleGroup())
                .defaultSets(template.getDefaultSets())
                .minReps(template.getMinReps())
                .maxReps(template.getMaxReps())
                .initialWeight(template.getInitialWeight())
                .useTwoDumbbells(template.getUseTwoDumbbells())
                .notes(template.getNotes())
                .build();
    }
}
