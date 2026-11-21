"use client";

type AuthMotifVariant = "login" | "app";

/**
 * Fingerprint / shield / lock / scan motifs used on login and (softer) behind app chrome.
 */
export function AuthMotifBackground({
  variant = "login",
}: {
  variant?: AuthMotifVariant;
}) {
  const isApp = variant === "app";

  return (
    <div
      className={
        isApp
          ? "auth-motif-bg auth-motif-bg--app pointer-events-none absolute inset-0 overflow-hidden"
          : "auth-motif-bg auth-motif-bg--login pointer-events-none absolute inset-0 overflow-hidden"
      }
      aria-hidden
    >
      {/* Soft vignette — stronger on login, whisper-light on app */}
      <div className={isApp ? "auth-motif-vignette auth-motif-vignette--app" : "auth-motif-vignette"} />

      {/* Fingerprint */}
      <svg
        className={
          isApp
            ? "login-motif login-motif--fp absolute -left-8 top-[10%] h-64 w-64 opacity-[0.07] sm:left-[4%] sm:opacity-[0.09]"
            : "login-motif login-motif--fp absolute -left-6 top-[12%] h-56 w-56 opacity-[0.14] sm:left-[6%] sm:opacity-[0.18]"
        }
        viewBox="0 0 120 120"
        fill="none"
      >
        <path
          d="M60 22c-18 0-32 14-32 32v8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="login-stroke"
        />
        <path
          d="M60 14c-22 0-40 17-40 40v14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="login-stroke login-stroke--d1"
        />
        <path
          d="M44 38c0-9 7-16 16-16s16 7 16 16v28c0 6-3 11-8 14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="login-stroke login-stroke--d2"
        />
        <path
          d="M52 42c0-4.5 3.5-8 8-8s8 3.5 8 8v22c0 8-5 14-12 16"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="login-stroke login-stroke--d3"
        />
        <path
          d="M36 48c2-12 12-20 24-20 14 0 24 10 24 24v16c0 10-5 18-13 22"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="login-stroke login-stroke--d4"
        />
        <path
          d="M28 56c3-16 16-28 32-28 18 0 32 13 32 32v10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="login-stroke login-stroke--d5"
        />
        <path
          d="M60 98c-4-6-6-12-6-20V58"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="login-stroke login-stroke--d2"
        />
      </svg>

      {/* Shield + check */}
      <svg
        className={
          isApp
            ? "login-motif login-motif--shield absolute right-[2%] top-[16%] h-44 w-44 opacity-[0.08] sm:right-[8%] sm:opacity-[0.1]"
            : "login-motif login-motif--shield absolute right-[4%] top-[18%] h-40 w-40 opacity-[0.16] sm:right-[10%] sm:opacity-[0.2]"
        }
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M50 12l30 12v22c0 18-12 34-30 42C32 80 20 64 20 46V24L50 12z"
          stroke="currentColor"
          strokeWidth="2.4"
          className="login-stroke"
        />
        <path
          d="M35 50l10 10 20-22"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="login-check"
        />
      </svg>

      {/* Lock */}
      <svg
        className={
          isApp
            ? "login-motif login-motif--lock absolute bottom-[14%] left-[6%] h-32 w-32 opacity-[0.07] sm:bottom-[18%] sm:left-[14%] sm:opacity-[0.09]"
            : "login-motif login-motif--lock absolute bottom-[18%] left-[8%] h-28 w-28 opacity-[0.14] sm:bottom-[22%] sm:left-[18%] sm:opacity-[0.18]"
        }
        viewBox="0 0 80 80"
        fill="none"
      >
        <rect
          x="18"
          y="36"
          width="44"
          height="34"
          rx="6"
          stroke="currentColor"
          strokeWidth="2.4"
          className="login-stroke"
        />
        <path
          d="M28 36V26a12 12 0 0 1 24 0v10"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="login-stroke login-stroke--d2"
        />
        <circle cx="40" cy="52" r="4" fill="currentColor" className="login-dot" />
        <path
          d="M40 56v8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="login-stroke"
        />
      </svg>

      {/* Scan rings */}
      <svg
        className={
          isApp
            ? "login-motif login-motif--scan absolute bottom-[8%] right-[4%] h-52 w-52 opacity-[0.075] sm:right-[12%] sm:opacity-[0.095]"
            : "login-motif login-motif--scan absolute bottom-[12%] right-[6%] h-48 w-48 opacity-[0.15] sm:right-[14%] sm:opacity-[0.2]"
        }
        viewBox="0 0 140 140"
        fill="none"
      >
        <circle
          cx="70"
          cy="70"
          r="28"
          stroke="currentColor"
          strokeWidth="1.8"
          className="login-ring login-ring--a"
        />
        <circle
          cx="70"
          cy="70"
          r="42"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="6 10"
          className="login-ring login-ring--b"
        />
        <circle
          cx="70"
          cy="70"
          r="56"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="2 8"
          className="login-ring login-ring--c"
        />
        <path
          d="M70 42v56M42 70h56"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
        />
        <rect
          x="52"
          y="52"
          width="36"
          height="36"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.8"
          className="login-stroke"
        />
      </svg>

      {/* Small floating check badges */}
      <svg
        className={
          isApp
            ? "login-motif login-motif--badge absolute left-[40%] top-[6%] h-14 w-14 opacity-[0.09]"
            : "login-motif login-motif--badge absolute left-[42%] top-[8%] h-12 w-12 opacity-[0.2]"
        }
        viewBox="0 0 40 40"
        fill="none"
      >
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" className="login-ring" />
        <path
          d="M12 20l5 5 11-12"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="login-check"
        />
      </svg>

      <svg
        className={
          isApp
            ? "login-motif login-motif--fp2 absolute right-[26%] bottom-[6%] hidden h-40 w-40 opacity-[0.06] md:block"
            : "login-motif login-motif--fp2 absolute right-[28%] bottom-[8%] hidden h-36 w-36 opacity-[0.12] md:block"
        }
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M50 20c-14 0-26 11-26 26v20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="login-stroke"
        />
        <path
          d="M38 36c0-7 6-12 12-12s12 5 12 12v24c0 5-2 9-6 11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="login-stroke login-stroke--d2"
        />
        <path
          d="M30 44c2-12 10-20 20-20 12 0 20 9 20 22v14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="login-stroke login-stroke--d4"
        />
      </svg>
    </div>
  );
}

/** @deprecated Prefer AuthMotifBackground — kept for existing login import paths. */
export function LoginMotionBg() {
  return <AuthMotifBackground variant="login" />;
}
