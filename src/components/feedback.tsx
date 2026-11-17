"use client";

import { Toast } from "@base-ui/react/toast";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Icon } from "./brand";

type FeedbackOptions = {
  id?: string;
  title?: string;
};

type FeedbackContextValue = {
  error: (description: string, options?: FeedbackOptions) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider limit={3} timeout={0}>
      <FeedbackContent>{children}</FeedbackContent>
    </Toast.Provider>
  );
}

function FeedbackContent({ children }: { children: ReactNode }) {
  const { add, toasts } = Toast.useToastManager();
  const error = useCallback(
    (description: string, options: FeedbackOptions = {}) => {
      add({
        description,
        id: options.id,
        priority: "high",
        title: options.title ?? "Couldn’t complete that",
        type: "error",
      });
    },
    [add],
  );
  const value = useMemo(() => ({ error }), [error]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Toast.Portal>
        <Toast.Viewport
          aria-label="Notifications"
          className="feedback-viewport"
        >
          {toasts.map((toast) => (
            <Toast.Root className="feedback-toast" key={toast.id} toast={toast}>
              <Toast.Content className="feedback-toast-content">
                <Toast.Title className="feedback-toast-title" />
                <Toast.Description className="feedback-toast-description" />
              </Toast.Content>
              <Toast.Close
                aria-label="Dismiss notification"
                className="feedback-toast-close"
              >
                <Icon name="X" />
              </Toast.Close>
            </Toast.Root>
          ))}
        </Toast.Viewport>
      </Toast.Portal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const feedback = useContext(FeedbackContext);
  if (!feedback) {
    throw new Error("useFeedback must be used inside FeedbackProvider");
  }
  return feedback;
}
