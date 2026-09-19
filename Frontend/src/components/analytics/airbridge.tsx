'use client';

import { useEffect } from 'react';

export function AirbridgeAnalytics() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('airbridge-web-sdk-loader').then((module) => {
        const airbridge = module.default;
        airbridge.init({
          app: 'momento',
          webToken: '24a0a99e021544928b83c77af4902b2b',
        });
      });
    }
  }, []);

  return null;
}
