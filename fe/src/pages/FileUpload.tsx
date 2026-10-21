import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFile = (selectedFile: File) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("video/")) {
      alert("Please select a video file.");
      return;
    }
    setFile(selectedFile);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (size: number): string => {
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a video.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: { urls: string[] } = await response.json();

      if (data.urls && data.urls.length > 0) {
        navigate("/clips", { state: { clips: data.urls } });
      } else {
        alert("Video processed, but no clips were returned.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to process video. Make sure your Python backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upload & Split Video
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Upload a video to automatically generate clips
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition ${
              isDragging
                ? "border-teal-600 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/30"
                : "border-gray-300 hover:border-teal-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-teal-500 dark:hover:bg-gray-800/50"
            } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
          >
            {/* Upload Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v1a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v1z" />
              </svg>
            </div>

            <h2 className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
              {isDragging ? "Drop your video here" : "Drag & drop your video here"}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">or</p>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              disabled={isUploading}
              className="mt-3 rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:bg-teal-400"
            >
              Browse Video
            </button>

            <p className="mt-4 text-xs text-gray-400">MP4, MOV, AVI, MKV, WebM</p>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Selected File Indicator */}
          {file && (
            <div className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                disabled={isUploading}
                className="ml-4 rounded-md p-2 text-gray-400 transition hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          )}

          {/* Process Button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !file}
            className={`mt-6 w-full rounded-lg px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              isUploading || !file
                ? "cursor-not-allowed bg-teal-400"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {isUploading ? "Processing your video (this may take a few minutes)..." : "Process Video"}
          </button>
        </div>

      </div>
    </section>
  );
};

export default FileUpload;
