import {
  getWsServerDurableObjectFetch,
  WsServerDurableObject,
} from 'tinybase/synchronizers/synchronizer-ws-server-durable-object';
import { createMergeableStore } from 'tinybase';
import { createDurableObjectStoragePersister } from 'tinybase/persisters/persister-durable-object-storage';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export async function validateToken(fb_project_id: string, idToken: string): Promise<{ uid: string } | null> {
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${fb_project_id}`,
      audience: fb_project_id,
    });

    return { uid: payload.user_id as string };
  } catch (e) {
    console.error('Token verification failed', e);
    return null;
  }
}

function parseTokenFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

export class TinyBaseDurableObject extends WsServerDurableObject {
  createPersister() {
    return createDurableObjectStoragePersister(
      createMergeableStore(),
      this.ctx.storage
    );
  }
}

const tinybaseHandler = getWsServerDurableObjectFetch(
  'TINYBASE_DURABLE_OBJECT'
);

export default {
  fetch: async (request: Request, env: any, ctx: ExecutionContext) => {    
    const token = parseTokenFromRequest(request);

    if (!token) {
      return new Response('Unauthorized: Missing token', { status: 401 });
    }

    const isValid = await validateToken(env.FIREBASE_PROJECT_ID, token);
    if (!isValid) {
      return new Response('Unauthorized: Invalid token', { status: 403 });
    }

    return tinybaseHandler(request, env);
  },
};