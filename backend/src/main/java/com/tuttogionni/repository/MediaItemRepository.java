package com.tuttogionni.repository;

import com.tuttogionni.model.MediaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaItemRepository extends JpaRepository<MediaItem, Long> {

    List<MediaItem> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<MediaItem> findByIdAndUserId(Long id, Long userId);

    List<MediaItem> findByUserIdAndMediaTypeOrderByCreatedAtDesc(Long userId, String mediaType);
}
