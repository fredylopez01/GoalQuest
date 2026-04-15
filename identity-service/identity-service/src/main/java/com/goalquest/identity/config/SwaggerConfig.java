package com.goalquest.identity.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI goalQuestIdentityOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("GoalQuest — Identity Service API")
                        .description(
                                """
                                        Microservicio de identidad y autenticación para la plataforma GoalQuest.

                                        ## Funcionalidades
                                        - **Autenticación**: Registro, login, logout y validación de tokens JWT
                                        - **Gestión de usuarios**: Perfiles, búsqueda y consulta de usuarios
                                        - **Auditoría**: Registro y consulta de logs de actividad

                                        ## Autenticación
                                        Los endpoints protegidos requieren un token JWT en el header `Authorization: Bearer <token>`.
                                        Los endpoints internos (comunicación entre microservicios) requieren el header `X-Internal-Service-Key`.

                                        ## Códigos de error estándar
                                        | Código | Significado |
                                        |--------|-------------|
                                        | 400 | Datos de entrada inválidos |
                                        | 401 | No autenticado o credenciales incorrectas |
                                        | 403 | Sin permisos suficientes |
                                        | 404 | Recurso no encontrado |
                                        | 409 | Conflicto (recurso duplicado) |
                                        """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("GoalQuest Team")
                                .email("dev@goalquest.com"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8081").description("Desarrollo local"),
                        new Server().url("http://identity-service:8081").description("Docker interno")))
                .tags(List.of(
                        new Tag().name("Autenticación")
                                .description("Registro, login, logout y validación de tokens JWT"),
                        new Tag().name("Usuarios")
                                .description("Gestión de perfiles y consulta de usuarios"),
                        new Tag().name("Auditoría")
                                .description("Registro y consulta de logs de auditoría del sistema")))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token JWT obtenido en el endpoint de login"))
                        .addSecuritySchemes("internal-key", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-Internal-Service-Key")
                                .description(
                                        "Clave secreta compartida entre microservicios para comunicación interna")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}