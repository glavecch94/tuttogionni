package com.tuttogionni.service;

import com.tuttogionni.dto.EventDTO;
import com.tuttogionni.model.Event;
import com.tuttogionni.model.EventCategory;
import com.tuttogionni.model.User;
import com.tuttogionni.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public List<EventDTO> getAllEvents(User user) {
        return eventRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public EventDTO getEventById(Long id, User user) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to event");
        }

        return toDTO(event);
    }

    public List<EventDTO> getEventsByDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return eventRepository.findByUserIdAndDateBetweenOrderByDateAsc(user.getId(), startDate, endDate)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<EventDTO> getEventsByCategory(User user, EventCategory category) {
        return eventRepository.findByUserIdAndCategoryOrderByDateDesc(user.getId(), category)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<EventDTO> getWeeklyEvents(User user, LocalDate date) {
        LocalDate startOfWeek = date.with(DayOfWeek.MONDAY);
        LocalDate endOfWeek = date.with(DayOfWeek.SUNDAY);
        return eventRepository.findWeeklyEvents(user.getId(), startOfWeek, endOfWeek)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<EventDTO> getMonthlyEvents(User user, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();
        return eventRepository.findMonthlyEvents(user.getId(), startOfMonth, endOfMonth)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public EventDTO createEvent(EventDTO dto, User user) {
        Event event = Event.builder()
                .user(user)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .location(dto.getLocation())
                .recurring(dto.getRecurring() != null ? dto.getRecurring() : false)
                .recurrencePattern(dto.getRecurrencePattern())
                .color(dto.getColor())
                .completed(dto.getCompleted() != null ? dto.getCompleted() : false)
                .build();

        return toDTO(eventRepository.save(event));
    }

    @Transactional
    public EventDTO updateEvent(Long id, EventDTO dto, User user) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to event");
        }

        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setCategory(dto.getCategory());
        event.setDate(dto.getDate());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setLocation(dto.getLocation());
        event.setRecurring(dto.getRecurring() != null ? dto.getRecurring() : event.getRecurring());
        event.setRecurrencePattern(dto.getRecurrencePattern());
        event.setColor(dto.getColor());
        if (dto.getCompleted() != null) {
            event.setCompleted(dto.getCompleted());
        }

        return toDTO(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long id, User user) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to event");
        }

        eventRepository.delete(event);
    }

    @Transactional
    public EventDTO toggleComplete(Long id, User user) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to event");
        }

        event.setCompleted(!event.getCompleted());
        if (event.getCompleted()) {
            event.setSkipped(false);
        }
        return toDTO(eventRepository.save(event));
    }

    @Transactional
    public EventDTO skipEvent(Long id, User user) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to event");
        }

        event.setSkipped(true);
        event.setCompleted(false);
        return toDTO(eventRepository.save(event));
    }

    @Transactional
    public EventDTO rescheduleEvent(Long id, LocalDate newDate, LocalTime newTime, User user) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to event");
        }

        event.setDate(newDate);
        if (newTime != null) {
            event.setStartTime(newTime);
        }
        event.setSkipped(false);
        event.setCompleted(false);
        return toDTO(eventRepository.save(event));
    }

    private EventDTO toDTO(Event event) {
        return EventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .category(event.getCategory())
                .date(event.getDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .location(event.getLocation())
                .recurring(event.getRecurring())
                .recurrencePattern(event.getRecurrencePattern())
                .color(event.getColor())
                .completed(event.getCompleted())
                .skipped(event.getSkipped())
                .workoutPlanId(event.getWorkoutPlan() != null ? event.getWorkoutPlan().getId() : null)
                .workoutDayId(event.getWorkoutDay() != null ? event.getWorkoutDay().getId() : null)
                .workoutPlanName(event.getWorkoutPlan() != null ? event.getWorkoutPlan().getName() : null)
                .workoutDayName(event.getWorkoutDay() != null ? event.getWorkoutDay().getName() : null)
                .goalId(event.getGoal() != null ? event.getGoal().getId() : null)
                .goalName(event.getGoal() != null ? event.getGoal().getName() : null)
                .build();
    }
}
