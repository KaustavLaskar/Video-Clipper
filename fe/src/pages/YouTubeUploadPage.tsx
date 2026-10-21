import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

interface LocationState {
  clips?: string[];
  selectedClip?: string;
}

interface FormState {
  title: string;
  description: string;
  tags: string;
  category: string;
  visibility: "public" | "unlisted" | "private";
  madeForKids: boolean;
  scheduleDate: string;
  scheduleTime: string;
  disableComments: boolean;
}

interface UploadResult {
  video_id: string;
  url: string;
}

const CATEGORIES = [
  "Film & Animation", "Autos & Vehicles", "Music", "Pets & Animals",
  "Sports", "Travel & Events", "Gaming", "People & Blogs", "Comedy",
  "Entertainment", "News & Politics", "Howto & Style", "Education",
  "Science & Technology", "Nonprofits & Activism",
];

const YouTubeUploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Load clips from location state or session storage
  const [clips, setClips] = useState<string[]>(() => {
    const locClips = (location.state as LocationState)?.clips;
    if (locClips && locClips.length > 0) return locClips;
    try {
      const saved = sessionStorage.getItem("generated_clips");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedClip, setSelectedClip] = useState<string>(() => {
    const locSelected = (location.state as LocationState)?.selectedClip;
    if (locSelected) return locSelected;
    const saved = sessionStorage.getItem("selected_clip");
    if (saved) return saved;
    const locClips = (location.state as LocationState)?.clips;
    if (locClips && locClips.length > 0) return locClips[0];
    try {
      const savedClips = sessionStorage.getItem("generated_clips");
      if (savedClips) {
        const parsed = JSON.parse(savedClips);
        if (parsed.length > 0) return parsed[0];
      }
    } catch {
      // ignore
    }
    return "";
  });

  const [uploadMode, setUploadMode] = useState<"clip" | "custom">(() => {
    return selectedClip ? "clip" : "custom";
  });

  const [customFile, setCustomFile] = useState<File | null>(null);

  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    tags: "",
    category: "",
    visibility: "public",
    madeForKids: false,
    scheduleDate: "",
    scheduleTime: "",
    disableComments: false,
  });

  // Keep sessionStorage in sync
  useEffect(() => {
    if (clips.length > 0) {
      sessionStorage.setItem("generated_clips", JSON.stringify(clips));
    }
    if (selectedClip) {
      sessionStorage.setItem("selected_clip", selectedClip);
      // Auto-set title if empty
      const clipIndex = clips.indexOf(selectedClip);
      if (clipIndex !== -1 && !form.title) {
        setForm((prev) => ({ ...prev, title: `Clip ${clipIndex + 1} #Shorts` }));
      }
    }
  }, [clips, selectedClip]);

  // Check auth status on mount, and after OAuth callback redirects back
  useEffect(() => {
    fetch("http://localhost:8000/api/youtube/status")
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated))
      .catch(() => setAuthenticated(false));
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAuth = () => {
    if (selectedClip) sessionStorage.setItem("selected_clip", selectedClip);
    if (clips.length > 0) sessionStorage.setItem("generated_clips", JSON.stringify(clips));
    // Opens Google OAuth in the same tab; Google redirects back to /youtube?auth=success
    window.location.href = "http://localhost:8000/auth/youtube";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();

    if (uploadMode === "clip") {
      if (!selectedClip) {
        setError("Please choose a generated clip to upload.");
        return;
      }
      formData.append("clip_url", selectedClip);
    } else {
      if (!customFile) {
        setError("Please select a video file to upload.");
        return;
      }
      formData.append("file", customFile);
    }

    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("tags", form.tags);
    formData.append("category", form.category);
    formData.append("visibility", form.visibility);
    formData.append("made_for_kids", String(form.madeForKids));

    setIsUploading(true);

    try {
      const response = await fetch("http://localhost:8000/api/youtube/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail ?? "Upload failed");
      }

      const data: UploadResult = await response.json();
      setUploadResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsUploading(false);
    }
  };

  // ── Auth checking state ──────────────────────────────────────────────────────
  if (authenticated === null) {
    return (
      <section className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-md text-center text-gray-500 dark:text-gray-400">
          Checking YouTube authentication…
        </div>
      </section>
    );
  }

  // ── Not authenticated ────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <section className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connect YouTube</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in with your Google account to upload videos to YouTube.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleAuth}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Upload success ───────────────────────────────────────────────────────────
  if (uploadResult) {
    return (
      <section className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Uploaded to YouTube!</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your video is live. Video ID: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{uploadResult.video_id}</span>
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href={uploadResult.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Watch on YouTube
            </a>
            <button
              type="button"
              onClick={() => navigate("/social")}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back to Platforms
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Upload form ──────────────────────────────────────────────────────────────
  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-xl">

        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload to YouTube</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Fill in the details for your YouTube video
          </p>
          {/* Auth badge */}
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Connected to YouTube
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 space-y-6"
        >
          {/* Clip / File Selection Mode */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Video to Upload <span className="text-red-500">*</span>
              </label>
              {clips.length > 0 && (
                <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 text-xs dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => setUploadMode("clip")}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      uploadMode === "clip"
                        ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    Generated Clips ({clips.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("custom")}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      uploadMode === "custom"
                        ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    Custom File
                  </button>
                </div>
              )}
            </div>

            {uploadMode === "clip" && clips.length > 0 ? (
              <div className="space-y-3">
                {/* Clip selector chips */}
                <div className="flex flex-wrap gap-2">
                  {clips.map((clipUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedClip(clipUrl)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        selectedClip === clipUrl
                          ? "border-red-600 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        {index + 1}
                      </span>
                      Clip {index + 1}
                    </button>
                  ))}
                </div>

                {/* Selected Clip Video Preview */}
                {selectedClip && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-black dark:border-gray-800">
                    <div className="relative aspect-[16/9] w-full max-h-56 bg-black flex items-center justify-center">
                      <video
                        src={selectedClip}
                        controls
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-800/80 dark:text-gray-400 flex items-center justify-between">
                      <span>Ready to upload directly from generated clips</span>
                      <span className="font-mono text-[11px] truncate max-w-[200px]">
                        {selectedClip.split("/").pop()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  id="yt-file"
                  type="file"
                  accept="video/*"
                  required={uploadMode === "custom"}
                  onChange={(e) => setCustomFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-red-700 hover:file:bg-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="Add a title that describes your video..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{form.title.length} / 100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              maxLength={5000}
              placeholder="Tell viewers about your video..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{form.description.length} / 5000</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="tag1, tag2, tag3..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">Separate tags with commas</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Visibility
            </label>
            <div className="flex flex-col gap-2">
              {(["public", "unlisted", "private"] as const).map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="visibility"
                    value={option}
                    checked={form.visibility === option}
                    onChange={handleChange}
                    className="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{option}</span>
                    <p className="text-xs text-gray-400">
                      {option === "public" && "Anyone can search for and view"}
                      {option === "unlisted" && "Anyone with the link can view"}
                      {option === "private" && "Only you can view"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Made for Kids */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="madeForKids"
              name="madeForKids"
              checked={form.madeForKids}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="madeForKids" className="text-sm text-gray-700 dark:text-gray-300">
              Made for kids
            </label>
          </div>

          {/* Disable Comments */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="disableComments"
              name="disableComments"
              checked={form.disableComments}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="disableComments" className="text-sm text-gray-700 dark:text-gray-300">
              Disable comments on this video
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isUploading}
              className="flex-1 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isUploading ? "Uploading to YouTube…" : "Upload Now"}
            </button>
          </div>
        </form>

      </div>
    </section>
  );
};

export default YouTubeUploadPage;
