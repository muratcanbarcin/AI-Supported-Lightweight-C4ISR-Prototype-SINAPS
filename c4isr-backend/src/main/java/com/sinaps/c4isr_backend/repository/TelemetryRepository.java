package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.Telemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {

    // SIN-11 için Kritik:
    // Her bir cihazın (source_id) gönderdiği EN SON veriyi getiren özel sorgu.
    // Haritada sadece son konumu göstermek için bunu kullanacağız.
    @Query("SELECT t FROM Telemetry t WHERE t.timestamp IN " +
            "(SELECT MAX(t2.timestamp) FROM Telemetry t2 GROUP BY t2.sourceId)")
    List<Telemetry> findLatestTelemetryBySource();

    // Belirli bir cihazın geçmiş verisini çekmek için (Class Diagram: findTopBySourceId...) [cite: 59]
    Telemetry findTopBySourceIdOrderByTimestampDesc(String sourceId);
}