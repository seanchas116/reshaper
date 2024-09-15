import React, { useEffect, useRef } from "react";
import { mergeRefs } from "react-merge-refs";

export const ExplicitInput = React.forwardRef(
  ({ value, onChangeValue, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const elem = innerRef.current;
      if (!elem) {
        return;
      }

      const onChange = () => {
        onChangeValue?.(elem.value);
      };
      elem.addEventListener("change", onChange);
      return () => {
        elem.removeEventListener("change", onChange);
      };
    }, [onChangeValue]);

    useEffect(() => {
      const elem = innerRef.current;
      if (!elem) {
        return;
      }
      const newValue = value ?? "";
      if (elem.value !== newValue) {
        elem.value = newValue;
      }
    });

    return <input ref={mergeRefs([ref, innerRef])} {...props} />;
  },
) as React.FC<
  JSX.IntrinsicElements["input"] & {
    value?: string;
    onChangeValue?: (value: string) => void;
  }
>;
ExplicitInput.displayName = "ExplicitInput";
