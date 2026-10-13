package io.reelquest.billing.cognito;

public interface EntitlementManager {

    void grantProEntitlement(String username);

    void revokeProEntitlement(String username);
}
