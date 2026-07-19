'use client';

import { useEffect, useState, useCallback } from 'react';
import { roles } from '@/lib/api';

/**
 * Fetch the current user's effective permissions, optionally in the
 * context of a group. Use `can('payout.disburse')` to gate UI actions.
 */
export function usePermissions(groupId?: string) {
  const [perms, setPerms] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    roles.myPermissions(groupId)
      .then(r => { if (!cancelled) setPerms(r.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [groupId]);

  const can = useCallback(
    (permission: string) => perms.includes('*') || perms.includes(permission),
    [perms]
  );

  return { can, perms, loaded };
}
