package com.sinaps.c4isr_backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "SINAPS C4ISR API",
                version = "1.0",
                description = "Military Command and Control System API Documentation",
                contact = @Contact(
                        name = "SINAPS Dev Team"
                ),
                license = @License(
                        name = "SINAPS Non-Commercial License"
                )
        )
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer"
)
public class OpenApiConfig {
    // Configuration is handled entirely via annotations.
    // Controllers can reference this security scheme with:
    // @SecurityRequirement(name = "Bearer Authentication")
}
