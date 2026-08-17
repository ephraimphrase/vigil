import { GraphQLClient } from "graphql-request";
import { getSdk } from "./generated/sdk";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL ?? "http://localhost:42069";

const client = new GraphQLClient(`${PONDER_URL}/graphql`);

export const ponder = getSdk(client);
