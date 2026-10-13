package io.reelquest.billing.gateway;

public record RefundResult(
        String refundId,
        String paymentId,
        boolean success,
        String errorMessage
) {
    public static RefundResult success(String refundId, String paymentId) {
        return new RefundResult(refundId, paymentId, true, null);
    }

    public static RefundResult failure(String paymentId, String errorMessage) {
        return new RefundResult(null, paymentId, false, errorMessage);
    }
}
