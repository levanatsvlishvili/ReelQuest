package io.reelquest.billing.cognito;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminAddUserToGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminRemoveUserFromGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;

public class AwsCognitoEntitlementManager implements EntitlementManager {

    private static final Logger log = LoggerFactory.getLogger(AwsCognitoEntitlementManager.class);
    private static final String PRO_GROUP_NAME = "ProUsers";

    private final CognitoIdentityProviderClient cognitoClient;
    private final String userPoolId;

    public AwsCognitoEntitlementManager(CognitoIdentityProviderClient cognitoClient, String userPoolId) {
        this.cognitoClient = cognitoClient;
        this.userPoolId = userPoolId;
    }

    @Override
    public void grantProEntitlement(String username) {
        if (userPoolId == null || userPoolId.isBlank()) {
            log.warn("Cognito UserPoolId not configured; skipping Cognito group update for {}", username);
            return;
        }
        try {
            cognitoClient.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .groupName(PRO_GROUP_NAME)
                    .build());
            log.info("Successfully added user {} to Cognito group {}", username, PRO_GROUP_NAME);
        } catch (UserNotFoundException e) {
            log.warn("User {} not found in Cognito User Pool. Proceeding with database entitlement grant.", username);
        } catch (Exception e) {
            log.error("Failed to add user {} to Cognito group {}: {}", username, PRO_GROUP_NAME, e.getMessage(), e);
            throw new RuntimeException("Cognito entitlement grant failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void revokeProEntitlement(String username) {
        if (userPoolId == null || userPoolId.isBlank()) {
            return;
        }
        try {
            cognitoClient.adminRemoveUserFromGroup(AdminRemoveUserFromGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .groupName(PRO_GROUP_NAME)
                    .build());
            log.info("Successfully removed user {} from Cognito group {}", username, PRO_GROUP_NAME);
        } catch (UserNotFoundException e) {
            log.warn("User {} not found in Cognito User Pool during revocation.", username);
        } catch (Exception e) {
            log.error("Failed to remove user {} from Cognito group {}: {}", username, PRO_GROUP_NAME, e.getMessage(), e);
            throw new RuntimeException("Cognito entitlement revocation failed: " + e.getMessage(), e);
        }
    }
}
