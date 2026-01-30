package com.sinaps.c4isr_backend.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MqttListenerService implements MqttCallback {

    private static final Logger log = LoggerFactory.getLogger(MqttListenerService.class);

    // Dependency injection for TelemetryService
    private final TelemetryService telemetryService;

    // Paho MQTT Client
    private MqttClient client;

    // Read from application.properties
    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    // Topic patterns
    // Original topic pattern for C4ISR telemetry (c4isr/drone1/telemetry,
    // c4isr/soldierA/telemetry, etc.)
    private static final String TOPIC_C4ISR_TELEMETRY = "c4isr/+/telemetry";

    // UAV Simulator topic (drone/events)
    private static final String TOPIC_DRONE_EVENTS = "drone/events";

    public MqttListenerService(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * Connect to MQTT broker on application startup.
     */
    @PostConstruct
    public void connect() {
        try {
            log.info("Connecting to MQTT Broker: {}", brokerUrl);

            // Generate unique client ID for each connection
            String clientId = MqttClient.generateClientId();
            client = new MqttClient(brokerUrl, clientId);

            // Connection options
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            options.setConnectionTimeout(10);
            options.setKeepAliveInterval(30);

            client.connect(options);
            client.setCallback(this);

            // Subscribe to both topic patterns
            client.subscribe(TOPIC_C4ISR_TELEMETRY);
            log.info("Subscribed to topic: {}", TOPIC_C4ISR_TELEMETRY);

            client.subscribe(TOPIC_DRONE_EVENTS);
            log.info("Subscribed to topic: {}", TOPIC_DRONE_EVENTS);

            client.subscribe("vehicle/events");
            log.info("Subscribed to topic: vehicle/events");

            client.subscribe("soldier/events");
            log.info("Subscribed to topic: soldier/events");

            client.subscribe("watch/events"); // Correct topic for Soldier/Watch simulator
            log.info("Subscribed to topic: watch/events");

            log.info("MQTT Connection Successful! Listening for telemetry data...");

        } catch (MqttException e) {
            log.error("MQTT Connection Error: {}", e.getMessage());
            log.error("NOTE: Make sure MQTT Broker (Mosquitto) is running.");
        }
    }

    /**
     * Disconnect from MQTT broker on application shutdown.
     */
    @PreDestroy
    public void disconnect() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
                log.info("Disconnected from MQTT Broker.");
            }
        } catch (MqttException e) {
            log.error("Error disconnecting from MQTT: {}", e.getMessage());
        }
    }

    /**
     * Called when connection to broker is lost.
     */
    @Override
    public void connectionLost(Throwable cause) {
        log.error("MQTT Connection Lost! Cause: {}", cause.getMessage());
    }

    /**
     * Called when a new message arrives on a subscribed topic.
     * Routes messages to appropriate handler based on topic.
     */

    @Override
    public void messageArrived(String topic, MqttMessage message) throws Exception {
        String payload = new String(message.getPayload());

        // DEBUG LOGGING START
        // log.info(">>> MQTT MESSAGE ARRIVED <<<");
        // log.info("Topic: {}", topic);
        // log.info("Payload: {}", payload);
        // DEBUG LOGGING END

        try {
            // Route message based on topic
            if (topic.equals(TOPIC_DRONE_EVENTS) || topic.equals("vehicle/events") || topic.equals("soldier/events")
                    || topic.equals("watch/events")) {
                // Simulator messages -> processSimulatorMessage
                if (!topic.equals(TOPIC_DRONE_EVENTS)) {
                    log.info("Routing from {} to Simulator Message Processor...", topic);
                }
                telemetryService.processSimulatorMessage(payload);
            } else if (topic.matches("c4isr/.+/telemetry")) {
                // Original C4ISR telemetry format -> processIncomingData
                // log.info("Routing to C4ISR Message Processor...");
                telemetryService.processIncomingData(payload);
            } else {
                log.warn("Unknown topic: {} - message not processed", topic);
            }
        } catch (Exception e) {
            log.error("CRITICAL ERROR PROCESSING MQTT MESSAGE: {}", e.getMessage(), e);
        }
    }

    /**
     * Called when a message delivery is complete (for publisher).
     * We are only subscribing, so this is not used.
     */
    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // We are a subscriber, not a publisher
    }
}
