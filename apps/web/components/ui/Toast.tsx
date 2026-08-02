"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils";

type ToastType = "info" | "success" | "warning" | "error";

const manager = ToastPrimitive.createToastManager();

const RULE_COLOR: Record<ToastType, string> = {
  info: "bg-violet-bright",
  success: "bg-healthy",
  warning: "bg-warn",
  error: "bg-danger",
};

interface ToastOptions {
  description?: ReactNode;
  timeout?: number;
}

function addToast(type: ToastType, title: ReactNode, options: ToastOptions = {}) {
  return manager.add({
    title,
    description: options.description,
    type,
    timeout: options.timeout ?? (type === "error" ? 8000 : 5000),
  });
}

export const toast = {
  info: (title: ReactNode, options?: ToastOptions) => addToast("info", title, options),
  success: (title: ReactNode, options?: ToastOptions) => addToast("success", title, options),
  warning: (title: ReactNode, options?: ToastOptions) => addToast("warning", title, options),
  error: (title: ReactNode, options?: ToastOptions) => addToast("error", title, options),
  dismiss: (id?: string) => manager.close(id),
  promise: manager.promise,
};

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((t) => {
    const type = (t.type as ToastType) || "info";
    return (
      <ToastPrimitive.Root
        key={t.id}
        toast={t}
        className="toast-root"
        style={{ "--toast-duration": `${t.timeout ?? 5000}ms` } as React.CSSProperties}
      >
        <ToastPrimitive.Content className="toast-content relative flex flex-col gap-1 overflow-hidden border border-hairline bg-panel py-3 pl-4 pr-8 data-[behind]:opacity-0">
          <span className={cn("absolute inset-y-0 left-0 w-[3px]", RULE_COLOR[type])} />
          <ToastPrimitive.Title className="font-body text-sm text-body" />
          {t.description ? (
            <ToastPrimitive.Description className="font-body text-xs text-muted" />
          ) : null}
          <ToastPrimitive.Close
            aria-label="Dismiss"
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center border border-transparent font-body text-sm leading-none text-muted transition-colors hover:border-hairline hover:text-body"
          >
            &times;
          </ToastPrimitive.Close>
          <span
            className={cn("toast-bar absolute bottom-0 left-0 h-[2px] w-full origin-left", RULE_COLOR[type])}
          />
        </ToastPrimitive.Content>
      </ToastPrimitive.Root>
    );
  });
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastPrimitive.Provider toastManager={manager} limit={3}>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="toast-viewport">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}
