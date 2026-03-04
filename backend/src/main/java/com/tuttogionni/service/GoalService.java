package com.tuttogionni.service;

import com.tuttogionni.dto.GoalDTO;
import com.tuttogionni.model.*;
import com.tuttogionni.repository.EventRepository;
import com.tuttogionni.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final EventRepository eventRepository;

    public List<GoalDTO> getAllGoals(User user) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public GoalDTO getGoalById(Long id, User user) {
        Goal goal = goalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        return toDTO(goal);
    }

    @Transactional
    public GoalDTO createGoal(GoalDTO dto, User user) {
        Goal goal = Goal.builder()
                .user(user)
                .name(dto.getName())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .frequency(dto.getFrequency())
                .frequencyConfig(dto.getFrequencyConfigAsString())
                .scheduledTime(dto.getScheduledTime())
                .color(dto.getColor())
                .icon(dto.getIcon())
                .active(dto.getActive() != null ? dto.getActive() : false)
                .preconfiguredKey(dto.getPreconfiguredKey())
                .build();

        Goal savedGoal = goalRepository.save(goal);

        if (Boolean.TRUE.equals(savedGoal.getActive())) {
            generateGoalEvents(savedGoal, user);
        }

        return toDTO(savedGoal);
    }

    @Transactional
    public GoalDTO updateGoal(Long id, GoalDTO dto, User user) {
        Goal goal = goalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        goal.setName(dto.getName());
        goal.setDescription(dto.getDescription());
        goal.setCategory(dto.getCategory());
        goal.setFrequency(dto.getFrequency());
        goal.setFrequencyConfig(dto.getFrequencyConfigAsString());
        goal.setScheduledTime(dto.getScheduledTime());
        goal.setColor(dto.getColor());
        goal.setIcon(dto.getIcon());
        if (dto.getPreconfiguredKey() != null) {
            goal.setPreconfiguredKey(dto.getPreconfiguredKey());
        }

        Goal savedGoal = goalRepository.save(goal);

        if (Boolean.TRUE.equals(savedGoal.getActive())) {
            // Regenerate future events
            eventRepository.deleteFutureUncompletedByGoalIdAndUserId(savedGoal.getId(), user.getId(), LocalDate.now());
            generateGoalEvents(savedGoal, user);
        }

        return toDTO(savedGoal);
    }

    @Transactional
    public void deleteGoal(Long id, User user) {
        Goal goal = goalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        // Delete future uncompleted events; completed events remain as history (goal_id becomes NULL via ON DELETE SET NULL)
        eventRepository.deleteFutureUncompletedByGoalIdAndUserId(id, user.getId(), LocalDate.now());

        goalRepository.delete(goal);
    }

    @Transactional
    public GoalDTO activateGoal(Long id, User user) {
        Goal goal = goalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        goal.setActive(true);
        Goal savedGoal = goalRepository.save(goal);

        generateGoalEvents(savedGoal, user);

        return toDTO(savedGoal);
    }

    @Transactional
    public GoalDTO deactivateGoal(Long id, User user) {
        Goal goal = goalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        goal.setActive(false);
        Goal savedGoal = goalRepository.save(goal);

        // Remove future uncompleted events
        eventRepository.deleteUncompletedByGoalIdAndUserId(id, user.getId());

        return toDTO(savedGoal);
    }

    @Transactional
    public void generateGoalEvents(Goal goal, User user) {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusWeeks(8);

        // Collect dates that already have events for this goal to avoid duplicates
        Set<LocalDate> existingDates = new HashSet<>();
        eventRepository.findByGoalIdAndUserId(goal.getId(), user.getId())
                .forEach(e -> existingDates.add(e.getDate()));

        List<LocalDate> eventDates = calculateEventDates(goal, startDate, endDate);
        EventCategory eventCategory = mapGoalCategoryToEventCategory(goal.getCategory());
        String color = goal.getColor() != null ? goal.getColor() : "#14B8A6"; // teal-500

        for (LocalDate date : eventDates) {
            if (!existingDates.contains(date)) {
                Event event = Event.builder()
                        .user(user)
                        .title(goal.getName())
                        .description(goal.getDescription())
                        .category(eventCategory)
                        .date(date)
                        .startTime(goal.getScheduledTime())
                        .recurring(false)
                        .completed(false)
                        .goal(goal)
                        .color(color)
                        .build();

                eventRepository.save(event);
            }
        }
    }

    public List<LocalDate> calculateEventDates(Goal goal, LocalDate startDate, LocalDate endDate) {
        List<LocalDate> dates = new ArrayList<>();

        switch (goal.getFrequency()) {
            case DAILY:
                for (LocalDate date = startDate; date.isBefore(endDate); date = date.plusDays(1)) {
                    dates.add(date);
                }
                break;

            case WEEKLY:
                List<DayOfWeek> weekDays = parseWeekDays(goal.getFrequencyConfig());
                if (weekDays.isEmpty()) {
                    // Default to the current day of week
                    weekDays = List.of(startDate.getDayOfWeek());
                }
                for (LocalDate date = startDate; date.isBefore(endDate); date = date.plusDays(1)) {
                    if (weekDays.contains(date.getDayOfWeek())) {
                        dates.add(date);
                    }
                }
                break;

            case BIWEEKLY:
                List<DayOfWeek> biweekDays = parseWeekDays(goal.getFrequencyConfig());
                if (biweekDays.isEmpty()) {
                    biweekDays = List.of(startDate.getDayOfWeek());
                }
                // Generate for every other week
                LocalDate weekStart = startDate;
                boolean isActiveWeek = true;
                while (weekStart.isBefore(endDate)) {
                    if (isActiveWeek) {
                        for (LocalDate date = weekStart; date.isBefore(weekStart.plusWeeks(1)) && date.isBefore(endDate); date = date.plusDays(1)) {
                            if (biweekDays.contains(date.getDayOfWeek())) {
                                dates.add(date);
                            }
                        }
                    }
                    weekStart = weekStart.plusWeeks(1);
                    isActiveWeek = !isActiveWeek;
                }
                break;

            case MONTHLY:
                List<Integer> monthDays = parseMonthDays(goal.getFrequencyConfig());
                if (monthDays.isEmpty()) {
                    monthDays = List.of(startDate.getDayOfMonth());
                }
                for (LocalDate date = startDate; date.isBefore(endDate); date = date.plusDays(1)) {
                    if (monthDays.contains(date.getDayOfMonth())) {
                        dates.add(date);
                    }
                }
                break;
        }

        return dates;
    }

    private List<DayOfWeek> parseWeekDays(String config) {
        if (config == null || config.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(config.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(DayOfWeek::valueOf)
                .toList();
    }

    private List<Integer> parseMonthDays(String config) {
        if (config == null || config.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(config.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();
    }

    private EventCategory mapGoalCategoryToEventCategory(GoalCategory goalCategory) {
        return switch (goalCategory) {
            case SALUTE -> EventCategory.HEALTH;
            case BENESSERE -> EventCategory.PERSONAL;
            case STUDIO_FORMAZIONE -> EventCategory.EDUCATION;
            case PRODUTTIVITA -> EventCategory.WORK;
            case FINANZA -> EventCategory.FINANCE;
            case SOCIALE -> EventCategory.SOCIAL;
            case CRESCITA_PERSONALE -> EventCategory.PERSONAL;
            case INTRATTENIMENTO -> EventCategory.PERSONAL;
            case ALTRO -> EventCategory.OTHER;
        };
    }

    private GoalDTO toDTO(Goal goal) {
        GoalDTO dto = GoalDTO.builder()
                .id(goal.getId())
                .name(goal.getName())
                .description(goal.getDescription())
                .category(goal.getCategory())
                .frequency(goal.getFrequency())
                .scheduledTime(goal.getScheduledTime())
                .color(goal.getColor())
                .icon(goal.getIcon())
                .active(goal.getActive())
                .preconfiguredKey(goal.getPreconfiguredKey())
                .build();
        dto.setFrequencyConfigFromString(goal.getFrequencyConfig());
        return dto;
    }
}
