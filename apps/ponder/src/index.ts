import { ponder } from "ponder:registry";

import { vault } from "../ponder.schema";

ponder.on("VaultFactory:VaultCreated", async ({ event, context }) => {
  await context.db.insert(vault).values({
    id: event.args.vault,
    asset: event.args.asset,
    oracle: event.args.oracle,
    kind: event.args.kind,
    createdAtBlock: event.block.number,
    createdAtTimestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});
