import React from "react";
import { AdditionalFormikProps } from "@/types/common.types";
import { Label } from "../ui/label";
import { twMerge } from "tailwind-merge";
import { get, isString } from "lodash";
import { Switch } from "../ui/switch";
import { SwitchProps } from "@radix-ui/react-switch";

interface SwitchBoxFieldProps extends SwitchProps {
  label?: string | React.ReactNode;
  required?: boolean;
  classNameLabel?: string;
  classNameContainer?: string;
  afterOnChange?: (checked: boolean) => void;
}

const SwitchBoxField = (props: SwitchBoxFieldProps & AdditionalFormikProps) => {
  const {
    label,
    classNameLabel,
    classNameContainer,
    form,
    field,
    required,
    ...restProps
  } = props;
  const { name, value } = field;
  const { errors, touched, setFieldValue, setFieldTouched } = form;

  const msgError = get(touched, name) && (get(errors, name) as string);

  const onHandleChange = (checked: boolean) => {
    setFieldValue(name, checked);
    props?.afterOnChange && props?.afterOnChange(checked);
    setFieldTouched(name, true);
  };

  return (
    <div className={twMerge("flex flex-col gap-1.5", classNameContainer)}>
      <div className="flex items-center gap-3">
        <Switch
          id={name}
          checked={value}
          onCheckedChange={onHandleChange}
          aria-invalid={!!msgError}
          aria-describedby={msgError ? `${name}-error` : undefined}
          {...restProps}
        />
        {label && (
          <Label
            htmlFor={name}
            className={twMerge("text-xs font-semibold text-black cursor-pointer", required && "required", classNameLabel)}
          >
            {label}
          </Label>
        )}
      </div>
      {isString(msgError) && (
        <p id={`${name}-error`} role="alert" className="text-xs text-red-500 font-medium">
          {msgError}
        </p>
      )}
    </div>
  );
};

export default SwitchBoxField;
