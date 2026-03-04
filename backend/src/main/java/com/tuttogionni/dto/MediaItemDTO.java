package com.tuttogionni.dto;

import com.tuttogionni.model.MediaStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaItemDTO {

    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Media type is required")
    private String mediaType;

    @NotNull(message = "Status is required")
    private MediaStatus status;

    private Integer rating;

    private String notes;

    private Boolean favorite;
}
