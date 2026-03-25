package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.ZoneType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TacticalZoneRepository extends JpaRepository<TacticalZone, UUID> {

    List<TacticalZone> findByZoneType(ZoneType zoneType);

    boolean existsByName(String name);
}
