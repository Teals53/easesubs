import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  isRequired?: boolean;
  showRequiredIndicator?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isPassword?: boolean;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    type,
    label,
    error,
    hint,
    isRequired = false,
    showRequiredIndicator = true,
    startIcon,
    endIcon,
    isPassword = false,
    containerClassName,
    id,
    "aria-describedby": ariaDescribedby,
    "aria-invalid": ariaInvalid,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    
    // Generate unique IDs if not provided
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;
    
    // Build aria-describedby
    const describedByIds = [
      ariaDescribedby,
      errorId,
      hintId,
    ].filter(Boolean).join(' ');
    
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const hasError = Boolean(error);
    
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium transition-colors",
              hasError ? "text-red-400" : "text-gray-200",
              disabled && "text-gray-500"
            )}
          >
            {label}
            {isRequired && showRequiredIndicator && (
              <span className="text-red-400 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              {startIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Color variations based on state
              hasError
                ? "border-red-500 bg-red-50/10 text-white focus-visible:ring-red-500"
                : isFocused
                ? "border-purple-500 bg-gray-700/50 text-white focus-visible:ring-purple-500"
                : "border-gray-600 bg-gray-700/50 text-white hover:border-gray-500 focus-visible:ring-purple-500",
              // Padding adjustments for icons
              startIcon && "pl-10",
              (endIcon || isPassword) && "pr-10",
              disabled && "bg-gray-800/50 border-gray-700 text-gray-400",
              className
            )}
            ref={ref}
            id={inputId}
            aria-describedby={describedByIds || undefined}
            aria-invalid={hasError || ariaInvalid}
            aria-required={isRequired}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* Password toggle or end icon */}
          {(isPassword || endIcon) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isPassword ? (
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={disabled ? -1 : 0}
                  disabled={disabled}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              ) : (
                <div className="text-gray-400">
                  {endIcon}
                </div>
              )}
            </div>
          )}
          
          {/* Error icon */}
          {hasError && !isPassword && !endIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
            </div>
          )}
        </div>
        
        {/* Hint text */}
        {hint && !hasError && (
          <p 
            id={hintId}
            className={cn(
              "text-xs text-gray-400",
              disabled && "text-gray-600"
            )}
          >
            {hint}
          </p>
        )}
        
        {/* Error message */}
        {hasError && (
          <div 
            id={errorId}
            className="flex items-center space-x-1 text-xs text-red-400"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input }; 