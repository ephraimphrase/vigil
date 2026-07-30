import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error(
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set. Get one at https://thirdweb.com/create-api-key",
  );
}

export const thirdwebClient = createThirdwebClient({ clientId });
