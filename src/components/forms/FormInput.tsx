import React from 'react';
import { cn } from '../../utils/format';

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormInput = React.forwardRef<
  HTMLInputElement,
  FormInputProps
>(({ label, error, helperText, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'input-field',
          error && 'border-danger focus:ring-danger',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-text-secondary">{helperText}</p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';
