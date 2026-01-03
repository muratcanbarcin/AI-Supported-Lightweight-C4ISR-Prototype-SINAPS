package com.sinaps.c4isr_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Telemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", nullable = false)
    private String sourceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type")
    private AssetType sourceType;

    private Double latitude;
    private Double longitude;
    private Double altitude;

    private Double speed;

    @Column(name = "battery_level")
    private Integer batteryLevel;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Column(columnDefinition = "jsonb")
    private String payload;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
