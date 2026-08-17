import * as React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('saas-skeleton', className)}
      {...props}
    />
  );
};
Skeleton.displayName = 'Skeleton';

export { Skeleton };