import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { ThemeToggle } from "@/components/theme-toggle";
import { docsPages } from "./content";
import "./docs.css";

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="commons-docs" id="main">
      <RootProvider theme={{ enabled: false }} search={{ enabled: false }}>
        <DocsLayout
          nav={{ title: "commons / docs", url: "/docs" }}
          tree={{ name: "Documentation", children: docsPages.map((page) => ({ type: "page", name: page.title, url: page.url })) }}
          themeSwitch={{ enabled: false }}
          searchToggle={{ enabled: false }}
          sidebar={{ footer: <ThemeToggle /> }}
          links={[{ text: "Open Commons", url: "/start" }]}
        >
          {children}
        </DocsLayout>
      </RootProvider>
    </div>
  );
}
