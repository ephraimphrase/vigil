import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  console.warn(
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set - wallet connect is disabled. Get one at https://thirdweb.com/create-api-key",
  );
}

export const thirdwebClient = clientId ? createThirdwebClient({ clientId }) : null;
