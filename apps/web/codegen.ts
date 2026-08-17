import type { CodegenConfig } from "@graphql-codegen/cli";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL ?? "http://localhost:42069";

const config: CodegenConfig = {
  schema: `${PONDER_URL}/graphql`,
  documents: "lib/ponder/operations/**/*.graphql",
  pluginLoader: (name: string) => import(name),
  config: {
    // Ponder's BigInt scalar serializes as a decimal string over GraphQL.
    scalars: {
      BigInt: "string",
      JSON: "unknown",
    },
  },
  generates: {
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
