import { Auth0Service } from '../auth0/auth0.service';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.development.env' });

export const getAuth0Config = (auth0Service: Auth0Service) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    attemptSilentLogin: false, // Previene conflictos de headers

    session: {
      cookie: {
        secure: isProduction,

        sameSite: isProduction ? 'None' : 'Lax',
        httpOnly: true,
      },
    },

    routes: {
      login: '/login',
      callback: '/callback',
      postLogoutRedirect: 'https://www.elparcheplotter.studio/',
    },

    afterCallback: async (req, res, session) => {
      try {
        const ISSUER_BASE_URL = process.env.AUTH0_ISSUER_BASE_URL;
        let userPayload = session?.user ?? req?.oidc?.user ?? null;

        if (!userPayload && session?.access_token) {
          try {
            const userInfoResponse = await fetch(
              `${ISSUER_BASE_URL}/userinfo`,
              {
                headers: { Authorization: `Bearer ${session.access_token}` },
              },
            );
            if (userInfoResponse.ok) {
              userPayload = await userInfoResponse.json();
            }
          } catch (err) {
            console.error('Error fetching userinfo:', err);
          }
        }

        if (userPayload) {
          await auth0Service.processAuth0User(userPayload);
        }

        return session;
      } catch (error) {
        console.error('Critical error inside afterCallback:', error);
        return session;
      }
    },

    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
      connection: 'google-oauth2',
    },
  };
};
