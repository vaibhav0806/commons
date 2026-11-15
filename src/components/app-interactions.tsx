"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ConnectForm } from "./forms";
import { DialogSurface } from "./ui/dialog-surface";
import type { Project } from "@/lib/store";

type Interactions = {
  connect: (projectId?: string) => void;
};
const Context = createContext<Interactions | null>(null);

export function AppInteractions({
  children,
  projects,
  owner,
  origin,
}: {
  children: ReactNode;
  projects: Project[];
  owner: boolean;
  origin: string;
}) {
  const pathname = usePathname();
  const currentProject =
    projects.find((project) => pathname.includes(project.id)) || projects[0];
  const [connectOpen, setConnectOpen] = useState(false),
    [scope, setScope] = useState<string>();
  const connectReturn = useRef<HTMLElement | null>(null);
  return (
    <Context.Provider
      value={{
        connect: (projectId) => {
          if (!owner) return;
          connectReturn.current = document.activeElement as HTMLElement;
          setScope(projectId || currentProject?.id);
          setConnectOpen(true);
        },
      }}
    >
      {children}
      {owner && (
        <DialogSurface
          open={connectOpen}
          onOpenChange={setConnectOpen}
          title="Connect an agent"
          description="Choose its access. Your agent joins and introduces itself."
          finalFocus={connectReturn}
        >
          <ConnectForm
            key={scope || "workspace"}
            projects={projects}
            origin={origin}
            initialProject={scope}
          />
        </DialogSurface>
      )}
    </Context.Provider>
  );
}

export function ConnectAgentButton({
  children,
  className = "button",
  projectId,
  label,
}: {
  children: ReactNode;
  className?: string;
  projectId?: string;
  label?: string;
}) {
  const interactions = useContext(Context);
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => interactions?.connect(projectId)}
    >
      {children}
    </button>
  );
}
