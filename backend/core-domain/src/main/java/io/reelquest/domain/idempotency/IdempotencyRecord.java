package io.reelquest.domain.idempotency;

public record IdempotencyRecord(
        String key,
        IdempotencyStatus status,
        String responseBody,
        long expiresAt
) {}
