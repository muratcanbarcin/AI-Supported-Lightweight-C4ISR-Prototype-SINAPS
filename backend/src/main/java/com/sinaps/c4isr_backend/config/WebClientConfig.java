package com.sinaps.c4isr_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configuration class for WebClient.
 * 
 * Provides WebClient.Builder bean for dependency injection.
 * This is required because spring-boot-starter-webflux doesn't
 * auto-configure WebClient.Builder in a non-reactive (servlet) application.
 */
@Configuration
public class WebClientConfig {

    /**
     * Provides a WebClient.Builder bean for injection.
     * 
     * @return WebClient.Builder instance
     */
    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
