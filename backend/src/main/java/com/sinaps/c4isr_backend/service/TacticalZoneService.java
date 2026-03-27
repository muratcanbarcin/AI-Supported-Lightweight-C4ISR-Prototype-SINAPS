package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.ZoneType;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TacticalZoneService {

    private final TacticalZoneRepository zoneRepository;
    private final AppUserRepository appUserRepository;

    public List<TacticalZone> getAllZones() {
        AppUser currentUser = getCurrentAppUser();

        if (currentUser.getRole() == Role.KARARGAH_ADMIN) {
            return zoneRepository.findAll();
        }

        if (currentUser.getRole() == Role.HAREKAT_SUBAYI) {
            List<TacticalZone> result = new ArrayList<>(zoneRepository.findByZoneType(ZoneType.BASE));
            String assignedZoneId = currentUser.getAssignedZoneId();
            if (assignedZoneId == null || assignedZoneId.isBlank()) {
                return result;
            }

            try {
                UUID operationZoneId = UUID.fromString(assignedZoneId);
                zoneRepository.findById(operationZoneId)
                        .filter(zone -> zone.getZoneType() == ZoneType.OPERATION_AREA)
                        .ifPresent(zone -> {
                            if (result.stream().noneMatch(existing -> existing.getId().equals(zone.getId()))) {
                                result.add(zone);
                            }
                        });
            } catch (IllegalArgumentException ignored) {
                // assignedZoneId is not a valid UUID; return bases only.
            }
            return result;
        }

        return List.of();
    }

    private AppUser getCurrentAppUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        String username = authentication.getName();
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + username));
    }
}
