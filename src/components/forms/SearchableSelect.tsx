import React, { useEffect, useMemo, useRef, useState } from "react";
import { FormInput } from "./FormInput";

type SelectOption = {
  value: string | number;
  label: string;
};

type SearchableSelectProps = {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onValueChange: (value: string) => void;
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  error,
  options,
  placeholder,
  value,
  onValueChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return options;

    return options.filter((option) => {
      const searchableText = `${option.label} ${option.value}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [options, searchTerm]);

  const selectedLabel = useMemo(
    () => options.find((option) => String(option.value) === value)?.label || "",
    [options, value],
  );

  useEffect(() => {
    setSearchTerm(selectedLabel);
  }, [selectedLabel]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handlePick = (option: SelectOption) => {
    setSearchTerm(option.label);
    setOpen(false);
    onValueChange(String(option.value));
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <FormInput
        label={label}
        value={searchTerm}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const nextValue = e.target.value;
          setSearchTerm(nextValue);
          setOpen(true);
          onValueChange("");
        }}
        placeholder={placeholder || "Type to search members"}
        error={error}
      />
      {open && filteredOptions.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-md border border-border bg-white shadow-lg">
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="block w-full border-b border-border px-4 py-3 text-left text-sm text-text last:border-b-0 hover:bg-primary/10"
              onClick={() => handlePick(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {open && searchTerm.trim() && filteredOptions.length === 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-text-secondary shadow-lg">
          No matches found.
        </div>
      )}
    </div>
  );
};
