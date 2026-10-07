import { isString } from "lodash";
import { toast, ToastOptions } from "react-toastify";

export const showSuccess = (msg: unknown, options?: ToastOptions) => {
  if (isString(msg)) {
    toast.success(msg, options);
    return;
  }

  toast.success("Thành công");
};

export const showError = (error: unknown, options?: ToastOptions) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { errors?: unknown; title?: unknown } } }).response;
    if (response?.data?.errors) {
      toast.error(JSON.stringify(response.data.errors));
      return;
    }

    if (response?.data?.title) {
      toast.error(JSON.stringify(response.data.title));
      return;
    }
  }

  if (isString(error)) {
    toast.error(error, options);
    return;
  }

  if (error && typeof (error as { toString?: () => string }).toString === "function") {
    const str = (error as { toString: () => string }).toString();
    if (str && str !== "[object Object]") {
      toast.error(str, options);
      return;
    }
  }

  toast.error("Error default");
};
