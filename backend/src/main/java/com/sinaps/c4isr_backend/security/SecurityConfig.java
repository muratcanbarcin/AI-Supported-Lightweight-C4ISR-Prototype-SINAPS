package com.sinaps.c4isr_backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public: Swagger UI & OpenAPI docs
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/v3/api-docs/**").permitAll()
                        .requestMatchers("/swagger-resources/**").permitAll()
                        // Public: authentication
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Public: telemetry (read by dashboard, map, health-check)
                        .requestMatchers("/api/v1/telemetry/**").permitAll()
                        // Public: alerts & alarms
                        .requestMatchers("/api/v1/alerts/**").permitAll()
                        .requestMatchers("/api/v1/alarms/**").permitAll()
                        // Public: tactical data feeds
                        .requestMatchers("/api/v1/zones/**").permitAll()
                        .requestMatchers("/api/v1/tasks/**").permitAll()
                        .requestMatchers("/api/v1/analysis/**").permitAll()
                        .requestMatchers("/api/v1/system-logs/**").permitAll()
                        .requestMatchers("/api/v1/ai/**").permitAll()
                        .requestMatchers("/api/v1/ai-analyses/**").permitAll()
                        .requestMatchers("/api/v1/chats/**").permitAll()
                        // Public: asset reads
                        .requestMatchers("/api/v1/assets/**").permitAll()
                        // Restricted: admin panel
                        .requestMatchers("/api/v1/admin/**").hasRole("KARARGAH_ADMIN")
                        // Everything else requires authentication
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
