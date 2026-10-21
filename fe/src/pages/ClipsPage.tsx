import { useLocation, useNavigate } from "react-router-dom";

const downloadClip = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

interface LocationState {
  clips?: string[];
}

const ClipsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const stateClips = (location.state as LocationState)?.clips;
  let clips: string[] = [];
  if (stateClips && stateClips.length > 0) {
    clips = stateClips;
    sessionStorage.setItem("generated_clips", JSON.stringify(clips));
  } else {
    try {
      const saved = sessionStorage.getItem("generated_clips");
      if (saved) clips = JSON.parse(saved);
    } catch {
      clips = [];
    }
  }

  const handleUploadToYouTube = (clipUrl: string) => {
    sessionStorage.setItem("selected_clip", clipUrl);
    navigate("/youtube", { state: { selectedClip: clipUrl, clips } });
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Generated Clips
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {clips.length} clip{clips.length !== 1 ? "s" : ""} ready to download
          </p>
        </div>

        {clips.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>No clips found. Please go back and upload a video first.</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {clips.map((clipUrl, index) => (
              <div
                key={index}
                className="w-full max-w-xs overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800"
              >
                <div className="relative aspect-[9/16] bg-black">
                  <video
                    src={clipUrl}
                    controls
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2.5 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Clip {index + 1}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => downloadClip(clipUrl, `clip_${index + 1}.mp4`)}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUploadToYouTube(clipUrl)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      YouTube
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Upload Another Video
          </button>
          <button
            type="button"
            onClick={() => navigate("/social", { state: { clips } })}
            className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Upload to Social Media
          </button>
        </div>

      </div>
    </section>
  );
};

export default ClipsPage;
