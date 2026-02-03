package com.sinaps.c4isr_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Global CORS Configuration for C4ISR Backend.
 * 
 * DEVELOPMENT MODE: Allows all origins and methods for rapid prototyping.
 * 
 * ⚠️ WARNING: This configuration is PERMISSIVE and should be tightened
 *             before deploying to production.
 * 
 * Production Recommendations:
 * - Restrict allowedOrigins to specific frontend URLs
 * - Limit allowedMethods to only what's needed
 * - Set appropriate maxAge for preflight cache
 * - Consider using allowedOriginPatterns for subdomain matching
 */
@Configuration
public class GlobalCorsConfig {

    /**
     * Creates a CorsFilter bean that applies to all endpoints.
     * This takes precedence over @CrossOrigin annotations on controllers.
     * 
     * @return CorsFilter configured for development
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        
        // ============================================================
        // DEVELOPMENT SETTINGS - ALLOW ALL
        // ============================================================
        
        // Allow all origins (use "*" for development, specific URLs for production)
        config.addAllowedOriginPattern("*");
        
        // Allow all standard HTTP methods
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("PATCH");
        config.addAllowedMethod("OPTIONS");
        config.addAllowedMethod("HEAD");
        
        // Allow all headers
        config.addAllowedHeader("*");
        
        // Allow credentials (cookies, authorization headers)
        // Note: When allowCredentials is true, allowedOrigins cannot be "*"
        // That's why we use addAllowedOriginPattern("*") instead of addAllowedOrigin("*")
        config.setAllowCredentials(true);
        
        // Expose headers that frontend might need to read
        config.addExposedHeader("Authorization");
        config.addExposedHeader("Content-Disposition");
        config.addExposedHeader("X-Total-Count");
        
        // Cache preflight response for 1 hour (3600 seconds)
        config.setMaxAge(3600L);
        
        // Apply this configuration to all paths
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}
