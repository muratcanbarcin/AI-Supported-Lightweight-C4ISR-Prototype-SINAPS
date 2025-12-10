package com.sinaps.c4isr_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TelemetryService {

    private final TelemetryRepository repository;
    private final ObjectMapper objectMapper; // JSON dönüşümü için
    private final GeometryFactory geometryFactory; // PostGIS Point oluşturmak için

    // Constructor Injection (En sağlıklı yöntem)
    public TelemetryService(TelemetryRepository repository) {
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
        // SRID 4326: GPS Koordinat sistemi (WGS84)
        this.geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    }

    /**
     * SIN-10: Gelen MQTT mesajını işler ve kaydeder.
     * Class Diagram: processIncomingData [cite: 41]
     */
    public void processIncomingData(String jsonPayload) {
        try {
            // 1. JSON'ı oku
            JsonNode node = objectMapper.readTree(jsonPayload);

            // 2. Entity nesnesini oluştur
            Telemetry telemetry = new Telemetry();

            // JSON içindeki alanları Entity'ye eşle
            // Not: Simülatörden gelen veri yapısına göre buraları güncelleyebiliriz.
            // Örnek JSON: {"source_id": "drone1", "lat": 39.9, "lon": 32.8, "type": "DRONE"}
            if (node.has("source_id")) {
                telemetry.setSourceId(node.get("source_id").asText());
            } else {
                // ID yoksa işlem yapma veya logla
                System.err.println("Hata: source_id eksik -> " + jsonPayload);
                return;
            }

            // Asset Type belirleme (Enum)
            String typeStr = node.has("source_type") ? node.get("source_type").asText() : "UNKNOWN";
            try {
                telemetry.setSourceType(AssetType.valueOf(typeStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Enum'da yoksa varsayılan olarak SENSOR atayabiliriz veya null bırakabiliriz
                telemetry.setSourceType(AssetType.SENSOR);
            }

            // Sayısal veriler
            double lat = node.has("lat") ? node.get("lat").asDouble() : 0.0;
            double lon = node.has("lon") ? node.get("lon").asDouble() : 0.0;

            telemetry.setLatitude(lat);
            telemetry.setLongitude(lon);
            telemetry.setAltitude(node.has("alt") ? node.get("alt").asDouble() : 0.0);
            telemetry.setSpeed(node.has("speed") ? node.get("speed").asDouble() : 0.0);
            telemetry.setBatteryLevel(node.has("battery") ? node.get("battery").asInt() : 0);

            // 3. PostGIS Noktasını Oluştur (Harita sorguları için kritik)
            // Dikkat: Point(x, y) -> Point(Longitude, Latitude) sırasıyla alır.
            Point point = geometryFactory.createPoint(new Coordinate(lon, lat));
            telemetry.setLocation(point);

            // 4. Zaman ve Ham Veri
            telemetry.setTimestamp(LocalDateTime.now()); // Simülatörden timestamp gelirse onu da parse edebiliriz
            telemetry.setPayload(jsonPayload); // Ham veriyi kaybetmemek için

            // 5. Veritabanına Kaydet
            repository.save(telemetry);

            System.out.println(">> Veri Kaydedildi: " + telemetry.getSourceId() + " | Konum: " + lat + ", " + lon);

        } catch (Exception e) {
            System.err.println("JSON Parse Hatası: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // SIN-11 için kullanılacak (Sonraki adımda Controller burayı çağıracak)
    public List<Telemetry> getLatestTelemetry() {
        return repository.findLatestTelemetryBySource();
    }
}