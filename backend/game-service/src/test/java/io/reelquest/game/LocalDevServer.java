package io.reelquest.game;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import io.reelquest.game.handler.GameApiHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;

public class LocalDevServer {

    private static final Logger log = LoggerFactory.getLogger(LocalDevServer.class);
    private static final int PORT = 8080;

    public static void main(String[] args) throws IOException {
        GameApiHandler handler = new GameApiHandler();
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        server.createContext("/", exchange -> {
            try {
                handleHttpExchange(exchange, handler);
            } catch (Exception e) {
                log.error("Error handling request: {}", e.getMessage(), e);
                sendResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        });

        server.start();
        log.info("ReelQuest Local Game API Server listening on http://localhost:{}", PORT);
        log.info("Endpoints: /daily, /shortest-path, /leaderboard, /games/submit");
    }

    private static void handleHttpExchange(HttpExchange exchange, GameApiHandler handler) throws IOException {
        String method = exchange.getRequestMethod();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, Authorization");
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String query = exchange.getRequestURI().getRawQuery();
        Map<String, String> queryParams = parseQuery(query);

        Map<String, String> headers = new HashMap<>();
        exchange.getRequestHeaders().forEach((k, v) -> {
            if (!v.isEmpty()) headers.put(k, v.get(0));
        });

        byte[] requestBytes = exchange.getRequestBody().readAllBytes();
        String body = new String(requestBytes, StandardCharsets.UTF_8);

        APIGatewayProxyRequestEvent requestEvent = new APIGatewayProxyRequestEvent()
                .withHttpMethod(method)
                .withPath(path)
                .withQueryStringParameters(queryParams)
                .withHeaders(headers)
                .withBody(body.isBlank() ? null : body);

        APIGatewayProxyResponseEvent responseEvent = handler.handleRequest(requestEvent, null);

        int statusCode = responseEvent.getStatusCode() != null ? responseEvent.getStatusCode() : 200;
        String responseBody = responseEvent.getBody() != null ? responseEvent.getBody() : "";

        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, Authorization");

        sendResponse(exchange, statusCode, responseBody);
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isBlank()) return params;

        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0) {
                String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                params.put(key, value);
            }
        }
        return params;
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String responseBody) throws IOException {
        byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
