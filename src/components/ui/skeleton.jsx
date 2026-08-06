import * as React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-none bg-brutal-zinc border border-brutal-zinc/10', className)}
      {...props}
    />
  );
};
Skeleton.displayName = 'Skeleton';

export { Skeleton };