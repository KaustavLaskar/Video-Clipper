import json
import math
import os
import subprocess


def get_video_duration(video_path: str) -> float:
    """Return the duration of the video in seconds using ffprobe."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        video_path,
    ]
    result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    info = json.loads(result.stdout)
    return float(info["format"]["duration"])


def split_video(input_video_path: str, output_dir: str, clip_duration: int = 60):
    """Split a video into sequential clips of clip_duration seconds each."""
    duration = get_video_duration(input_video_path)
    max_clips = math.ceil(duration / clip_duration)
    print(f"Video duration: {duration:.1f}s → generating {max_clips} clip(s) of {clip_duration}s each")

    os.makedirs(output_dir, exist_ok=True)

    generated_clips = []

    print("Splitting video into clips...")
    for i in range(max_clips):
        start_time = i * clip_duration
        output_filename = f"clip_{i+1}_{os.path.basename(input_video_path)}"
        output_path = os.path.join(output_dir, output_filename)

        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-ss", str(start_time),
            "-i", input_video_path,
            "-t", str(clip_duration),
            "-c", "copy",
            output_path,
        ]

        try:
            subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            generated_clips.append(output_filename)
            print(f"Created: {output_filename}")
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error on clip {i+1}: {e.stderr.decode()}")
            break

    return generated_clips
