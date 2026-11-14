"use client";

import { useState } from "react";
import type { Note } from "@/lib/store";

export function NoteFields({ note }: { note?: Note }) {
  const [references, setReferences] = useState(note?.referenceLinks || []);
  return (
    <>
      <label className="field">
        <span>Title</span>
        <input
          name="title"
          defaultValue={note?.title}
          required
          maxLength={160}
        />
      </label>
      <label className="field">
        <span>Context</span>
        <textarea
          name="body"
          defaultValue={note?.body}
          required
          maxLength={12000}
          rows={9}
        />
      </label>
      <fieldset className="reference-fields">
        <legend>
          References <span className="muted">· optional</span>
        </legend>
        {references.map((reference, i) => (
          <div className="reference-editor" key={i}>
            <label className="field">
              <span>Label {i + 1}</span>
              <input
                name="referenceLabel"
                value={reference.label}
                maxLength={120}
                onChange={(e) =>
                  setReferences(
                    references.map((r, j) =>
                      j === i ? { ...r, label: e.target.value } : r,
                    ),
                  )
                }
              />
            </label>
            <label className="field">
              <span>URL {i + 1}</span>
              <input
                name="referenceUrl"
                type="url"
                required
                value={reference.url}
                maxLength={2048}
                onChange={(e) =>
                  setReferences(
                    references.map((r, j) =>
                      j === i ? { ...r, url: e.target.value } : r,
                    ),
                  )
                }
              />
            </label>
            <button
              className="text-button"
              type="button"
              onClick={() =>
                setReferences(references.filter((_, j) => j !== i))
              }
              aria-label={`Remove reference ${i + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        {references.length < 10 && (
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setReferences([...references, { label: "", url: "" }])
            }
          >
            Add reference
          </button>
        )}
      </fieldset>
    </>
  );
}
