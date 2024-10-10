import React from 'react';
import cn from 'classnames';

type Intent = 'primary' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  intent?: Intent; // can add more
  size?: Size;
}

export default function IconButton({
  intent = 'primary',
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  const classes = cn(
    className
  );
  return <button className={classes} {...props} />;
}
