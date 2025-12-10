package com.sinaps.c4isr_backend.service;

import jakarta.annotation.PostConstruct;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MqttListenerService implements MqttCallback {

    // Adım 3'te yazdığımız servisi buraya çağırıyoruz (Dependency Injection)
    private final TelemetryService telemetryService;

    // Paho MQTT Client nesnesi
    private MqttClient client;

    // application.properties'den okunan değer
    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    // Class Diagram'daki Topic Yapısı [cite: 26]
    // "c4isr/+/telemetry" -> "+" işareti wildcard'dır.
    // Yani: c4isr/drone1/telemetry, c4isr/soldierA/telemetry hepsini dinler.
    private static final String TOPIC_PATTERN = "c4isr/+/telemetry";

    public MqttListenerService(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * Uygulama ayağa kalkar kalkmaz bu metod çalışır (@PostConstruct)
     * ve Broker'a bağlanır.
     */
    @PostConstruct
    public void connect() {
        try {
            System.out.println("MQTT Broker'a bağlanılıyor: " + brokerUrl);

            // Her bağlantı için benzersiz bir ID oluşturur
            String clientId = MqttClient.generateClientId();
            client = new MqttClient(brokerUrl, clientId);

            // Bağlantı seçenekleri
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true); // Her bağlandığında temiz sayfa aç
            options.setAutomaticReconnect(true); // Koparsa tekrar bağlanmayı dene
            options.setConnectionTimeout(10);

            client.connect(options);
            client.setCallback(this); // Olayları (mesaj geldi, koptu vs.) bu sınıfta dinle

            // Belirlenen kanala abone ol (Subscribe)
            client.subscribe(TOPIC_PATTERN);

            System.out.println("MQTT Bağlantısı Başarılı! Dinlenen Topic: " + TOPIC_PATTERN);

        } catch (MqttException e) {
            System.err.println("MQTT Bağlantı Hatası: " + e.getMessage());
            System.err.println("NOT: MQTT Broker (Mosquitto) çalışıyor mu kontrol edin.");
        }
    }

    /**
     * Bağlantı koptuğunda tetiklenir [cite: 29]
     */
    @Override
    public void connectionLost(Throwable cause) {
        System.err.println("MQTT Bağlantısı Koptu! Sebep: " + cause.getMessage());
    }

    /**
     * YENİ MESAJ GELDİĞİNDE tetiklenir [cite: 29]
     * Burası sistemin giriş kapısıdır.
     */
    @Override
    public void messageArrived(String topic, MqttMessage message) throws Exception {
        String payload = new String(message.getPayload());

        System.out.println("MQTT Mesajı Geldi [" + topic + "]: " + payload);

        // Gelen veriyi işlemesi için TelemetryService'e gönderiyoruz
        telemetryService.processIncomingData(payload);
    }

    /**
     * Mesaj gönderimi tamamlandığında tetiklenir (Şu an sadece dinliyoruz, boş kalabilir)
     */
    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Biz şu an sadece Subscriber'ız (Dinleyici), Publisher değiliz.
    }
}