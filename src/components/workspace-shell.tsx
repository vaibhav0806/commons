"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./brand";
import { DialogSurface } from "./ui/dialog-surface";
import { FileUpload } from "./file-upload";

const SidebarContext = createContext({ collapsed: false, toggle: () => {} });

export function WorkspaceShell({
  children,
  initialCollapsed,
}: {
  children: React.ReactNode;
  initialCollapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const router = useRouter();
  const [uploadProject, setUploadProject] = useState<string | null>(null);
  function change(value: boolean) {
    setCollapsed(value);
    document.cookie = `commons-sidebar=${value ? "closed" : "open"}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  useEffect(() => {
    const create = () => change(false);
    const upload = (event: Event) =>
      setUploadProject((event as CustomEvent<string>).detail);
    window.addEventListener("commons:create-project", create);
    window.addEventListener("commons:create-folder", create);
    window.addEventListener("commons:upload", upload);
    return () => {
      window.removeEventListener("commons:create-project", create);
      window.removeEventListener("commons:create-folder", create);
      window.removeEventListener("commons:upload", upload);
    };
  }, []);
  return (
    <SidebarContext.Provider
      value={{ collapsed, toggle: () => change(!collapsed) }}
    >
      <div
        className="workspace"
        data-sidebar-collapsed={collapsed || undefined}
      >
        {children}
      </div>
      <DialogSurface
        open={!!uploadProject}
        onOpenChange={(open) => {
          if (!open) setUploadProject(null);
        }}
        title="Upload files"
        variant="command"
      >
        {uploadProject && (
          <FileUpload
            key={uploadProject}
            projectId={uploadProject}
            onUploaded={() => {
              if (!document.querySelector(".document-editor")) router.refresh();
            }}
          />
        )}
      </DialogSurface>
    </SidebarContext.Provider>
  );
}

export function SidebarToggle() {
  const { collapsed, toggle } = useContext(SidebarContext);
  return (
    <button
      type="button"
      className="icon-button desktop-sidebar-toggle"
      onClick={toggle}
      aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
      title={collapsed ? "Show sidebar" : "Hide sidebar"}
      aria-expanded={!collapsed}
      aria-controls="workspace-sidebar"
    >
      <Icon name="List" />
    </button>
  );
}
