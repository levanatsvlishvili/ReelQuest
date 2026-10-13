package io.reelquest.domain.model;

public enum OrderStatus {
    PENDING,
    PAYMENT_INITIATED,
    PAYMENT_SUCCEEDED,
    COMPLETED,
    CANCELLED,
    REFUNDED
}
