package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.Asset;
import com.sinaps.c4isr_backend.model.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, String> {
    Optional<Asset> findByName(String name);

    List<Asset> findByType(AssetType type);

    List<Asset> findByIsSimulated(Boolean isSimulated);

    List<Asset> findByAssignedZoneId(String assignedZoneId);

    boolean existsByName(String name);
}
