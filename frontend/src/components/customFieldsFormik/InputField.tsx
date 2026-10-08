import React, { ChangeEvent, useState } from "react";
import { Input, InputProps } from "../ui/input";
import { AdditionalFormikProps } from "@/types/common.types";
import { Label } from "../ui/label";
import { twMerge } from "tailwind-merge";
import { get, isString } from "lodash";
import CommonIcons from "../commonIcons";

export interface InputFieldProps extends InputProps {
  label?: string | React.ReactNode;
  required?: boolean;
  classNameLabel?: string;
  classNameContainer?: string;
  helperText?: string | React.ReactNode;
  afterOnChange?: (e: ChangeEvent) => void;
  as?: React.ElementType;
  rows?: number;
  endIcon?: React.ReactNode;
}

const InputField = (props: InputFieldProps & AdditionalFormikProps) => {
  const {
    label,
    classNameLabel,
    classNameContainer,
    form,
    field,
    className,
    required,
    type,
    helperText,
    endIcon,
    as: Component = Input,
    children,
    ...restPropsInput
  } = props;
  const { name, onBlur, onChange, value } = field;
  const { errors, touched } = form;
  const [seeText, setSeeText] = useState(false);

  const msgError = get(touched, name) && (get(errors, name) as string);
  const isPasswordType = type === "password";

  const inputId = (restPropsInput.id as string) || name;

  const onHandleChange = (e: ChangeEvent) => {
    onChange(e);
    props?.afterOnChange && props?.afterOnChange(e);
  };

  return (
    <div className={twMerge("grid w-full items-center gap-1.5", classNameContainer)}>
      {label && (
        <Label
          htmlFor={inputId}
          className={twMerge(
            "text-xs font-semibold text-black",
            required && "required",
            classNameLabel
          )}
        >
          {label}
        </Label>
      )}
      <div className="relative">
        <Component
          type={seeText ? "text" : type}
          name={name}
          onBlur={onBlur}
          onChange={onHandleChange}
          value={value ?? ""}
          id={inputId}
          aria-invalid={!!msgError}
          aria-describedby={msgError ? `${name}-error` : helperText ? `${name}-hint` : undefined}
          className={twMerge(
            "w-full rounded-lg border border-[#e4e4e7] bg-white text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors",
            className,
            msgError && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          {...restPropsInput}
        >
          {children}
        </Component>

        {endIcon && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {endIcon}
          </div>
        )}

        {isPasswordType && (
          <button
            type="button"
            aria-label={seeText ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:text-black transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSeeText((prev) => !prev);
            }}
          >
            {seeText ? (
              <CommonIcons.EyeIcon size={16} />
            ) : (
              <CommonIcons.EyeOffIcon size={16} />
            )}
          </button>
        )}
      </div>
      {helperText && (
        <span id={`${name}-hint`} className="text-xs text-zinc-500">
          {helperText}
        </span>
      )}
      {isString(msgError) && (
        <p id={`${name}-error`} role="alert" className="text-xs text-red-500 font-medium">
          {msgError}
        </p>
      )}
    </div>
  );
};

export default InputField;
