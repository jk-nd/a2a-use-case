/**
 * Token Manager for A2A Service
 * Handles authentication and token refresh for the A2A service using service account credentials
 */

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
}

interface TokenInfo {
  token: string;
  expiresAt: number;
}

export class TokenManager {
  private currentToken: TokenInfo | null = null;
  private refreshToken: string | null = null;
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenRefreshThreshold = 30000; // 30 seconds before expiry

  constructor() {
    this.keycloakUrl = process.env.KEYCLOAK_URL || 'http://keycloak:11000';
    this.realm = process.env.KEYCLOAK_REALM || 'noumena';
    this.clientId = process.env.A2A_CLIENT_ID || 'a2a-service';
    this.clientSecret = process.env.A2A_CLIENT_SECRET || 'a2a-service-secret';
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.currentToken && this.isTokenValid()) {
      return this.currentToken.token;
    }

    // Check if we can refresh the token
    if (this.refreshToken && this.currentToken) {
      try {
        await this.refreshAccessToken();
        return this.currentToken!.token;
      } catch (error) {
        console.log('Token refresh failed, getting new token:', error);
        // Fall through to get new token
      }
    }

    // Get a new token
    await this.authenticate();
    return this.currentToken!.token;
  }

  /**
   * Authenticate using client credentials flow
   */
  private async authenticate(): Promise<void> {
    try {
      console.log('Authenticating A2A service with Keycloak...');
      
      const response = await fetch(`${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const tokenData = await response.json() as TokenResponse;
      
      this.currentToken = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
      };
      
      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
      }

      console.log('✅ A2A service authenticated successfully');
    } catch (error) {
      console.error('❌ A2A service authentication failed:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      console.log('Refreshing A2A service token...');
      
      const response = await fetch(`${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const tokenData = await response.json() as TokenResponse;
      
      this.currentToken = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
      };
      
      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
      }

      console.log('✅ A2A service token refreshed successfully');
    } catch (error) {
      console.error('❌ A2A service token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Check if the current token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.currentToken) {
      return false;
    }

    // Check if token expires within the refresh threshold
    return Date.now() < (this.currentToken.expiresAt - this.tokenRefreshThreshold);
  }

  /**
   * Clear current tokens (useful for testing or logout scenarios)
   */
  clearTokens(): void {
    this.currentToken = null;
    this.refreshToken = null;
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo(): { hasToken: boolean; expiresAt?: number; isValid: boolean } {
    return {
      hasToken: !!this.currentToken,
      expiresAt: this.currentToken?.expiresAt,
      isValid: this.isTokenValid(),
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager(); 