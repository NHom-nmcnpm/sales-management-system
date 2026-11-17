import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../utilities/cn.js';

const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-blue-700 text-white hover:bg-blue-800',
        outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        ghost: 'text-slate-600 hover:bg-slate-100',
        destructive: 'bg-red-600 text-white hover:bg-red-700'
      },
      size: { default: '', sm: 'min-h-9 px-3 py-1.5 text-xs', icon: 'size-10 p-0' }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
);

export function Button({ className, variant, size, asChild = false, type = 'button', ...props }) {
  const Component = asChild ? Slot : 'button';
  return <Component type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
