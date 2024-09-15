import { createRef, useEffect } from "react";
import { ExplicitInput } from "./explicit-input";

export function ClickToEdit({
  className,
  inputClassName,
  previewClassName,
  value,
  editing,
  onChangeValue,
  onChangeEditing,
  trigger = "doubleClick",
  disabled,
}: {
  className?: string;
  inputClassName?: string;
  previewClassName?: string;
  value?: string;
  editing?: boolean;
  onChangeValue?: (value: string) => void;
  onChangeEditing?: (editing: boolean) => void;
  trigger?: "doubleClick" | "singleClick";
  disabled?: boolean;
}): JSX.Element {
  const inputRef = createRef<HTMLInputElement>();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  return (
    <div className={className}>
      {!disabled && editing ? (
        <ExplicitInput
          className={inputClassName}
          ref={inputRef}
          value={value}
          onChangeValue={(value) => {
            onChangeValue?.(value);
            onChangeEditing?.(false);
          }}
          onBlur={() => {
            onChangeEditing?.(false);
          }}
          onKeyDown={(e) => e.stopPropagation()}
          draggable={true}
          onDragStart={(event) => event.preventDefault()}
        />
      ) : (
        <div
          className={previewClassName}
          onClick={
            disabled
              ? undefined
              : () => trigger === "singleClick" && onChangeEditing?.(true)
          }
          onDoubleClick={
            disabled
              ? undefined
              : () => trigger === "doubleClick" && onChangeEditing?.(true)
          }
        >
          {value}
        </div>
      )}
    </div>
  );
}
