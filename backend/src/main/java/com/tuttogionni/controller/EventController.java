package com.tuttogionni.controller;

import com.tuttogionni.dto.EventDTO;
import com.tuttogionni.model.EventCategory;
import com.tuttogionni.model.User;
import com.tuttogionni.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class EventController {

    private final EventService eventService;

    @GetMapping
    @Operation(summary = "Get all events for the authenticated user")
    public ResponseEntity<List<EventDTO>> getAllEvents(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.getAllEvents(user));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific event by ID")
    public ResponseEntity<EventDTO> getEventById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.getEventById(id, user));
    }

    @GetMapping("/range")
    @Operation(summary = "Get events within a date range")
    public ResponseEntity<List<EventDTO>> getEventsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.getEventsByDateRange(user, startDate, endDate));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get events by category")
    public ResponseEntity<List<EventDTO>> getEventsByCategory(
            @PathVariable EventCategory category,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.getEventsByCategory(user, category));
    }

    @GetMapping("/weekly")
    @Operation(summary = "Get events for a specific week")
    public ResponseEntity<List<EventDTO>> getWeeklyEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal User user) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(eventService.getWeeklyEvents(user, targetDate));
    }

    @GetMapping("/monthly")
    @Operation(summary = "Get events for a specific month")
    public ResponseEntity<List<EventDTO>> getMonthlyEvents(
            @RequestParam int year,
            @RequestParam int month,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.getMonthlyEvents(user, year, month));
    }

    @PostMapping
    @Operation(summary = "Create a new event")
    public ResponseEntity<EventDTO> createEvent(
            @Valid @RequestBody EventDTO eventDTO,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.createEvent(eventDTO, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing event")
    public ResponseEntity<EventDTO> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventDTO eventDTO,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.updateEvent(id, eventDTO, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an event")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        eventService.deleteEvent(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-complete")
    @Operation(summary = "Toggle event completion status")
    public ResponseEntity<EventDTO> toggleComplete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.toggleComplete(id, user));
    }

    @PatchMapping("/{id}/skip")
    @Operation(summary = "Skip an event")
    public ResponseEntity<EventDTO> skipEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.skipEvent(id, user));
    }

    @PatchMapping("/{id}/reschedule")
    @Operation(summary = "Reschedule an event to a new date/time")
    public ResponseEntity<EventDTO> rescheduleEvent(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime newTime,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(eventService.rescheduleEvent(id, newDate, newTime, user));
    }
}
