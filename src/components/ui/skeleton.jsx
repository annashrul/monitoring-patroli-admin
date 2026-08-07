import * as React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-brutal bg-saas-bg-tertiary border-2 border-brutal-black', className)}
      {...props}
    />
  );
};
Skeleton.displayName = 'Skeleton';

export { Skeleton };