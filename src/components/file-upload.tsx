"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./brand";

const subscribeToHydration = () => () => {};

export function FileUpload({ projectId }: { projectId: string }) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const id = useId(),
    router = useRouter(),
    input = useRef<HTMLInputElement>(null),
    request = useRef<XMLHttpRequest | null>(null);
  const [status, setStatus] = useState<
      "idle" | "uploading" | "error" | "saved"
    >("idle"),
    [progress, setProgress] = useState(0),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [retry, setRetry] = useState<File | null>(null),
    [drag, setDrag] = useState(false);
  async function upload(files: FileList | File[]) {
    if (request.current) return;
    for (const file of Array.from(files)) {
      setName(file.name);
      setRetry(file);
      setError("");
      setProgress(0);
      if (file.size > 16777216) {
        setStatus("error");
        setError("Each file can be up to 16 MB.");
        break;
      }
      setStatus("uploading");
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          request.current = xhr;
          xhr.open("POST", `/api/projects/${projectId}/files`);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable)
              setProgress(Math.round((event.loaded / event.total) * 100));
          };
          xhr.onload = () => {
            request.current = null;
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else {
              let message = "The upload failed. Try again.";
              try {
                message = JSON.parse(xhr.responseText).error || message;
              } catch {}
              reject(new Error(message));
            }
          };
          xhr.onerror = () => {
            request.current = null;
            reject(
              new Error(
                "Connection lost. Your original file is unchanged; retry the upload.",
              ),
            );
          };
          xhr.onabort = () => {
            request.current = null;
            reject(
              new Error(
                "Upload canceled. Refresh the library before retrying in case the file finished saving.",
              ),
            );
          };
          const data = new FormData();
          data.set("file", file);
          xhr.send(data);
        });
        setStatus("saved");
        setRetry(null);
        router.refresh();
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "The upload failed.");
        break;
      }
    }
    if (input.current) input.current.value = "";
  }
  return (
    <>
      <div
        className={`file-drop-zone ${drag ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          void upload(event.dataTransfer.files);
        }}
      >
        <Icon name="Plus" />
        <div>
          <h2>Drop files, images or Markdown here</h2>
          <p>Private to this project · Any file type · Up to 16 MB per file</p>
        </div>
        <input
          id={id}
          ref={input}
          type="file"
          multiple
          className="visually-hidden"
          disabled={!hydrated || status === "uploading"}
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files);
          }}
        />
        <button
          className="button secondary"
          type="button"
          disabled={!hydrated || status === "uploading"}
          onClick={() => input.current?.click()}
        >
          Choose files
        </button>
      </div>
      {status === "uploading" && (
        <div className="upload-state">
          <div>
            <strong>{name}</strong>
            <p>
              {progress === 100
                ? "Saving to the project…"
                : `Uploading · ${progress}%`}
            </p>
            <progress
              max="100"
              value={progress}
              aria-label={`Uploading ${name}`}
            />
          </div>
          <button
            className="text-button"
            onClick={() => request.current?.abort()}
          >
            Cancel upload
          </button>
        </div>
      )}
      {status === "saved" && (
        <p className="success-feedback" role="status">
          <Icon name="Check" />
          {name} added to this project.
        </p>
      )}
      {status === "error" && (
        <div className="upload-state">
          <div>
            <p className="error" role="alert">
              {error}
            </p>
            <small>{name}</small>
          </div>
          {retry && retry.size <= 16777216 && (
            <button
              className="button secondary"
              onClick={() => void upload([retry])}
            >
              Retry upload
            </button>
          )}
        </div>
      )}
    </>
  );
}
