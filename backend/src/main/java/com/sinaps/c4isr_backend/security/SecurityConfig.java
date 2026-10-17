package com.sinaps.c4isr_backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Stateless JWT API. The browser sends Authorization headers, not session cookies,
                // so a CSRF token would not bind to any credential the API accepts.
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/v3/api-docs/**").permitAll()
                        .requestMatchers("/swagger-resources/**").permitAll()
                        // Login only. /api/v1/auth/me stays authenticated.
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        // Physical prototypes: tactical watch and drone HTTP fallback.
                        .requestMatchers(HttpMethod.POST, "/api/v1/hardware/**").permitAll()
                        // Simulation engine, MQTT middleware, and wargame seeder ingest.
                        .requestMatchers(HttpMethod.POST, "/api/v1/telemetry").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/telemetry/batch").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/tasks").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/system-logs").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/ai-analyses").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("KARARGAH_ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
