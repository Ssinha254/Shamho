import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/format';

interface SelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const FormSelect = React.forwardRef<
  HTMLSelectElement,
  FormSelectProps
>(({ label, error, options, placeholder, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'input-field appearance-none pr-10',
            error && 'border-danger focus:ring-danger',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';
