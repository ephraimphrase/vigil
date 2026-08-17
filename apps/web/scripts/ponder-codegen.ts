import { generate } from "@graphql-codegen/cli";
import config from "../codegen";

await generate(config, true);
