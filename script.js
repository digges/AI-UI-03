package com.genie.ai.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class GeminiWebSocketHandler extends TextWebSocketHandler {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {

        String userInput = message.getPayload().trim();
        System.out.println("🔹 User Input: " + userInput);

        String response = callGeminiForAnswer(userInput);
        session.sendMessage(new TextMessage(response));
    }

    // ---------------- GEMINI CALL ----------------
    private String callGeminiForAnswer(String userInput) {
        try {
            Map<String, Object> payload = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "parts", List.of(
                                            Map.of("text", userInput)
                                    )
                            )
                    )
            );

            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_URL + apiKey,
                    entity,
                    String.class
            );

            // ✅ Return the full Gemini JSON response
            return response.getBody();

        } catch (HttpClientErrorException e) {
            // ✅ Handle HTTP errors (400, 401, 403, 404, etc.)
            System.err.println("❌ Gemini API Error: " + e.getStatusCode());
            System.err.println("❌ Response Body: " + e.getResponseBodyAsString());
            return createErrorJson("Gemini API error: " + e.getStatusCode(), e.getResponseBodyAsString());
            
        } catch (Exception e) {
            // ✅ Handle all other errors
            e.printStackTrace();
            return createErrorJson("Server error", e.getMessage());
        }
    }

    // ✅ Helper method to create error JSON
    private String createErrorJson(String error, String details) {
        try {
            Map<String, String> errorMap = Map.of(
                    "error", error,
                    "details", details != null ? details : "Unknown error"
            );
            return objectMapper.writeValueAsString(errorMap);
        } catch (Exception e) {
            return "{\"error\":\"Failed to create error response\"}";
        }
    }
}
