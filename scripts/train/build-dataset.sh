#!/usr/bin/env bash
# Conform generated clips into a Fizgig-legal training set.
#
# The spec is unforgiving and fails late: .mp4, exactly 24fps, a frame count on
# the H3 grid {5,22,39,56,73,90,107,124}, dimensions a multiple of 32, audio at
# 32kHz stereo or absent, and a same-named .txt caption beside every clip. Our
# H3 renders already satisfy the video half, so this mostly rewraps webm+flac
# into mp4 and writes the captions.
#
# Usage: build-dataset.sh <src-dir> <out-dir> [path-as-seen-by-trainer]
#   src-dir  holds hd_*.webm / gc_*.webm plus their matching .flac
#   the third argument is the directory path to write into dataset.toml — set it
#   when building the set on one machine and training on another, otherwise the
#   TOML points at a directory the pod does not have.
set -euo pipefail

SRC="${1:?usage: build-dataset.sh <src-dir> <out-dir> [trainer-path]}"
OUT="${2:?usage: build-dataset.sh <src-dir> <out-dir> [trainer-path]}"
TRAINER_PATH="${3:-}"
TRIGGER="the gcap gamer"
mkdir -p "$OUT"

# Who he is. Repeated verbatim in every caption so the trigger phrase binds to
# the person and not to a particular room or action.
WHO="$TRIGGER, a young Indian man in his early twenties with short black hair, \
light stubble, a plain dark grey t-shirt and black over-ear gaming headphones"

# clip stem -> what happens in it. Only the ACTION varies; identity is constant.
declare -A CAP=(
  [g1_playing]="sits forward in a black and red gaming chair at a desk, both hands on a mechanical keyboard, eyes on a curved monitor, blue and magenta RGB light rimming his shoulders, night"
  [g2_themoment]="in extreme close-up, his eyes widening and eyebrows lifting, then a small disbelieving grin spreading across his face, monitor light flickering over his features"
  [g3_celebrate]="shoving back from the desk and throwing both arms above his head in triumph, headphones sliding down around his neck, the gaming chair turning slightly"
  [g4_alone]="alone in a small dark bedroom seen in a wide static shot, lowering his raised arms and glancing back over his shoulder at the empty room behind him"
  [g4_alone_v2]="alone in a wide static shot of an almost empty bedroom, arms coming down from a celebration, turning his head to look back at an empty doorway and an unmade bed"
  [g5_thehunt]="slumped low in the gaming chair, one hand loose on the mouse, dragging it slowly back and forth, tired and flat, rubbing one eye with the heel of his palm"
  [g6_thefix]="sitting up straight and typing a short word on a mechanical keyboard while clean mint-green light from the monitor spreads across his face and hands"
  [g7_payoff]="sitting back in the gaming chair grinning widely, then picking up a phone from the desk and tapping at it quickly, mint-green light across his face"
)

n=0
for src in "$SRC"/hd_g*.webm "$SRC"/gc_g4_alone_v2*.webm; do
  [ -e "$src" ] || continue
  b=$(basename "$src")
  # hd_g2_themoment_00002_.webm -> g2_themoment
  stem=$(echo "$b" | sed -E 's/^(hd|gc)_//; s/_[0-9]+_?\.webm$//')
  cap="${CAP[$stem]:-}"
  if [ -z "$cap" ]; then
    echo "  SKIP $b — no caption written for '$stem'" >&2
    continue
  fi

  # The audio track is written beside the video as .flac by the ComfyUI graph,
  # but with its own counter suffix (…_00001.flac next to …_00002_.webm), so
  # match on the prefix before the counter rather than the exact stem.
  pre="${b%%_000*}"
  aud=$(ls "$SRC/${pre}"*.flac 2>/dev/null | head -1 || true)

  dst="$OUT/${stem}.mp4"
  if [ -n "${aud:-}" ] && [ -f "$aud" ]; then
    # 32kHz stereo is required; anything else is rejected by the cache step.
    ffmpeg -nostdin -y -loglevel error -i "$src" -i "$aud" \
      -map 0:v:0 -map 1:a:0 -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p \
      -r 24 -c:a aac -ar 32000 -ac 2 -b:a 192k -shortest "$dst"
  else
    ffmpeg -nostdin -y -loglevel error -i "$src" -an \
      -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -r 24 "$dst"
  fi

  printf '%s %s.\n' "$WHO" "$cap" > "$OUT/${stem}.txt"
  n=$((n+1))
done

# Any extra clips generated later drop straight in with their own .txt.
for extra in "$SRC"/lora_*.mp4; do
  [ -e "$extra" ] || continue
  cp -f "$extra" "$OUT/" 2>/dev/null || true
  t="${extra%.mp4}.txt"
  [ -f "$t" ] && cp -f "$t" "$OUT/"
  n=$((n+1))
done

cat > "$OUT/dataset.toml" <<TOML
# Fizgig dataset config. resolution must match the clips' real dimensions;
# the cache step does not resize for you.
[general]
caption_extension = ".txt"
batch_size        = 1
enable_bucket     = true
bucket_no_upscale = false

[[datasets]]
video_directory   = "${TRAINER_PATH:-$(cd "$OUT" && pwd)}"
target_frames     = [124]
frame_extraction  = "head"
resolution        = [896, 1568]
num_repeats       = 1
TOML

echo
echo "=== dataset built: $n clips ==="
fail=0
for f in "$OUT"/*.mp4; do
  # ffprobe emits CRLF on Windows; an unstripped \r rides along on the LAST
  # field and silently fails every comparison against it.
  read -r w h fps nb < <(ffprobe -v error -select_streams v \
    -show_entries stream=width,height,r_frame_rate,nb_read_packets -count_packets \
    -of csv=p=0 "$f" | tr -d '\r' | tr ',' ' ')
  ar=$(ffprobe -v error -select_streams a -show_entries stream=sample_rate,channels \
       -of csv=p=0 "$f" 2>/dev/null | head -1)
  ok="ok"
  [ $((w % 32)) -eq 0 ] && [ $((h % 32)) -eq 0 ] || { ok="DIMS NOT /32"; fail=1; }
  [ "$fps" = "24/1" ] || { ok="NOT 24FPS ($fps)"; fail=1; }
  case " 5 22 39 56 73 90 107 124 " in *" $nb "*) ;; *) ok="BAD FRAME COUNT ($nb)"; fail=1;; esac
  [ -s "${f%.mp4}.txt" ] || { ok="NO CAPTION"; fail=1; }
  printf "  %-22s %sx%s %s %sf  audio=%-12s %s\n" "$(basename "$f")" "$w" "$h" "$fps" "$nb" "${ar:-none}" "$ok"
done
echo
[ $fail -eq 0 ] && echo "  ALL CLIPS LEGAL" || { echo "  SPEC VIOLATIONS ABOVE — fix before training"; exit 1; }
