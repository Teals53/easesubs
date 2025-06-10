'use client';

import React, { createContext, useContext, useState, useId } from 'react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface FormContextValue {
  errors: Record<string, string>;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

interface FormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  className?: string;
  autoComplete?: 'on' | 'off';
  noValidate?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function Form({ 
  children, 
  onSubmit, 
  className,
  autoComplete = 'on',
  noValidate = true, // We handle validation ourselves
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...props 
}: FormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = useId();

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    clearAllErrors();
    
    try {
      await onSubmit(e);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextValue: FormContextValue = {
    errors,
    setError,
    clearError,
    clearAllErrors,
    isSubmitting,
    setIsSubmitting,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        id={formId}
        onSubmit={handleSubmit}
        className={cn("space-y-6", className)}
        autoComplete={autoComplete}
        noValidate={noValidate}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Hook to access form context
export function useForm() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a Form component');
  }
  return context;
}

// Form Field Wrapper
interface FormFieldProps {
  children: React.ReactNode;
  name: string;
  className?: string;
}

export function FormField({ children, name, className }: FormFieldProps) {
  const { errors } = useForm();
  const error = errors[name];

  return (
    <div className={cn("space-y-2", className)} data-field={name}>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="text-xs text-red-400 flex items-center space-x-1"
        >
          <AlertCircle className="w-3 w-3" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {children}
    </div>
  );
}

// Form Label
interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  isRequired?: boolean;
  showRequiredIndicator?: boolean;
  className?: string;
}

export function FormLabel({ 
  children, 
  htmlFor, 
  isRequired = false,
  showRequiredIndicator = true,
  className 
}: FormLabelProps) {
  return (
    <label 
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-medium text-gray-200 transition-colors",
        className
      )}
    >
      {children}
      {isRequired && showRequiredIndicator && (
        <span className="text-red-400 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

// Form Input (extends our Input component)
interface FormInputProps extends React.ComponentProps<typeof Input> {
  name: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
}

export function FormInput({ 
  name, 
  validation,
  onChange,
  onBlur,
  ...props 
}: FormInputProps) {
  const { setError, clearError } = useForm();

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
      setError(name, 'Invalid format');
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

    // Clear error if validation passes
    clearError(name);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    // Clear error on change
    clearError(name);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
    validateField(e.target.value);
  };

  return (
    <Input
      name={name}
      onChange={handleChange}
      onBlur={handleBlur}
      isRequired={validation?.required}
      {...props}
    />
  );
}

// Form Message (for success, info, or error messages)
interface FormMessageProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string;
}

export function FormMessage({ 
  type = 'info', 
  children, 
  className 
}: FormMessageProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  };

  const colors = {
    success: 'text-green-400 bg-green-500/10 border-green-500/30',
    error: 'text-red-400 bg-red-500/10 border-red-500/30',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  };

  const Icon = icons[type];

  return (
    <div 
      className={cn(
        'flex items-center space-x-2 p-3 rounded-lg border text-sm',
        colors[type],
        className
      )}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

// Form Submit Button
interface FormSubmitProps extends React.ComponentProps<typeof Button> {
  loadingText?: string;
}

export function FormSubmit({ 
  children, 
  loadingText = 'Submitting...',
  disabled,
  ...props 
}: FormSubmitProps) {
  const { isSubmitting } = useForm();

  return (
    <Button
      type="submit"
      isLoading={isSubmitting}
      loadingText={loadingText}
      disabled={disabled || isSubmitting}
      aria-describedby={isSubmitting ? 'submit-loading' : undefined}
      {...props}
    >
      {children}
      {isSubmitting && (
        <span id="submit-loading" className="sr-only">
          Form is being submitted
        </span>
      )}
    </Button>
  );
}

// Form Error Summary (useful for screen readers)
interface FormErrorSummaryProps {
  className?: string;
  heading?: string;
}

export function FormErrorSummary({ 
  className,
  heading = 'Please correct the following errors:' 
}: FormErrorSummaryProps) {
  const { errors } = useForm();
  const errorEntries = Object.entries(errors);

  if (errorEntries.length === 0) return null;

  return (
    <div 
      className={cn(
        'bg-red-500/10 border border-red-500/30 rounded-lg p-4',
        className
      )}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
    >
      <h3 className="font-medium text-red-400 mb-2 flex items-center">
        <AlertCircle className="w-4 h-4 mr-2" aria-hidden="true" />
        {heading}
      </h3>
      <ul className="space-y-1">
        {errorEntries.map(([field, error]) => (
          <li key={field} className="text-sm text-red-300">
            <button
              type="button"
              className="text-left hover:underline focus:underline focus:outline-none"
              onClick={() => {
                // Focus the field with the error
                const element = document.querySelector(`[name="${field}"]`) as HTMLElement;
                element?.focus();
              }}
            >
              {field}: {error}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 