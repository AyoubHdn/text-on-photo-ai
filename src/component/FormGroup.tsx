import { forwardRef } from "react";
import clsx from "clsx"

export const FormGroup = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function FormGroup(props, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={clsx("flex flex-col gab-1", props.className)}
    >
      {props.children}
    </div>
  );
});
