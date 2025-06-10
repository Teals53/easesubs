'use client';

import React, { createContext, useContext, useState, useId, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { announceToScreenReader } from '@/lib/accessibility';

interface AccessibleFormContextValue {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  setTouched: (field: string, touched: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  formId: string;
}

const AccessibleFormContext = createContext<AccessibleFormContextValue | null>(null);

interface AccessibleFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  className?: string;
  autoComplete?: 'on' | 'off';
  noValidate?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  announceErrors?: boolean;
}

export function AccessibleForm({ 
  children, 
  onSubmit, 
  className,
  autoComplete = 'on',
  noValidate = true,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  announceErrors = true,
  ...props 
}: AccessibleFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = useId();
  const previousErrorCount = useRef(0);

  const setError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const setTouched = (field: string, touched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: touched }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(e);
      if (announceErrors) {
        announceToScreenReader('Form submitted successfully', 'polite');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      if (announceErrors) {
        announceToScreenReader('Form submission failed. Please check for errors.', 'assertive');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Announce errors to screen readers when they change
  useEffect(() => {
    if (!announceErrors) return;
    
    const errorCount = Object.keys(errors).length;
    if (errorCount > previousErrorCount.current) {
      const newErrors = Object.keys(errors).length - previousErrorCount.current;
      announceToScreenReader(
        `${newErrors} form ${newErrors === 1 ? 'error' : 'errors'} found. Please review and correct.`,
        'assertive'
      );
    }
    previousErrorCount.current = errorCount;
  }, [errors, announceErrors]);

  const contextValue: AccessibleFormContextValue = {
    errors,
    touched,
    setError,
    clearError,
    clearAllErrors,
    setTouched,
    isSubmitting,
    setIsSubmitting,
    formId,
  };

  return (
    <AccessibleFormContext.Provider value={contextValue}>
      <form
        id={formId}
        onSubmit={handleSubmit}
        className={cn("space-y-6", className)}
        autoComplete={autoComplete}
        noValidate={noValidate}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        {...props}
      >
        {children}
      </form>
    </AccessibleFormContext.Provider>
  );
}

// Hook to access form context
export function useAccessibleForm() {
  const context = useContext(AccessibleFormContext);
  if (!context) {
    throw new Error('useAccessibleForm must be used within an AccessibleForm component');
  }
  return context;
}

// Enhanced Form Field Wrapper
interface AccessibleFormFieldProps {
  children: React.ReactNode;
  name: string;
  className?: string;
  required?: boolean;
  description?: string;
}

export function AccessibleFormField({ 
  children, 
  name, 
  className, 
  required = false,
  description 
}: AccessibleFormFieldProps) {
  const { errors, touched } = useAccessibleForm();
  const error = errors[name];
  const isFieldTouched = touched[name];
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className={cn("space-y-2", className)} data-field={name}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const childProps = child.props as Record<string, unknown>;
          const existingAriaDescribedby = childProps['aria-describedby'] as string | undefined;
          
          return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
            'aria-invalid': error ? 'true' : 'false',
            'aria-describedby': cn(
              error ? errorId : '',
              description ? descriptionId : '',
              existingAriaDescribedby
            ).trim() || undefined,
            'aria-required': required,
          } as Record<string, unknown>);
        }
        return child;
      })}
      
      {description && (
        <div id={descriptionId} className="text-sm text-gray-400">
          {description}
        </div>
      )}
      
      {error && isFieldTouched && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm text-red-400 flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Enhanced Form Label
interface AccessibleFormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  isRequired?: boolean;
  showRequiredIndicator?: boolean;
  className?: string;
  optional?: boolean;
}

export function AccessibleFormLabel({ 
  children, 
  htmlFor, 
  isRequired = false,
  showRequiredIndicator = true,
  optional = false,
  className 
}: AccessibleFormLabelProps) {
  return (
    <label 
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-medium text-gray-200 transition-colors",
        className
      )}
    >
      <span className="flex items-center space-x-2">
        <span>{children}</span>
        {isRequired && showRequiredIndicator && (
          <span className="text-red-400" aria-label="required field">
            *
          </span>
        )}
        {optional && !isRequired && (
          <span className="text-gray-400 text-xs" aria-label="optional field">
            (optional)
          </span>
        )}
      </span>
    </label>
  );
}

// Enhanced Form Input with accessibility features
interface AccessibleFormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  name: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
  showPasswordToggle?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function AccessibleFormInput({ 
  name, 
  validation,
  showPasswordToggle = false,
  onChange,
  onBlur,
  type = 'text',
  className,
  ...props 
}: AccessibleFormInputProps) {
  const { setError, clearError, setTouched } = useAccessibleForm();
  const [showPassword, setShowPassword] = useState(false);
  const [value, setValue] = useState(props.defaultValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateField = (value: string) => {
    if (!validation) return;

    // Required validation
    if (validation.required && !value.trim()) {
      setError(name, 'This field is required');
      return;
    }

    // Min length validation
    if (validation.minLength && value.length < validation.minLength) {
      setError(name, `Must be at least ${validation.minLength} characters`);
      return;
    }

    // Max length validation
    if (validation.maxLength && value.length > validation.maxLength) {
      setError(name, `Must be no more than ${validation.maxLength} characters`);
      return;
    }

    // Pattern validation
    if (validation.pattern && !validation.pattern.test(value)) {
      setError(name, 'Please enter a valid format');
      return;
    }

    // Custom validation
    if (validation.custom) {
      const customError = validation.custom(value);
      if (customError) {
        setError(name, customError);
        return;
      }
    }

    // If we get here, validation passed
    clearError(name);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    validateField(newValue);
    onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(name, true);
    validateField(e.target.value);
    onBlur?.(e);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={inputType}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          className
        )}
        {...props}
      />
      
      {type === 'password' && showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={0}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}

// Enhanced Form Textarea
interface AccessibleFormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'onBlur'> {
  name: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    custom?: (value: string) => string | null;
  };
  showCharacterCount?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export function AccessibleFormTextarea({ 
  name, 
  validation,
  showCharacterCount = false,
  onChange,
  onBlur,
  className,
  maxLength,
  ...props 
}: AccessibleFormTextareaProps) {
  const { setError, clearError, setTouched } = useAccessibleForm();
  const [value, setValue] = useState(props.defaultValue || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validateField = (value: string) => {
    if (!validation) return;

    if (validation.required && !value.trim()) {
      setError(name, 'This field is required');
      return;
    }

    if (validation.minLength && value.length < validation.minLength) {
      setError(name, `Must be at least ${validation.minLength} characters`);
      return;
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      setError(name, `Must be no more than ${validation.maxLength} characters`);
      return;
    }

    if (validation.custom) {
      const customError = validation.custom(value);
      if (customError) {
        setError(name, customError);
        return;
      }
    }

    clearError(name);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    validateField(newValue);
    onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTouched(name, true);
    validateField(e.target.value);
    onBlur?.(e);
  };

  const characterCount = typeof value === 'string' ? value.length : 0;
  const maxChars = maxLength || validation?.maxLength;

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={maxLength}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors resize-vertical",
          className
        )}
        {...props}
      />
      
      {showCharacterCount && maxChars && (
        <div className="text-xs text-gray-400 text-right">
          <span className={characterCount > maxChars * 0.9 ? 'text-yellow-400' : ''}>
            {characterCount}
          </span>
          <span className="text-gray-500">/{maxChars}</span>
        </div>
      )}
    </div>
  );
}

// Form Message Component
interface AccessibleFormMessageProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}

export function AccessibleFormMessage({ 
  type = 'info', 
  children, 
  className,
  role = 'status'
}: AccessibleFormMessageProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'text-green-400 border-green-500/30 bg-green-500/10',
    error: 'text-red-400 border-red-500/30 bg-red-500/10',
    warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  };

  const Icon = icons[type];

  return (
    <div
      role={type === 'error' ? 'alert' : role}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        "flex items-start space-x-3 p-4 rounded-lg border",
        colors[type],
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm">{children}</div>
    </div>
  );
}

// Enhanced Form Submit Button
interface AccessibleFormSubmitProps extends React.ComponentProps<typeof Button> {
  loadingText?: string;
  successText?: string;
  showSuccessState?: boolean;
}

export function AccessibleFormSubmit({ 
  children, 
  loadingText = 'Submitting...',
  successText = 'Submitted!',
  showSuccessState = false,
  disabled,
  ...props 
}: AccessibleFormSubmitProps) {
  const { isSubmitting } = useAccessibleForm();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccessState && !isSubmitting) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting, showSuccessState]);

  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      isLoading={isSubmitting}
      loadingText={loadingText}
      aria-describedby={isSubmitting ? 'form-submitting-status' : undefined}
      {...props}
    >
      {showSuccess ? successText : children}
      {isSubmitting && (
        <span id="form-submitting-status" className="sr-only">
          Form is being submitted. Please wait.
        </span>
      )}
    </Button>
  );
}

// Form Error Summary Component
interface AccessibleFormErrorSummaryProps {
  className?: string;
  heading?: string;
  showWhenNoErrors?: boolean;
}

export function AccessibleFormErrorSummary({ 
  className,
  heading = 'Please correct the following errors:',
  showWhenNoErrors = false
}: AccessibleFormErrorSummaryProps) {
  const { errors, formId } = useAccessibleForm();
  const errorEntries = Object.entries(errors);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorEntries.length > 0 && summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [errorEntries.length]);

  if (errorEntries.length === 0 && !showWhenNoErrors) {
    return null;
  }

  return (
    <div
      ref={summaryRef}
      role="alert"
      aria-labelledby={`${formId}-error-summary-heading`}
      tabIndex={-1}
      className={cn(
        "p-4 rounded-lg border",
        errorEntries.length > 0 
          ? "border-red-500/30 bg-red-500/10" 
          : "border-green-500/30 bg-green-500/10",
        className
      )}
    >
      <h3 
        id={`${formId}-error-summary-heading`}
        className={cn(
          "font-medium mb-3 flex items-center",
          errorEntries.length > 0 ? "text-red-400" : "text-green-400"
        )}
      >
        {errorEntries.length > 0 ? (
          <>
            <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
            {heading}
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
            All fields are valid
          </>
        )}
      </h3>
      
      {errorEntries.length > 0 && (
        <ul className="space-y-2 text-sm">
          {errorEntries.map(([field, error]) => (
            <li key={field} className="text-red-300">
              <button
                type="button"
                onClick={() => {
                  const fieldElement = document.querySelector(`[name="${field}"]`) as HTMLElement;
                  fieldElement?.focus();
                }}
                className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
              >
                {field}: {error}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 