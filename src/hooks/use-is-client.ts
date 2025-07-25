
'use client';

import { useState, useEffect } from 'react';

/**
 * A custom hook that returns `true` only after the component has mounted on the client.
 * This is useful for preventing hydration mismatches by ensuring that components
 * that rely on client-side state or APIs are only rendered on the client.
 *
 * @returns {boolean} `true` if the component is mounted on the client, otherwise `false`.
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
