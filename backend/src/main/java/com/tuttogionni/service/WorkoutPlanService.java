package com.tuttogionni.service;

import com.tuttogionni.dto.*;
import com.tuttogionni.model.*;
import com.tuttogionni.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WorkoutPlanService {

    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutDayRepository workoutDayRepository;
    private final WorkoutLogRepository workoutLogRepository;
    private final EventRepository eventRepository;
    private final ExerciseTemplateRepository exerciseTemplateRepository;
    private final ProgressionService progressionService;

    public List<WorkoutPlanDTO> getAllPlans(User user) {
        return workoutPlanRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toPlanDTO)
                .toList();
    }

    public WorkoutPlanDTO getPlanById(Long id, User user) {
        WorkoutPlan plan = workoutPlanRepository.findByIdWithDaysAndExercises(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout plan");
        }

        return toFullPlanDTO(plan);
    }

    public Optional<WorkoutPlanDTO> getActivePlan(User user) {
        return workoutPlanRepository.findActiveByUserIdWithDaysAndExercises(user.getId())
                .map(this::toFullPlanDTO);
    }

    @Transactional
    public WorkoutPlanDTO createPlan(WorkoutPlanDTO dto, User user) {
        WorkoutPlan plan = WorkoutPlan.builder()
                .user(user)
                .name(dto.getName())
                .description(dto.getDescription())
                .workoutsPerWeek(dto.getWorkoutsPerWeek())
                .isActive(false)
                .currentDayIndex(0)
                .trainingDays(dto.getTrainingDaysAsString())
                .trainingTime(dto.getTrainingTime())
                .autoProgression(dto.getAutoProgression() != null ? dto.getAutoProgression() : false)
                .workoutDays(new LinkedHashSet<>())
                .build();

        if (dto.getWorkoutDays() != null) {
            for (int i = 0; i < dto.getWorkoutDays().size(); i++) {
                WorkoutDayDTO dayDTO = dto.getWorkoutDays().get(i);
                WorkoutDay day = WorkoutDay.builder()
                        .workoutPlan(plan)
                        .dayNumber(i + 1)
                        .name(dayDTO.getName())
                        .description(dayDTO.getDescription())
                        .exercises(new LinkedHashSet<>())
                        .build();

                if (dayDTO.getExercises() != null) {
                    for (int j = 0; j < dayDTO.getExercises().size(); j++) {
                        ExerciseDTO exDTO = dayDTO.getExercises().get(j);
                        Exercise exercise = buildExerciseFromDTO(exDTO, day, j + 1, user);
                        day.getExercises().add(exercise);
                    }
                }

                plan.getWorkoutDays().add(day);
            }
        }

        return toFullPlanDTO(workoutPlanRepository.save(plan));
    }

    private Exercise buildExerciseFromDTO(ExerciseDTO exDTO, WorkoutDay day, int order, User user) {
        Exercise.ExerciseBuilder builder = Exercise.builder()
                .workoutDay(day)
                .name(exDTO.getName())
                .sets(exDTO.getSets())
                .reps(exDTO.getReps())
                .weight(exDTO.getWeight())
                .useTwoDumbbells(exDTO.getUseTwoDumbbells())
                .restSeconds(exDTO.getRestSeconds())
                .notes(exDTO.getNotes())
                .exerciseOrder(order);

        // Link to exercise template if provided
        ExerciseTemplate template = null;
        if (exDTO.getExerciseTemplateId() != null) {
            template = exerciseTemplateRepository.findByIdAndUserId(exDTO.getExerciseTemplateId(), user.getId())
                    .orElse(null);
            if (template != null) {
                builder.exerciseTemplate(template);
            }
        }

        // Set minReps/maxReps: DTO value, then template fallback
        Integer minReps = exDTO.getMinReps();
        Integer maxReps = exDTO.getMaxReps();
        if (minReps == null && template != null) {
            minReps = template.getMinReps();
        }
        if (maxReps == null && template != null) {
            maxReps = template.getMaxReps();
        }
        builder.minReps(minReps);
        builder.maxReps(maxReps);

        return builder.build();
    }

    @Transactional
    public WorkoutPlanDTO updatePlan(Long id, WorkoutPlanDTO dto, User user) {
        return updatePlan(id, dto, user, null, null);
    }

    @Transactional
    public WorkoutPlanDTO updatePlan(Long id, WorkoutPlanDTO dto, User user, Boolean resetCycle) {
        return updatePlan(id, dto, user, resetCycle, null);
    }

    @Transactional
    public WorkoutPlanDTO updatePlan(Long id, WorkoutPlanDTO dto, User user, Boolean resetCycle, LocalDate effectiveDate) {
        WorkoutPlan plan = workoutPlanRepository.findByIdWithDaysAndExercises(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout plan");
        }

        // Use today if no effective date specified
        LocalDate fromDate = effectiveDate != null ? effectiveDate : LocalDate.now();

        // Determine if cycle should be reset
        int oldDayCount = plan.getWorkoutDays().size();
        int newDayCount = dto.getWorkoutDays() != null ? dto.getWorkoutDays().size() : 0;
        boolean shouldResetCycle = resetCycle != null ? resetCycle : (oldDayCount != newDayCount);

        // Update basic fields
        plan.setName(dto.getName());
        plan.setDescription(dto.getDescription());
        plan.setWorkoutsPerWeek(dto.getWorkoutsPerWeek());
        plan.setTrainingDays(dto.getTrainingDaysAsString());
        plan.setTrainingTime(dto.getTrainingTime());
        if (dto.getAutoProgression() != null) {
            plan.setAutoProgression(dto.getAutoProgression());
        }

        // Clear existing days - orphanRemoval will delete them from DB
        plan.getWorkoutDays().clear();

        // Flush to ensure deletions are applied before adding new entities
        workoutPlanRepository.flush();

        // Add new days and exercises
        if (dto.getWorkoutDays() != null) {
            for (int i = 0; i < dto.getWorkoutDays().size(); i++) {
                WorkoutDayDTO dayDTO = dto.getWorkoutDays().get(i);
                WorkoutDay day = WorkoutDay.builder()
                        .workoutPlan(plan)
                        .dayNumber(i + 1)
                        .name(dayDTO.getName())
                        .description(dayDTO.getDescription())
                        .exercises(new LinkedHashSet<>())
                        .build();

                if (dayDTO.getExercises() != null) {
                    for (int j = 0; j < dayDTO.getExercises().size(); j++) {
                        ExerciseDTO exDTO = dayDTO.getExercises().get(j);
                        Exercise exercise = buildExerciseFromDTO(exDTO, day, j + 1, user);
                        day.getExercises().add(exercise);
                    }
                }

                plan.getWorkoutDays().add(day);
            }
        }

        // If cycle was reset, also reset the currentDayIndex
        if (shouldResetCycle) {
            plan.setCurrentDayIndex(0);
        }

        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);

        // If plan is active, regenerate future workout events from the effective date
        if (savedPlan.getIsActive()) {
            generateWorkoutEvents(savedPlan, user, shouldResetCycle, fromDate);
        }

        // Fetch the plan again with all relationships to return complete data
        return toFullPlanDTO(workoutPlanRepository.findByIdWithDaysAndExercises(savedPlan.getId())
                .orElse(savedPlan));
    }

    @Transactional
    public void deletePlan(Long id, User user) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout plan");
        }

        // Delete future uncompleted events associated with this plan
        eventRepository.deleteFutureUncompletedByWorkoutPlanIdAndUserId(id, user.getId(), LocalDate.now());

        workoutPlanRepository.delete(plan);
    }

    @Transactional
    public WorkoutPlanDTO activatePlan(Long id, User user) {
        return activatePlan(id, user, null, null);
    }

    @Transactional
    public WorkoutPlanDTO activatePlan(Long id, User user, LocalDate startDate, Integer startDayIndex) {
        // Deactivate current active plan and clear its events
        workoutPlanRepository.findByUserIdAndIsActiveTrue(user.getId())
                .ifPresent(activePlan -> {
                    activePlan.setIsActive(false);
                    workoutPlanRepository.save(activePlan);
                    clearWorkoutEvents(activePlan.getId(), user);
                });

        // Activate the new plan
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout plan");
        }

        LocalDate fromDate = startDate != null ? startDate : LocalDate.now();
        int dayIndex = startDayIndex != null ? startDayIndex : 0;

        plan.setIsActive(true);
        plan.setCurrentDayIndex(dayIndex);
        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);

        // Generate workout events for this plan
        generateWorkoutEvents(savedPlan, user, true, fromDate, dayIndex);

        // If there's a completed log for today whose workoutDay matches
        // the newly generated event for today, mark that event as completed too.
        LocalDate today = LocalDate.now();
        workoutLogRepository.findByUserIdAndWorkoutPlanIdAndDate(user.getId(), savedPlan.getId(), today)
                .filter(WorkoutLog::getCompleted)
                .ifPresent(log -> {
                    eventRepository.findByWorkoutPlanIdAndUserId(savedPlan.getId(), user.getId())
                            .stream()
                            .filter(e -> e.getDate().equals(today))
                            .filter(e -> e.getWorkoutDay() != null
                                    && e.getWorkoutDay().getId().equals(log.getWorkoutDay().getId()))
                            .findFirst()
                            .ifPresent(event -> {
                                event.setCompleted(true);
                                eventRepository.save(event);
                            });
                });

        return toFullPlanDTO(savedPlan);
    }

    @Transactional
    public void deactivatePlan(Long id, User user) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout plan");
        }

        plan.setIsActive(false);
        workoutPlanRepository.save(plan);

        // Clear workout events
        clearWorkoutEvents(id, user);
    }

    @Transactional
    public void clearWorkoutEvents(Long workoutPlanId, User user) {
        eventRepository.deleteUncompletedByWorkoutPlanIdAndUserId(workoutPlanId, user.getId());
    }

    @Transactional
    public void clearFutureWorkoutEvents(Long workoutPlanId, User user) {
        eventRepository.deleteFutureByWorkoutPlanIdAndUserId(workoutPlanId, user.getId(), LocalDate.now());
    }

    @Transactional
    public void generateWorkoutEvents(WorkoutPlan plan, User user) {
        generateWorkoutEvents(plan, user, false, LocalDate.now());
    }

    @Transactional
    public void generateWorkoutEvents(WorkoutPlan plan, User user, boolean resetCycle) {
        generateWorkoutEvents(plan, user, resetCycle, LocalDate.now());
    }

    @Transactional
    public void generateWorkoutEvents(WorkoutPlan plan, User user, boolean resetCycle, LocalDate fromDate) {
        generateWorkoutEvents(plan, user, resetCycle, fromDate, 0);
    }

    @Transactional
    public void generateWorkoutEvents(WorkoutPlan plan, User user, boolean resetCycle, LocalDate fromDate, int startDayIndex) {
        // Delete only future uncompleted events from the effective date (preserve completed history)
        eventRepository.deleteFutureUncompletedByWorkoutPlanIdAndUserId(plan.getId(), user.getId(), fromDate);

        String trainingDaysStr = plan.getTrainingDays();
        if (trainingDaysStr == null || trainingDaysStr.isEmpty()) {
            return;
        }

        List<DayOfWeek> trainingDays = Arrays.stream(trainingDaysStr.split(","))
                .map(String::trim)
                .map(DayOfWeek::valueOf)
                .toList();

        if (trainingDays.isEmpty()) {
            return;
        }

        // Get sorted workout days
        List<WorkoutDay> sortedDays = plan.getWorkoutDays().stream()
                .sorted(Comparator.comparing(WorkoutDay::getDayNumber))
                .toList();

        if (sortedDays.isEmpty()) {
            return;
        }

        // Determine starting day index
        int dayIndex = startDayIndex;
        if (!resetCycle && startDayIndex == 0) {
            // Find the last completed workout event to continue the cycle
            List<Event> existingEvents = eventRepository.findByWorkoutPlanIdAndUserId(plan.getId(), user.getId());
            Optional<Event> lastCompletedEvent = existingEvents.stream()
                    .filter(Event::getCompleted)
                    .max(Comparator.comparing(Event::getDate));

            if (lastCompletedEvent.isPresent() && lastCompletedEvent.get().getWorkoutDay() != null) {
                int lastDayNumber = lastCompletedEvent.get().getWorkoutDay().getDayNumber();
                // Next day in the cycle (wrapping around)
                dayIndex = lastDayNumber % sortedDays.size();
            }
        }

        // Collect dates that already have a completed event for this plan
        // to avoid creating duplicates
        List<Event> existingCompletedEvents = eventRepository.findByWorkoutPlanIdAndUserId(plan.getId(), user.getId());
        Set<LocalDate> completedDates = existingCompletedEvents.stream()
                .filter(Event::getCompleted)
                .map(Event::getDate)
                .collect(java.util.stream.Collectors.toSet());

        // Generate events for 8 weeks from the effective date
        LocalDate endDate = fromDate.plusWeeks(8);

        for (LocalDate date = fromDate; date.isBefore(endDate); date = date.plusDays(1)) {
            if (trainingDays.contains(date.getDayOfWeek())) {
                // Skip dates that already have a completed event
                if (!completedDates.contains(date)) {
                    WorkoutDay workoutDay = sortedDays.get(dayIndex % sortedDays.size());

                    Event event = Event.builder()
                            .user(user)
                            .title(workoutDay.getName())
                            .description(plan.getName() + " - " + workoutDay.getName())
                            .category(EventCategory.HEALTH)
                            .date(date)
                            .startTime(plan.getTrainingTime())
                            .recurring(false)
                            .completed(false)
                            .workoutPlan(plan)
                            .workoutDay(workoutDay)
                            .color("#22C55E")
                            .build();

                    eventRepository.save(event);
                }
                dayIndex++;
            }
        }
    }

    @Transactional
    public void regenerateWorkoutEvents(Long planId, User user) {
        WorkoutPlan plan = workoutPlanRepository.findByIdWithDaysAndExercises(planId)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout plan");
        }

        if (!plan.getIsActive()) {
            throw new RuntimeException("Cannot regenerate events for inactive plan");
        }

        generateWorkoutEvents(plan, user);
    }

    @Transactional
    public TodayWorkoutDTO getTodayWorkout(User user) {
        WorkoutPlan activePlan = workoutPlanRepository.findActiveByUserIdWithDaysAndExercises(user.getId())
                .orElse(null);

        if (activePlan == null || activePlan.getWorkoutDays().isEmpty()) {
            return null;
        }

        // Check if today is a training day
        LocalDate today = LocalDate.now();
        String trainingDaysStr = activePlan.getTrainingDays();
        if (trainingDaysStr == null || trainingDaysStr.isEmpty()) {
            return null;
        }

        List<DayOfWeek> trainingDays = Arrays.stream(trainingDaysStr.split(","))
                .map(String::trim)
                .map(DayOfWeek::valueOf)
                .toList();

        if (!trainingDays.contains(today.getDayOfWeek())) {
            // Today is not a training day
            return null;
        }

        // Get sorted list of workout days
        List<WorkoutDay> sortedDays = activePlan.getWorkoutDays().stream()
                .sorted(Comparator.comparing(WorkoutDay::getDayNumber))
                .toList();

        int currentIndex = activePlan.getCurrentDayIndex();
        if (currentIndex >= sortedDays.size()) {
            currentIndex = 0;
        }
        WorkoutDay currentDay = sortedDays.get(currentIndex);

        // Auto-advance: if the current day was completed on a PREVIOUS date,
        // advance to the next day in the cycle.
        // (currentDayIndex is no longer advanced in completeWorkout)
        Optional<WorkoutLog> todayLog = workoutLogRepository.findByUserIdAndWorkoutPlanIdAndDate(
                user.getId(), activePlan.getId(), today);

        if (todayLog.isEmpty()) {
            List<WorkoutLog> recentLogs = workoutLogRepository.findByUserIdAndPlanIdOrderByDateDesc(
                    user.getId(), activePlan.getId());
            if (!recentLogs.isEmpty()) {
                WorkoutLog lastLog = recentLogs.get(0);
                if (lastLog.getCompleted()
                        && lastLog.getDate().isBefore(today)
                        && lastLog.getWorkoutDay().getId().equals(currentDay.getId())) {
                    currentIndex = (currentIndex + 1) % sortedDays.size();
                    activePlan.setCurrentDayIndex(currentIndex);
                    workoutPlanRepository.save(activePlan);
                    currentDay = sortedDays.get(currentIndex);
                }
            }
        }

        // Simple check: completed today if log exists, is completed,
        // and matches the current workout day (same plan + same day = completed)
        boolean completedToday = todayLog.isPresent()
                && todayLog.get().getCompleted()
                && todayLog.get().getWorkoutDay().getId().equals(currentDay.getId());

        // Sort exercises by order
        List<ExerciseDTO> sortedExercises = currentDay.getExercises().stream()
                .sorted(Comparator.comparing(Exercise::getExerciseOrder))
                .map(this::toExerciseDTO)
                .toList();

        return TodayWorkoutDTO.builder()
                .workoutPlanId(activePlan.getId())
                .workoutPlanName(activePlan.getName())
                .workoutDayId(currentDay.getId())
                .workoutDayNumber(currentDay.getDayNumber())
                .workoutDayName(currentDay.getName())
                .workoutDayDescription(currentDay.getDescription())
                .exercises(sortedExercises)
                .alreadyCompletedToday(completedToday)
                .todayLogId(todayLog.map(WorkoutLog::getId).orElse(null))
                .autoProgression(activePlan.getAutoProgression())
                .build();
    }

    @Transactional
    public WorkoutLogDTO startTodayWorkout(User user) {
        WorkoutPlan activePlan = workoutPlanRepository.findActiveByUserIdWithDaysAndExercises(user.getId())
                .orElseThrow(() -> new RuntimeException("No active workout plan"));

        if (activePlan.getWorkoutDays().isEmpty()) {
            throw new RuntimeException("Workout plan has no days");
        }

        LocalDate today = LocalDate.now();

        // Get sorted list of workout days
        List<WorkoutDay> sortedDays = activePlan.getWorkoutDays().stream()
                .sorted(Comparator.comparing(WorkoutDay::getDayNumber))
                .toList();

        int currentIndex = activePlan.getCurrentDayIndex();
        if (currentIndex >= sortedDays.size()) {
            currentIndex = 0;
        }

        WorkoutDay currentDay = sortedDays.get(currentIndex);

        // Check if already started today for the SAME workout day
        Optional<WorkoutLog> existingLog = workoutLogRepository.findByUserIdAndWorkoutPlanIdAndDate(
                user.getId(), activePlan.getId(), today);

        if (existingLog.isPresent()
                && existingLog.get().getWorkoutDay().getId().equals(currentDay.getId())) {
            return toLogDTO(existingLog.get());
        }

        WorkoutLog log = WorkoutLog.builder()
                .user(user)
                .workoutPlan(activePlan)
                .workoutDay(currentDay)
                .date(today)
                .completed(false)
                .build();

        return toLogDTO(workoutLogRepository.save(log));
    }

    @Transactional
    public WorkoutLogDTO completeWorkout(Long logId, User user, String notes) {
        WorkoutLog log = workoutLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Workout log not found"));

        if (!log.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout log");
        }

        log.setCompleted(true);
        log.setNotes(notes);

        // Apply automatic progression if enabled
        progressionService.applyProgressionIfNeeded(log, user);

        // Mark the corresponding event as completed.
        // Find by date only (not by workoutDay) to handle cases where
        // pre-generated events got out of sync with currentDayIndex.
        List<Event> todayEvents = eventRepository.findByWorkoutPlanIdAndUserId(
                log.getWorkoutPlan().getId(), user.getId());
        todayEvents.stream()
                .filter(e -> e.getDate().equals(log.getDate()))
                .findFirst()
                .ifPresent(event -> {
                    event.setCompleted(true);
                    // Update the event to reflect the actual workout done
                    event.setWorkoutDay(log.getWorkoutDay());
                    event.setTitle(log.getWorkoutDay().getName());
                    event.setDescription(log.getWorkoutPlan().getName() + " - " + log.getWorkoutDay().getName());
                    eventRepository.save(event);
                });

        // Do NOT advance currentDayIndex here. It stays pointing to the completed day
        // so that getTodayWorkout() can match log.workoutDay == currentDay.
        // The index will auto-advance in getTodayWorkout() on the next training day.
        WorkoutPlan plan = log.getWorkoutPlan();

        // Regenerate future events starting from the NEXT day in the cycle
        int nextIndex = (plan.getCurrentDayIndex() + 1) % plan.getWorkoutDays().size();
        generateWorkoutEvents(plan, user, true, log.getDate().plusDays(1), nextIndex);

        return toLogDTO(workoutLogRepository.save(log));
    }

    @Transactional
    public void skipTodayWorkout(User user) {
        WorkoutPlan plan = workoutPlanRepository.findActiveByUserIdWithDaysAndExercises(user.getId())
                .orElseThrow(() -> new RuntimeException("No active workout plan"));

        LocalDate today = LocalDate.now();

        // Mark today's event as skipped
        List<Event> todayEvents = eventRepository.findByWorkoutPlanIdAndUserId(plan.getId(), user.getId());
        todayEvents.stream()
                .filter(e -> e.getDate().equals(today) && !e.getCompleted())
                .findFirst()
                .ifPresent(event -> {
                    event.setSkipped(true);
                    event.setCompleted(false);
                    eventRepository.save(event);
                });

        // Advance the cycle
        List<WorkoutDay> sortedDays = plan.getWorkoutDays().stream()
                .sorted(Comparator.comparing(WorkoutDay::getDayNumber))
                .toList();

        if (!sortedDays.isEmpty()) {
            int nextIndex = (plan.getCurrentDayIndex() + 1) % sortedDays.size();
            plan.setCurrentDayIndex(nextIndex);
            workoutPlanRepository.save(plan);

            // Regenerate future events from tomorrow
            generateWorkoutEvents(plan, user, true, today.plusDays(1), nextIndex);
        }
    }

    public List<WorkoutLogDTO> getWorkoutHistory(User user, Long planId) {
        if (planId != null) {
            return workoutLogRepository.findByUserIdAndPlanIdOrderByDateDesc(user.getId(), planId)
                    .stream()
                    .map(this::toLogDTO)
                    .toList();
        }
        return workoutLogRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream()
                .map(this::toLogDTO)
                .toList();
    }

    /**
     * Clone an existing workout plan.
     */
    @Transactional
    public WorkoutPlanDTO clonePlan(Long id, User user) {
        WorkoutPlan originalPlan = workoutPlanRepository.findByIdWithDaysAndExercises(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        if (!originalPlan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout plan");
        }

        // Create new plan with copied data
        WorkoutPlan clonedPlan = WorkoutPlan.builder()
                .user(user)
                .name(originalPlan.getName() + " (copia)")
                .description(originalPlan.getDescription())
                .workoutsPerWeek(originalPlan.getWorkoutsPerWeek())
                .isActive(false)
                .currentDayIndex(0)
                .trainingDays(originalPlan.getTrainingDays())
                .trainingTime(originalPlan.getTrainingTime())
                .autoProgression(originalPlan.getAutoProgression())
                .workoutDays(new LinkedHashSet<>())
                .build();

        // Clone workout days and exercises
        List<WorkoutDay> sortedDays = originalPlan.getWorkoutDays().stream()
                .sorted(Comparator.comparing(WorkoutDay::getDayNumber))
                .toList();

        for (WorkoutDay originalDay : sortedDays) {
            WorkoutDay clonedDay = WorkoutDay.builder()
                    .workoutPlan(clonedPlan)
                    .dayNumber(originalDay.getDayNumber())
                    .name(originalDay.getName())
                    .description(originalDay.getDescription())
                    .exercises(new LinkedHashSet<>())
                    .build();

            // Clone exercises
            List<Exercise> sortedExercises = originalDay.getExercises().stream()
                    .sorted(Comparator.comparing(Exercise::getExerciseOrder))
                    .toList();

            for (Exercise originalExercise : sortedExercises) {
                Exercise clonedExercise = Exercise.builder()
                        .workoutDay(clonedDay)
                        .name(originalExercise.getName())
                        .sets(originalExercise.getSets())
                        .reps(originalExercise.getReps())
                        .weight(originalExercise.getWeight())
                        .useTwoDumbbells(originalExercise.getUseTwoDumbbells())
                        .restSeconds(originalExercise.getRestSeconds())
                        .notes(originalExercise.getNotes())
                        .exerciseOrder(originalExercise.getExerciseOrder())
                        .exerciseTemplate(originalExercise.getExerciseTemplate())
                        .minReps(originalExercise.getMinReps())
                        .maxReps(originalExercise.getMaxReps())
                        .build();
                clonedDay.getExercises().add(clonedExercise);
            }

            clonedPlan.getWorkoutDays().add(clonedDay);
        }

        return toFullPlanDTO(workoutPlanRepository.save(clonedPlan));
    }

    /**
     * Get preview info about what will happen if the plan is updated.
     */
    public Map<String, Object> getUpdatePreview(Long id, WorkoutPlanDTO dto, User user) {
        WorkoutPlan plan = workoutPlanRepository.findByIdWithDaysAndExercises(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to workout plan");
        }

        int oldDayCount = plan.getWorkoutDays().size();
        int newDayCount = dto.getWorkoutDays() != null ? dto.getWorkoutDays().size() : 0;
        boolean cycleWillChange = oldDayCount != newDayCount;

        // Find the last completed workout and next day info
        List<Event> existingEvents = eventRepository.findByWorkoutPlanIdAndUserId(plan.getId(), user.getId());
        Optional<Event> lastCompletedEvent = existingEvents.stream()
                .filter(Event::getCompleted)
                .max(Comparator.comparing(Event::getDate));

        int nextDayNumber = 1;
        String lastCompletedDayName = null;
        String lastCompletedDate = null;

        if (lastCompletedEvent.isPresent() && lastCompletedEvent.get().getWorkoutDay() != null) {
            int lastDayNumber = lastCompletedEvent.get().getWorkoutDay().getDayNumber();
            lastCompletedDayName = lastCompletedEvent.get().getWorkoutDay().getName();
            lastCompletedDate = lastCompletedEvent.get().getDate().toString();

            if (!cycleWillChange && newDayCount > 0) {
                // Next day in the cycle (wrapping around)
                nextDayNumber = (lastDayNumber % newDayCount) + 1;
            }
        }

        Map<String, Object> preview = new HashMap<>();
        preview.put("oldDayCount", oldDayCount);
        preview.put("newDayCount", newDayCount);
        preview.put("cycleWillChange", cycleWillChange);
        preview.put("nextDayNumber", nextDayNumber);
        preview.put("lastCompletedDayName", lastCompletedDayName);
        preview.put("lastCompletedDate", lastCompletedDate);
        preview.put("planIsActive", plan.getIsActive());

        return preview;
    }

    private WorkoutPlanDTO toPlanDTO(WorkoutPlan plan) {
        WorkoutPlanDTO dto = WorkoutPlanDTO.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .workoutsPerWeek(plan.getWorkoutsPerWeek())
                .isActive(plan.getIsActive())
                .currentDayIndex(plan.getCurrentDayIndex())
                .trainingTime(plan.getTrainingTime())
                .autoProgression(plan.getAutoProgression())
                .build();
        dto.setTrainingDaysFromString(plan.getTrainingDays());
        return dto;
    }

    private WorkoutPlanDTO toFullPlanDTO(WorkoutPlan plan) {
        WorkoutPlanDTO dto = toPlanDTO(plan);
        dto.setWorkoutDays(plan.getWorkoutDays().stream()
                .sorted(Comparator.comparing(WorkoutDay::getDayNumber))
                .map(this::toDayDTO)
                .toList());
        return dto;
    }

    private WorkoutDayDTO toDayDTO(WorkoutDay day) {
        return WorkoutDayDTO.builder()
                .id(day.getId())
                .dayNumber(day.getDayNumber())
                .name(day.getName())
                .description(day.getDescription())
                .exercises(day.getExercises().stream()
                        .sorted(Comparator.comparing(Exercise::getExerciseOrder))
                        .map(this::toExerciseDTO)
                        .toList())
                .build();
    }

    private ExerciseDTO toExerciseDTO(Exercise exercise) {
        ExerciseDTO.ExerciseDTOBuilder builder = ExerciseDTO.builder()
                .id(exercise.getId())
                .name(exercise.getName())
                .sets(exercise.getSets())
                .reps(exercise.getReps())
                .weight(exercise.getWeight())
                .useTwoDumbbells(exercise.getUseTwoDumbbells())
                .restSeconds(exercise.getRestSeconds())
                .notes(exercise.getNotes())
                .exerciseOrder(exercise.getExerciseOrder());

        // Prioritize exercise's own minReps/maxReps, fallback to template
        Integer minReps = exercise.getMinReps();
        Integer maxReps = exercise.getMaxReps();

        if (exercise.getExerciseTemplate() != null) {
            builder.exerciseTemplateId(exercise.getExerciseTemplate().getId())
                    .muscleGroup(exercise.getExerciseTemplate().getMuscleGroup());
            if (minReps == null) {
                minReps = exercise.getExerciseTemplate().getMinReps();
            }
            if (maxReps == null) {
                maxReps = exercise.getExerciseTemplate().getMaxReps();
            }
        }

        builder.minReps(minReps);
        builder.maxReps(maxReps);

        return builder.build();
    }

    private WorkoutLogDTO toLogDTO(WorkoutLog log) {
        return WorkoutLogDTO.builder()
                .id(log.getId())
                .workoutPlanId(log.getWorkoutPlan().getId())
                .workoutPlanName(log.getWorkoutPlan().getName())
                .workoutDayId(log.getWorkoutDay().getId())
                .workoutDayName(log.getWorkoutDay().getName())
                .workoutDayNumber(log.getWorkoutDay().getDayNumber())
                .date(log.getDate())
                .completed(log.getCompleted())
                .notes(log.getNotes())
                .build();
    }
}
