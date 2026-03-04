package com.tuttogionni.controller;

import com.tuttogionni.dto.MediaItemDTO;
import com.tuttogionni.model.User;
import com.tuttogionni.service.MediaItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@Tag(name = "Media", description = "Media tracking endpoints")
@SecurityRequirement(name = "bearerAuth")
public class MediaController {

    private final MediaItemService mediaItemService;

    @GetMapping
    @Operation(summary = "Get all media items for the authenticated user")
    public ResponseEntity<List<MediaItemDTO>> getAllMediaItems(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mediaItemService.getAllMediaItems(user));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific media item by ID")
    public ResponseEntity<MediaItemDTO> getMediaItemById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mediaItemService.getMediaItemById(id, user));
    }

    @PostMapping
    @Operation(summary = "Create a new media item")
    public ResponseEntity<MediaItemDTO> createMediaItem(
            @Valid @RequestBody MediaItemDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mediaItemService.createMediaItem(dto, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing media item")
    public ResponseEntity<MediaItemDTO> updateMediaItem(
            @PathVariable Long id,
            @Valid @RequestBody MediaItemDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mediaItemService.updateMediaItem(id, dto, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a media item")
    public ResponseEntity<Void> deleteMediaItem(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        mediaItemService.deleteMediaItem(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/favorite")
    @Operation(summary = "Toggle favorite status of a media item")
    public ResponseEntity<MediaItemDTO> toggleFavorite(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mediaItemService.toggleFavorite(id, user));
    }
}
