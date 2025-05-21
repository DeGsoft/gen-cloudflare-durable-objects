import {createMergeableStore, Id, IdAddedOrRemoved} from 'tinybase';
import {createDurableObjectStoragePersister} from 'tinybase/persisters/persister-durable-object-storage';
import {
  getWsServerDurableObjectFetch,
  WsServerDurableObject,
} from 'tinybase/synchronizers/synchronizer-ws-server-durable-object';

export class TinyBaseDurableObject extends WsServerDurableObject {
  createPersister() {
      return createDurableObjectStoragePersister(
        createMergeableStore(),
        this.ctx.storage,
      );
  }
}

export default {
  fetch: getWsServerDurableObjectFetch('TINYBASE_DURABLE_OBJECT'),
};