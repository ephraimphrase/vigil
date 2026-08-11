import type { CodegenConfig } from "@graphql-codegen/cli";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL ?? "http://localhost:42069";

const config: CodegenConfig = {
  schema: `${PONDER_URL}/graphql`,
  documents: "lib/ponder/operations/**/*.graphql",
  // @graphql-codegen/cli's default ESM plugin loader resolves plugin names
  // from inside its own package, which can load the wrong "typescript"
  // package entirely. Importing from this file (inside apps/web) instead.
  pluginLoader: (name: string) => import(name),
  config: {
    // Ponder's BigInt scalar serializes as a decimal string over GraphQL.
    scalars: {
      BigInt: "string",
      JSON: "unknown",
    },
  },
  generates: {
    // Kept in a separate file from sdk.ts - typescript-operations
    // re-declares every input type if it shares a file with typescript
    // (dotansimha/graphql-code-generator#10782); importSchemaTypesFrom below
    // is the fix.
    "lib/ponder/generated/types.ts": {
      plugins: ["typescript"],
    },
    "lib/ponder/generated/sdk.ts": {
      plugins: ["typescript-operations", "typescript-graphql-request"],
      config: {
        // Resolved against cwd (apps/web), not against this output file.
        importSchemaTypesFrom: "./lib/ponder/generated/types",
      },
    },
  },
};

export default config;
