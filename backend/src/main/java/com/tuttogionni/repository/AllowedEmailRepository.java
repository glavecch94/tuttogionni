package com.tuttogionni.repository;

import com.tuttogionni.model.AllowedEmail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AllowedEmailRepository extends JpaRepository<AllowedEmail, Long> {
    boolean existsByEmailIgnoreCase(String email);
}
