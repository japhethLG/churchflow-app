import type { ChangeEventHandler, HTMLInputTypeAttribute } from "react";
import { Input as ShadedInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/lib/utils";

export const Input = ({
  label,
  icon,
  value,
  placeholder,
  helper,
  error,
  prefix,
  suffix,
  fullWidth = true,
  className,
  onChange,
  type = "text",
  disabled,
  readOnly,
}: {
  label?: string;
  icon?: IconName;
  value?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  fullWidth?: boolean;
  className?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: HTMLInputTypeAttribute;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const interactive = Boolean(onChange);

  return (
    <div className={cn("flex flex-col gap-2", fullWidth ? "w-full" : "w-fit")}>
      {label && (
        <Label className="text-[13px] font-medium text-muted-foreground ml-1">
          {label}
        </Label>
      )}
      <div
        className={cn(
          "flex h-11 items-center gap-2.5 rounded-xl border-1.5 px-3.5 transition-all focus-within:ring-2 focus-within:ring-ring/20",
          disabled ? "bg-secondary opacity-60" : "bg-input",
          error ? "border-destructive ring-destructive/10" : "border-transparent",
          className
        )}
      >
        {icon && <Icon name={icon} size={16} className="text-muted-foreground shrink-0" />}
        {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
        
        {interactive ? (
          <ShadedInput
            type={type}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            className="h-full border-none bg-transparent p-0 text-[14.5px] shadow-none focus-visible:ring-0 tabular-nums"
          />
        ) : (
          <span className={cn("flex-1 text-[14.5px] tabular-nums", value ? "text-foreground" : "text-muted-foreground")}>
            {value || placeholder}
          </span>
        )}

        {suffix && <span className="text-[13px] text-muted-foreground shrink-0">{suffix}</span>}
      </div>
      
      {helper && !error && (
        <p className="ml-1 text-[12px] text-muted-foreground">{helper}</p>
      )}
      {error && <p className="ml-1 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
