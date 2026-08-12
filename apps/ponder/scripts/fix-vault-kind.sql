-- One-off data patch, not something Ponder itself will ever write.
--
-- VigilVault.kind is immutable on-chain and VaultFactory currently only
-- ever deploys Single-kind vaults (see IVigilVault.sol) - so every indexed
-- vault genuinely is "Single" as far as the contract is concerned. The
-- distinction this patches in is a different one: whether the vault's
-- *underlying asset token* is itself an LP/pool-style token, which isn't
-- represented anywhere on-chain or in Ponder's schema. This symbol list is
-- the same one apps/contracts/data/84532/token.json used to carry in its
-- (since-dropped) "kind" field for these exact tokens.
--
-- Run with: docker exec -i vigil-postgres psql -U vigil -d vigil -f - < apps/ponder/scripts/fix-vault-kind.sql
--
-- Safe to rerun: idempotent, only touches these 5 rows, and ponder.vault's
-- own reorg/live_query triggers fire normally on this UPDATE like any other
-- write - no other tables need touching by hand.

UPDATE ponder.vault
SET kind = 'LP'
WHERE asset_symbol = ANY (ARRAY['syrupusdc', 'bnsol', 'crv', 'tbtc', 'oseth']);

SELECT asset_symbol, vault_name, kind FROM ponder.vault ORDER BY kind, asset_symbol;
