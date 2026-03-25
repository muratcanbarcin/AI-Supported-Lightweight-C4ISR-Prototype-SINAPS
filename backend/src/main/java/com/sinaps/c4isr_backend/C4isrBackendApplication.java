package com.sinaps.c4isr_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class C4isrBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(C4isrBackendApplication.class, args);
	}

}
