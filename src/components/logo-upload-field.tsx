"use client";

import { useEffect, useState } from "react";

export function LogoUploadField({ currentUrl }: { currentUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="space-y-2">
      <label className="label" htmlFor="logo">
        Logo
      </label>
      <input
        id="logo"
        name="logo"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="field file:mr-3 file:rounded file:border-0 file:bg-[color:var(--brand-primary)] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
      />
      {preview || currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview || currentUrl || ""}
          alt={preview ? "Selected logo" : "Current logo"}
          className="h-20 w-auto max-w-[10rem] rounded bg-white object-contain p-1"
        />
      ) : null}
      <p className="text-xs text-black/50">
        {preview
          ? "This logo will show at the top of the invoice."
          : currentUrl
            ? "Current logo stays if you leave this empty."
            : "Optional. Shown at the top of the invoice."}
      </p>
    </div>
  );
}
