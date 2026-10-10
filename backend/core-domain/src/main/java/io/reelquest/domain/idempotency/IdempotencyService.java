package io.reelquest.domain.idempotency;

import java.time.Duration;
import java.util.Optional;

public interface IdempotencyService {
    boolean tryAcquireLock(String idempotencyKey, Duration ttl);
    Optional<IdempotencyRecord> getRecord(String idempotencyKey);
    void markCompleted(String idempotencyKey, String responseBody);
}
