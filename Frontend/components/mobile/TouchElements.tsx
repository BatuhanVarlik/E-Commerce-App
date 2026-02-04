"use client";

import {
  forwardRef,
  useId,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { FaSpinner, FaCheck, FaMinus, FaPlus } from "react-icons/fa";

// Touch-friendly button
interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      icon,
      iconPosition = "left",
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all touch-manipulation active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

    const variantClasses = {
      primary:
        "bg-custom-orange text-white hover:bg-orange-600 active:bg-orange-700",
      secondary:
        "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
      outline:
        "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100",
      ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    };

    // Mobil için minimum 44px touch target
    const sizeClasses = {
      sm: "min-h-[36px] px-3 py-1.5 text-sm gap-1.5",
      md: "min-h-[44px] px-4 py-2.5 text-base gap-2",
      lg: "min-h-12 px-6 py-3 text-lg gap-2",
      xl: "min-h-[56px] px-8 py-4 text-lg gap-3",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <FaSpinner className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === "right" && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  },
);

TouchButton.displayName = "TouchButton";

// Touch-friendly input
interface TouchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>(
  (
    { label, error, helperText, leftIcon, rightIcon, className = "", ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = props.id || props.name || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full min-h-12 px-4 py-3 text-base
              border rounded-lg bg-white
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-custom-orange focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              touch-manipulation
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300"}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  },
);

TouchInput.displayName = "TouchInput";

// Touch-friendly select
interface TouchSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const TouchSelect = forwardRef<HTMLSelectElement, TouchSelectProps>(
  ({ label, error, helperText, options, className = "", ...props }, ref) => {
    const generatedId = useId();
    const selectId = props.id || props.name || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full min-h-12 px-4 py-3 text-base
            border rounded-lg bg-white appearance-none
            focus:outline-none focus:ring-2 focus:ring-custom-orange focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            touch-manipulation
            bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23374151%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-size-3 bg-position-[right_12px_center] bg-no-repeat
            ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300"}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  },
);

TouchSelect.displayName = "TouchSelect";

// Touch-friendly textarea
interface TouchTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TouchTextarea = forwardRef<
  HTMLTextAreaElement,
  TouchTextareaProps
>(({ label, error, helperText, className = "", ...props }, ref) => {
  const generatedId = useId();
  const textareaId = props.id || props.name || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`
            w-full min-h-30 px-4 py-3 text-base
            border rounded-lg bg-white resize-y
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-custom-orange focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            touch-manipulation
            ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300"}
            ${className}
          `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

TouchTextarea.displayName = "TouchTextarea";

// Touch-friendly checkbox
interface TouchCheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  description?: string;
}

export const TouchCheckbox = forwardRef<HTMLInputElement, TouchCheckboxProps>(
  ({ label, description, className = "", ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = props.id || props.name || generatedId;

    return (
      <label
        htmlFor={checkboxId}
        className={`flex items-start gap-3 p-3 -m-3 cursor-pointer touch-manipulation ${className}`}
      >
        <div className="relative flex items-center justify-center w-6 h-6 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="peer sr-only"
            {...props}
          />
          <div className="absolute inset-0 border-2 border-gray-300 rounded peer-checked:border-custom-orange peer-checked:bg-custom-orange peer-focus:ring-2 peer-focus:ring-custom-orange/30 transition-all" />
          <FaCheck className="relative w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        <div className="flex-1">
          <span className="text-base font-medium text-gray-900">{label}</span>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </label>
    );
  },
);

TouchCheckbox.displayName = "TouchCheckbox";

// Touch-friendly radio
interface TouchRadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  description?: string;
}

export const TouchRadio = forwardRef<HTMLInputElement, TouchRadioProps>(
  ({ label, description, className = "", ...props }, ref) => {
    const generatedId = useId();
    const radioId = props.id || generatedId;

    return (
      <label
        htmlFor={radioId}
        className={`flex items-start gap-3 p-3 -m-3 cursor-pointer touch-manipulation ${className}`}
      >
        <div className="relative flex items-center justify-center w-6 h-6 mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className="peer sr-only"
            {...props}
          />
          <div className="absolute inset-0 border-2 border-gray-300 rounded-full peer-checked:border-custom-orange peer-focus:ring-2 peer-focus:ring-custom-orange/30 transition-all" />
          <div className="relative w-3 h-3 rounded-full bg-custom-orange scale-0 peer-checked:scale-100 transition-transform" />
        </div>
        <div className="flex-1">
          <span className="text-base font-medium text-gray-900">{label}</span>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </label>
    );
  },
);

TouchRadio.displayName = "TouchRadio";

// Touch-friendly quantity selector
interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
}: QuantitySelectorProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation`}
        aria-label="Azalt"
      >
        <FaMinus className="w-3 h-3 text-gray-600" />
      </button>
      <span
        className={`${sizeClasses[size]} flex items-center justify-center font-medium text-gray-900 min-w-10`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation`}
        aria-label="Artır"
      >
        <FaPlus className="w-3 h-3 text-gray-600" />
      </button>
    </div>
  );
}

// Touch-friendly toggle switch
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-custom-orange focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? "bg-custom-orange" : "bg-gray-200"}
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span className="text-base font-medium text-gray-900">{label}</span>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}
