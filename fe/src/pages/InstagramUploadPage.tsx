import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface FormState {
  caption: string;
  tags: string;
  location: string;
  scheduleDate: string;
  scheduleTime: string;
  audience: "everyone" | "followers";
  disableComments: boolean;
}

const InstagramUploadPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    caption: "",
    tags: "",
    location: "",
    scheduleDate: "",
    scheduleTime: "",
    audience: "everyone",
    disableComments: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Post Scheduled!</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your Instagram post details have been saved.
            {form.scheduleDate && form.scheduleTime
              ? ` It's scheduled for ${form.scheduleDate} at ${form.scheduleTime}.`
              : " It will be posted immediately."}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Edit Post
            </button>
            <button
              type="button"
              onClick={() => navigate("/social")}
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Back to Platforms
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-xl">

        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white shadow-md">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post to Instagram</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Fill in the details for your Instagram post
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 space-y-6"
        >
          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Caption
            </label>
            <textarea
              name="caption"
              value={form.caption}
              onChange={handleChange}
              rows={4}
              maxLength={2200}
              placeholder="Write a caption for your post..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{form.caption.length} / 2200</p>
          </div>

          {/* Tag People */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tag People
            </label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="@username, @username2..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">Separate multiple usernames with commas</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Add a location..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Schedule Post <span className="text-xs font-normal text-gray-400">(optional — leave blank to post now)</span>
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                name="scheduleDate"
                value={form.scheduleDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="time"
                name="scheduleTime"
                value={form.scheduleTime}
                onChange={handleChange}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Audience
            </label>
            <select
              name="audience"
              value={form.audience}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="everyone">Everyone</option>
              <option value="followers">Followers Only</option>
            </select>
          </div>

          {/* Disable Comments */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="disableComments"
              name="disableComments"
              checked={form.disableComments}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <label htmlFor="disableComments" className="text-sm text-gray-700 dark:text-gray-300">
              Disable comments on this post
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              {form.scheduleDate && form.scheduleTime ? "Schedule Post" : "Post Now"}
            </button>
          </div>
        </form>

      </div>
    </section>
  );
};

export default InstagramUploadPage;
