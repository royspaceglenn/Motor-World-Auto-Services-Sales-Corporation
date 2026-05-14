/**
 * Legacy hook: the API used to ship better-sqlite3 (native). The server now uses
 * Node's built-in `node:sqlite` (DatabaseSync), so no rebuild is required for packaging.
 * This script stays so `npm run rebuild:server-sqlite` / `desktop:pack` chains keep working.
 */
console.log('ensure-server-sqlite: skipped (server uses node:sqlite; no native module).');
