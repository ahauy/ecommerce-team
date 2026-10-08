import React from "react";
import { AdditionalFormikProps, SelectOption } from "@/types/common.types";
import { Label } from "../ui/label";
import { twMerge } from "tailwind-merge";
import { get, isString } from "lodash";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { RadioGroupProps } from "@radix-ui/react-radio-group";

interface RadioFieldProps extends RadioGroupProps {
  label?: string | React.ReactNode;
  required?: boolean;
  classNameLabel?: string;
  classNameContainer?: string;
  afterOnChange?: (value: string) => void;
  options?: SelectOption[];
}

const RadioField = (props: RadioFieldProps & AdditionalFormikProps) => {
  const {
    classNameLabel,
    classNameContainer,
    form,
    field,
    options,
    label,
    required,
    className,
    ...restProps
  } = props;
  const { name, value } = field;
  const { errors, touched, setFieldValue } = form;

  const msgError = get(touched, name) && (get(errors, name) as string);

  const onHandleChange = (value: string) => {
    setFieldValue(name, value);
    props?.afterOnChange && props?.afterOnChange(value);
  };

  return (
    <div className={twMerge("flex flex-col gap-2", classNameContainer)}>
      {label && (
        <Label className={twMerge("text-xs font-semibold text-black", required && "required", classNameLabel)}>
          {label}
        </Label>
      )}
      <RadioGroup
        className={twMerge("gap-3", className)}
        onValueChange={onHandleChange}
        {...restProps}
      >
        {options?.map((el, index) => {
          const id = `${name}-${el.value ?? index}`;
          return (
            <div key={`${el.value}-${index}`} className="flex items-center gap-2.5">
              <RadioGroupItem
                id={id}
                checked={value === el.value}
                value={el.value}
              />
              <Label htmlFor={id} className="text-xs font-medium text-black cursor-pointer">
                {el.label}
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {isString(msgError) && (
        <p id={`${name}-error`} role="alert" className="text-xs text-red-500 font-medium">
          {msgError}
        </p>
      )}
    </div>
  );
};

export default RadioField;
