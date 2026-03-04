package com.tuttogionni.service;

import com.tuttogionni.dto.MediaItemDTO;
import com.tuttogionni.model.MediaItem;
import com.tuttogionni.model.MediaStatus;
import com.tuttogionni.model.User;
import com.tuttogionni.repository.MediaItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MediaItemService {

    private final MediaItemRepository mediaItemRepository;

    public List<MediaItemDTO> getAllMediaItems(User user) {
        return mediaItemRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public MediaItemDTO getMediaItemById(Long id, User user) {
        MediaItem item = mediaItemRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Media item not found"));
        return toDTO(item);
    }

    @Transactional
    public MediaItemDTO createMediaItem(MediaItemDTO dto, User user) {
        MediaItem item = MediaItem.builder()
                .user(user)
                .title(dto.getTitle())
                .mediaType(dto.getMediaType())
                .status(dto.getStatus())
                .rating(dto.getRating())
                .notes(dto.getNotes())
                .favorite(dto.getFavorite() != null ? dto.getFavorite() : false)
                .build();

        MediaItem saved = mediaItemRepository.save(item);
        return toDTO(saved);
    }

    @Transactional
    public MediaItemDTO updateMediaItem(Long id, MediaItemDTO dto, User user) {
        MediaItem item = mediaItemRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Media item not found"));

        item.setTitle(dto.getTitle());
        item.setMediaType(dto.getMediaType());
        item.setStatus(dto.getStatus());
        item.setRating(dto.getRating());
        item.setNotes(dto.getNotes());
        if (dto.getFavorite() != null) {
            item.setFavorite(dto.getFavorite());
        }

        MediaItem saved = mediaItemRepository.save(item);
        return toDTO(saved);
    }

    @Transactional
    public void deleteMediaItem(Long id, User user) {
        MediaItem item = mediaItemRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Media item not found"));
        mediaItemRepository.delete(item);
    }

    @Transactional
    public MediaItemDTO toggleFavorite(Long id, User user) {
        MediaItem item = mediaItemRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Media item not found"));

        item.setFavorite(!Boolean.TRUE.equals(item.getFavorite()));
        MediaItem saved = mediaItemRepository.save(item);
        return toDTO(saved);
    }

    private MediaItemDTO toDTO(MediaItem item) {
        return MediaItemDTO.builder()
                .id(item.getId())
                .title(item.getTitle())
                .mediaType(item.getMediaType())
                .status(item.getStatus())
                .rating(item.getRating())
                .notes(item.getNotes())
                .favorite(item.getFavorite())
                .build();
    }
}
