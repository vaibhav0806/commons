"use client";

import { useId, useState } from "react";
import { Select } from "@base-ui/react/select";
import { Icon } from "@/components/brand";

export type SelectOption = {
  value: string;
  label: string;
  image?: string;
  disabled?: boolean;
};

export function SelectField({
  label,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  description,
  placeholder = "Choose an option",
  disabled = false,
  hiddenLabel = false,
}: {
  label: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  hiddenLabel?: boolean;
}) {
  const helpId = useId();
  const [localValue, setLocalValue] = useState(defaultValue || "");
  const selected = value === undefined ? localValue : value;
  const selectedOption = options.find((option) => option.value === selected);
  const emptyValue = "__commons_empty__";
  const items = options.map((option) => ({
    ...option,
    value: option.value || emptyValue,
  }));
  const encoded =
    selected ||
    (options.some((option) => option.value === "") ? emptyValue : null);
  return (
    <div className="field select-field">
      {name && (
        <input type="hidden" name={name} value={selected} disabled={disabled} />
      )}
      <Select.Root<string>
        items={items}
        value={encoded}
        disabled={disabled || !options.length}
        onValueChange={(next) => {
          if (next !== null) {
            const decoded = next === emptyValue ? "" : next;
            setLocalValue(decoded);
            onValueChange?.(decoded);
          }
        }}
      >
        <Select.Label
          className={hiddenLabel ? "visually-hidden" : "field-label"}
        >
          {label}
        </Select.Label>
        <Select.Trigger
          className="select-trigger"
          aria-describedby={description ? helpId : undefined}
        >
          <span className="select-value">
            {selectedOption?.image && (
              <img src={selectedOption.image} alt="" width="22" height="22" />
            )}
            <Select.Value placeholder={placeholder} />
          </span>
          <Select.Icon className="select-chevron">
            <Icon name="CaretDown" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className="select-positioner"
            sideOffset={8}
            align="start"
            alignItemWithTrigger={false}
          >
            <Select.Popup className="select-popup" data-select-popup>
              <Select.List className="select-list">
                {items.map((option) => (
                  <Select.Item
                    className="select-option"
                    key={option.value}
                    value={option.value}
                    data-option-value={option.value}
                    disabled={option.disabled}
                  >
                    {option.image && (
                      <img src={option.image} alt="" width="22" height="22" />
                    )}
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className="select-check">
                      <Icon name="Check" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {description && <small id={helpId}>{description}</small>}
    </div>
  );
}
