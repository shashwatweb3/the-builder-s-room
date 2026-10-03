import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/Button";
import {
  AVATAR_MIME_TYPES,
  BIO_MAX,
  DISPLAY_NAME_MAX,
  HANDLE_MAX,
  KREW3_LOGO_SIZE,
  KREW3_LOGO_SRC,
  MEMBER_TYPES,
  URL_MAX,
  avatarPath,
  isValidHttpUrl,
  normalizeUrl,
  slugifyUsername,
  validateAvatar,
  validateUsername,
  type KrewProfileDraft,
  type MemberType,
} from "@/lib/krew-profile";
import { isUsernameTaken, uploadAvatar } from "@/lib/member-auth";

const inputClass =
  "mt-2 w-full rounded-2xl border-2 border-border bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "label-mono block text-muted-foreground";

type Props = {
  draft: KrewProfileDraft;
  onChange: (patch: Partial<KrewProfileDraft>) => void;
  userId: string;
  lockedUsername: boolean;
  saving: boolean;
  onSave: () => void;
  error: string;
  success: string;
};

export function KrewProfileForm({
  draft,
  onChange,
  userId,
  lockedUsername,
  saving,
  onSave,
  error,
  success,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [touchedUsername, setTouchedUsername] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const fileRef = useRef<HTMLInputElement>(null);
  const availTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usernameCheck = validateUsername(draft.username);
  const normalized = slugifyUsername(draft.username);
  const checkedUsername = usernameCheck.ok ? usernameCheck.username : null;

  const connectionCount = [draft.x_handle, draft.telegram_handle, draft.website_url].filter(
    (v) => v.trim().length > 0,
  ).length;

  const websiteValid = !draft.website_url.trim() || isValidHttpUrl(normalizeUrl(draft.website_url));
  const bestWorkValid =
    !draft.best_work_url.trim() || isValidHttpUrl(normalizeUrl(draft.best_work_url));

  // Debounced availability probe against the unique username constraint.
  useEffect(() => {
    if (!checkedUsername) {
      setAvailability("idle");
      return;
    }
    if (availTimer.current) clearTimeout(availTimer.current);
    setAvailability("checking");
    availTimer.current = setTimeout(() => {
      isUsernameTaken(checkedUsername)
        .then((taken) => setAvailability(taken ? "taken" : "free"))
        .catch(() => setAvailability("idle"));
    }, 450);

    return () => {
      if (availTimer.current) clearTimeout(availTimer.current);
    };
  }, [checkedUsername]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploadError("");

    const check = validateAvatar(file);
    if (!check.ok) {
      setUploadError(check.error);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadAvatar(userId, file, avatarPath(userId, file));
      onChange({ avatar_url: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const canSave =
    draft.display_name.trim().length > 0 &&
    draft.display_name.trim().length <= DISPLAY_NAME_MAX &&
    usernameCheck.ok &&
    availability !== "taken" &&
    draft.bio.trim().length > 0 &&
    draft.bio.trim().length <= BIO_MAX &&
    connectionCount > 0 &&
    websiteValid &&
    bestWorkValid;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;
    onSave();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* Profile photo */}
      <div>
        <span className={labelClass}>Profile photo</span>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional. JPG, PNG, WebP or AVIF, 2 MB max.
        </p>

        <div className="mt-3 flex items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-border bg-lavender/40 shadow-offset-sm">
            {draft.avatar_url ? (
              <img
                src={draft.avatar_url}
                alt=""
                className="size-full object-cover"
                width={80}
                height={80}
              />
            ) : (
              <img
                src={KREW3_LOGO_SRC}
                alt=""
                width={KREW3_LOGO_SIZE.width}
                height={KREW3_LOGO_SIZE.height}
                className="size-full object-cover"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  {draft.avatar_url ? "Replace photo" : "Upload photo"}
                </>
              )}
            </Button>

            {draft.avatar_url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ avatar_url: null })}
              >
                Remove
              </Button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_MIME_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {uploadError && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertCircle className="size-4" aria-hidden />
            {uploadError}
          </p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="pf-name" className={labelClass}>
          Name <span className="text-destructive">*</span>
        </label>
        <input
          id="pf-name"
          type="text"
          required
          value={draft.display_name}
          maxLength={DISPLAY_NAME_MAX}
          placeholder="Shashwat Chauhan"
          onChange={(e) => onChange({ display_name: e.target.value })}
          className={`${inputClass} min-h-12`}
        />
      </div>

      {/* Username */}
      <div>
        <label htmlFor="pf-username" className={labelClass}>
          Krew ID <span className="text-destructive">*</span>
        </label>

        <input
          id="pf-username"
          type="text"
          required
          value={draft.username}
          disabled={lockedUsername}
          maxLength={URL_MAX}
          placeholder="shashwat"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          onBlur={() => setTouchedUsername(true)}
          onChange={(e) => {
            setTouchedUsername(true);
            onChange({ username: slugifyUsername(e.target.value) });
          }}
          aria-describedby="pf-username-help"
          className={`${inputClass} min-h-12 font-mono ${lockedUsername ? "opacity-60" : ""}`}
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p id="pf-username-help" className="label-mono text-muted-foreground">
            krew3.site/{normalized || "yourid"}
          </p>

          {usernameCheck.ok &&
            (availability === "checking" ? (
              <span className="label-mono flex items-center gap-1 text-muted-foreground">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                checking
              </span>
            ) : availability === "free" ? (
              <span className="label-mono flex items-center gap-1 text-live">
                <Check className="size-3" aria-hidden />
                available
              </span>
            ) : availability === "taken" ? (
              <span className="label-mono flex items-center gap-1 text-destructive">
                <AlertCircle className="size-3" aria-hidden />
                taken
              </span>
            ) : null)}
        </div>

        {lockedUsername ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Your Krew ID is locked because your profile is no longer pending. Ask an admin to change
            it.
          </p>
        ) : (
          touchedUsername &&
          !usernameCheck.ok && (
            <p className="mt-2 text-sm font-medium text-destructive">{usernameCheck.error}</p>
          )
        )}

        {availability === "taken" && (
          <p className="mt-2 text-sm font-medium text-destructive">
            That Krew ID is already claimed.
          </p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="pf-bio" className={labelClass}>
          Short bio <span className="text-destructive">*</span>
        </label>
        <textarea
          id="pf-bio"
          required
          rows={2}
          value={draft.bio}
          maxLength={BIO_MAX}
          placeholder="One line on who you are and what you build."
          onChange={(e) => onChange({ bio: e.target.value })}
          className={`${inputClass} resize-none py-3`}
        />
        <p className="label-mono mt-1.5 text-muted-foreground">
          {draft.bio.trim().length}/{BIO_MAX}
        </p>
      </div>

      {/* Member type */}
      <div>
        <span className={labelClass}>Member type</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {MEMBER_TYPES.map((type) => {
            const active = draft.member_type === type.value;
            return (
              <button
                key={type.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({ member_type: active ? null : (type.value as MemberType) })
                }
                className={`min-h-9 rounded-full border-2 border-border px-3.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-offset-sm"
                    : "bg-card hover:bg-lavender/40"
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connections */}
      <fieldset className="rounded-2xl border-2 border-border bg-background p-4">
        <legend className="label-mono px-1 text-muted-foreground">
          Where people can reach you <span className="text-destructive">*</span>
        </legend>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Add at least one: X, Telegram or website.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="pf-x" className={labelClass}>
              X handle
            </label>
            <input
              id="pf-x"
              type="text"
              value={draft.x_handle}
              maxLength={HANDLE_MAX + 1}
              placeholder="@Shashwat_web3"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => onChange({ x_handle: e.target.value })}
              className={`${inputClass} min-h-12`}
            />
          </div>

          <div>
            <label htmlFor="pf-tg" className={labelClass}>
              Telegram
            </label>
            <input
              id="pf-tg"
              type="text"
              value={draft.telegram_handle}
              maxLength={HANDLE_MAX + 1}
              placeholder="@username"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => onChange({ telegram_handle: e.target.value })}
              className={`${inputClass} min-h-12`}
            />
          </div>

          <div>
            <label htmlFor="pf-web" className={labelClass}>
              Website
            </label>
            <input
              id="pf-web"
              type="url"
              value={draft.website_url}
              maxLength={URL_MAX}
              placeholder="https://your-site.xyz"
              onChange={(e) => onChange({ website_url: e.target.value })}
              className={`${inputClass} min-h-12`}
            />
            {!websiteValid && (
              <p className="mt-1.5 text-sm font-medium text-destructive">
                Enter a valid http(s) link.
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Best work */}
      <fieldset className="rounded-2xl border-2 border-border bg-background p-4">
        <legend className="label-mono px-1 text-muted-foreground">Best work</legend>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Optional. One thing worth looking at.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="pf-bwt" className={labelClass}>
              Title
            </label>
            <input
              id="pf-bwt"
              type="text"
              value={draft.best_work_title}
              maxLength={120}
              placeholder="Krew3 Events"
              onChange={(e) => onChange({ best_work_title: e.target.value })}
              className={`${inputClass} min-h-12`}
            />
          </div>

          <div>
            <label htmlFor="pf-bwu" className={labelClass}>
              Link
            </label>
            <input
              id="pf-bwu"
              type="url"
              value={draft.best_work_url}
              maxLength={URL_MAX}
              placeholder="https://krew3.site/events"
              onChange={(e) => onChange({ best_work_url: e.target.value })}
              className={`${inputClass} min-h-12`}
            />
            {!bestWorkValid && (
              <p className="mt-1.5 text-sm font-medium text-destructive">
                Enter a valid http(s) link.
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border-2 border-destructive bg-destructive/10 p-4 text-sm font-medium text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-2xl border-2 border-border bg-lavender/50 p-4 text-sm font-medium"
        >
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          {success}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={!canSave || saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>

      {!canSave && (
        <p className="text-center text-sm text-muted-foreground">
          Fill in your name, Krew ID, a short bio and one way to reach you.
        </p>
      )}
    </form>
  );
}
