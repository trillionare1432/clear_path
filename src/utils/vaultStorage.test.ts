import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCOPED_STORAGE_KEYS,
  StorageAdapter,
  buildScopedKey,
  clearScopedVault,
  getVaultScope,
  purgeLegacyUnscopedWorkspaceKeys,
  readScopedJson,
  writeScopedJson,
} from './vaultStorage';

function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: key => (map.has(key) ? map.get(key)! : null),
    setItem: (key, val) => {
      map.set(key, val);
    },
    removeItem: key => {
      map.delete(key);
    },
  };
}

test('getVaultScope isolates registered accounts and guest distinctly', () => {
  assert.equal(getVaultScope(null), 'guest');
  assert.equal(getVaultScope(undefined), 'guest');
  assert.equal(getVaultScope({ id: 'user-101' }), 'user:user-101');
  assert.equal(getVaultScope({ id: 'user-202' }), 'user:user-202');
});

test('writing records for Account A never leaks to Account B or Guest', () => {
  const storage = createMemoryStorage();
  const scopeA = getVaultScope({ id: 'user-A' });
  const scopeB = getVaultScope({ id: 'user-B' });
  const scopeGuest = getVaultScope(null);

  writeScopedJson(scopeA, SCOPED_STORAGE_KEYS.LOGS_P1, [{ id: 'log-a', note: 'Private A' }], storage);
  writeScopedJson(
    scopeA,
    SCOPED_STORAGE_KEYS.SUPPORTER_EVENTS,
    [{ id: 'ev-a', title: 'Family OPD A' }],
    storage
  );

  // Guest sees clean fallback, NOT Account A
  assert.deepEqual(readScopedJson(scopeGuest, SCOPED_STORAGE_KEYS.LOGS_P1, [], storage), []);
  assert.deepEqual(readScopedJson(scopeGuest, SCOPED_STORAGE_KEYS.SUPPORTER_EVENTS, [], storage), []);

  // Brand-new Account B sees clean fallback, NOT Account A
  assert.deepEqual(readScopedJson(scopeB, SCOPED_STORAGE_KEYS.LOGS_P1, [], storage), []);
  assert.deepEqual(readScopedJson(scopeB, SCOPED_STORAGE_KEYS.SUPPORTER_EVENTS, [], storage), []);

  // Account B writes own records
  writeScopedJson(scopeB, SCOPED_STORAGE_KEYS.LOGS_P1, [{ id: 'log-b', note: 'Private B' }], storage);

  // Switching back to Account A still returns Account A's exact records
  assert.deepEqual(readScopedJson(scopeA, SCOPED_STORAGE_KEYS.LOGS_P1, [], storage), [
    { id: 'log-a', note: 'Private A' },
  ]);
  assert.deepEqual(readScopedJson(scopeB, SCOPED_STORAGE_KEYS.LOGS_P1, [], storage), [
    { id: 'log-b', note: 'Private B' },
  ]);
});

test('clearScopedVault wipes only target vault and preserves other accounts', () => {
  const storage = createMemoryStorage();
  const scopeA = getVaultScope({ id: 'user-A' });
  const scopeGuest = getVaultScope(null);

  writeScopedJson(scopeA, SCOPED_STORAGE_KEYS.GOALS_P1, [{ id: 'g-a', title: 'A Goal' }], storage);
  writeScopedJson(scopeGuest, SCOPED_STORAGE_KEYS.GOALS_P1, [{ id: 'g-g', title: 'Guest Goal' }], storage);

  clearScopedVault(scopeGuest, storage);

  assert.deepEqual(readScopedJson(scopeGuest, SCOPED_STORAGE_KEYS.GOALS_P1, [], storage), []);
  assert.deepEqual(readScopedJson(scopeA, SCOPED_STORAGE_KEYS.GOALS_P1, [], storage), [
    { id: 'g-a', title: 'A Goal' },
  ]);
});

test('purgeLegacyUnscopedWorkspaceKeys cleans stale unscoped keys without touching scoped vaults', () => {
  const storage = createMemoryStorage();
  storage.setItem(SCOPED_STORAGE_KEYS.LOGS_P1, JSON.stringify([{ id: 'old-polluted' }]));
  storage.setItem('clearpath_registered_users', JSON.stringify([{ id: 'user-A' }]));
  storage.setItem(buildScopedKey('user:user-A', SCOPED_STORAGE_KEYS.LOGS_P1), JSON.stringify([{ id: 'a1' }]));

  purgeLegacyUnscopedWorkspaceKeys(storage);

  assert.equal(storage.getItem(SCOPED_STORAGE_KEYS.LOGS_P1), null);
  assert.notEqual(storage.getItem('clearpath_registered_users'), null);
  assert.deepEqual(readScopedJson('user:user-A', SCOPED_STORAGE_KEYS.LOGS_P1, [], storage), [{ id: 'a1' }]);
});
