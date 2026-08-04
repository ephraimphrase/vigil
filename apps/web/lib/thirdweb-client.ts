import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  console.warn(
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set - wallet connect is disabled. Get one at https://thirdweb.com/create-api-key",
  );
}

// null when unconfigured, rather than throwing - a missing client ID
// shouldn't take down every page that transitively imports this (it was
// crashing static prerendering). ConnectWallet.tsx renders a disabled
// button instead of the real connect flow when this is null.
export const thirdwebClient = clientId ? createThirdwebClient({ clientId }) : null;
