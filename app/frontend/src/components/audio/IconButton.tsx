import React from 'react';
import cn from 'classnames';

type Intent = 'primary' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  intent?: Intent; // can add more
  size?: Size;
}


const sizeMap: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export default function IconButton({
  intent = 'primary',
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  const colorClass = colorMap[intent];
  const sizeClass = sizeMap[size];
  const classes = cn(
    colorClass,
    sizeClass,
    className
  );
  return <button className={classes} {...props} />;
}
