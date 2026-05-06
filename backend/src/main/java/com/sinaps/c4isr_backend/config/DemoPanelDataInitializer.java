package com.sinaps.c4isr_backend.config;

import com.sinaps.c4isr_backend.model.AiAnalysis;
import com.sinaps.c4isr_backend.model.SystemLog;
import com.sinaps.c4isr_backend.repository.AiAnalysisRepository;
import com.sinaps.c4isr_backend.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Admin paneli ve Uyarılar sayfası için tekrar üretilebilir demo verisi (SINAPS_PANEL_DEMO işaretli).
 */
@Slf4j
@Component
@Order(25)
@RequiredArgsConstructor
public class DemoPanelDataInitializer implements CommandLineRunner {

    private static final String MARKER = "SINAPS_PANEL_DEMO";

    private final SystemLogRepository systemLogRepository;
    private final AiAnalysisRepository aiAnalysisRepository;

    @Override
    public void run(String... args) {
        seedDemoSystemLogs();
        seedDemoAiAnalyses();
    }

    private void seedDemoSystemLogs() {
        if (systemLogRepository.countByMessageContainingIgnoreCase(MARKER) > 0) {
            return;
        }
        List<SystemLog> rows = new ArrayList<>();
        rows.add(SystemLog.builder().assetId(null).eventType("SYSTEM").message(MARKER + " — SINAPS C4ISR arka uç başlatıldı; PostgreSQL bağlantısı doğrulandı.").build());
        rows.add(SystemLog.builder().assetId("TCG-ANADOLU-L400").eventType("DEPLOYMENT").message(MARKER + " — Donanma varlığı görev bölgesiyle eşlendi.").build());
        rows.add(SystemLog.builder().assetId("161-FILO-YARASA-TB2-01").eventType("TELEMETRY").message(MARKER + " — Simülasyon motoru telemetri akışını sürdürüyor.").build());
        rows.add(SystemLog.builder().assetId(null).eventType("AI_PIPELINE").message(MARKER + " — Gemma tehdit analizi kuyruğu hazır (ai.service.url).").build());
        rows.add(SystemLog.builder().assetId(null).eventType("MQTT").message(MARKER + " — MQTT dinleyici yapılandırması yüklendi.").build());
        rows.add(SystemLog.builder().assetId("AKSUNGUR-DZKK-01").eventType("MODE_CHANGE").message(MARKER + " — İHA gözetleme modu: AUTO.").build());
        rows.add(SystemLog.builder().assetId(null).eventType("SECURITY").message(MARKER + " — JWT doğrulama filtresi aktif.").build());
        rows.add(SystemLog.builder().assetId("JOH-TIM-ALFA").eventType("PATROL").message(MARKER + " — Özel harekât timi devriye zamanı güncellendi.").build());
        systemLogRepository.saveAll(rows);
        log.info("✅  Demo sistem logları eklendi ({} satır).", rows.size());
    }

    private void seedDemoAiAnalyses() {
        if (aiAnalysisRepository.countByRecommendationContainingIgnoreCase(MARKER) > 0) {
            return;
        }
        List<AiAnalysis> rows = new ArrayList<>();
        rows.add(AiAnalysis.builder()
                .assetId("161-FILO-YARASA-TB2-01")
                .threatLevel("HIGH")
                .recommendation(MARKER + " — Bölgede olağandışı yoğunluk; keşif devriyesi önerilir.")
                .isAlert(true)
                .build());
        rows.add(AiAnalysis.builder()
                .assetId("TCG-ISTANBUL-F515")
                .threatLevel("MEDIUM")
                .recommendation(MARKER + " — Deniz yüzeyi trafiği artışı; radar takibi sürdürülmeli.")
                .isAlert(true)
                .build());
        rows.add(AiAnalysis.builder()
                .assetId("MAVI-TB2-01")
                .threatLevel("CRITICAL")
                .recommendation(MARKER + " — Düşük irtifa ve sınır yakınlığı; üst makama bilgi verin.")
                .isAlert(true)
                .build());
        rows.add(AiAnalysis.builder()
                .assetId("PENCE-TB2-01")
                .threatLevel("MEDIUM")
                .recommendation(MARKER + " — Haberleşme gecikmesi; yedek frekans deneyin.")
                .isAlert(true)
                .build());
        aiAnalysisRepository.saveAll(rows);
        log.info("✅  Demo AI uyarı analizleri eklendi ({} kayıt, isAlert=true).", rows.size());
    }
}
