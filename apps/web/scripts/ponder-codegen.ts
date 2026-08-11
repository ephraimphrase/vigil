// The `graphql-codegen` CLI bin fails to resolve its own plugin packages in
// this workspace - calling generate() directly avoids that.
import { generate } from "@graphql-codegen/cli";
import config from "../codegen";

await generate(config, true);
