import * as React from 'react';
import { cn } from '../../lib/utils';

const Separator = React.forwardRef(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <div
    ref={ref}
    role={decorative ? 'separator' : undefined}
    orient={orientation}
    className={cn(
      'shrink-0 bg-black',
      orientation === 'horizontal' ? 'h-[2px] w-full' : 'h-full w-[2px]',
      className
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';

export { Separator };