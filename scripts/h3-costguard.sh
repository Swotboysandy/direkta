#!/usr/bin/env bash
# Cost guard for a GPU pod that cannot stop itself.
#
# NeevCloud's console has no Stop button (only Delete) and API access is
# disabled by default on new accounts, so nothing can halt the meter
# automatically. The next best thing is to make an idle pod impossible to
# forget: this watches the ComfyUI queue and GPU utilisation, and the moment the
# work actually finishes it pushes a phone notification saying so, then keeps
# nagging while money is being burned for nothing.
#
# Notifications go through ntfy.sh - no account, no API key, no secrets on the
# pod. Pick any hard-to-guess topic; anyone who knows it can read your alerts,
# so treat it as public.
#
#   ./h3-costguard.sh <ntfy-topic> [rate-per-hour] [idle-minutes-before-alert]
#
# Run detached and it will outlive your SSH session:
#   setsid bash /data/h3-costguard.sh direkta-h3-a7f3 113.41 5 >/dev/null 2>&1 &
set -euo pipefail

TOPIC="${1:?usage: h3-costguard.sh <ntfy-topic> [rate/hr] [idle-min]}"
RATE="${2:-113.41}"
IDLE_MIN="${3:-5}"
COMFY="http://127.0.0.1:8188"
STATE=/data/.costguard
mkdir -p "$STATE"
[ -f "$STATE/started" ] || date +%s > "$STATE/started"
START=$(cat "$STATE/started")

push() {                    # title, body, priority, tags
  curl -s --max-time 10 \
    -H "Title: $1" -H "Priority: ${3:-default}" -H "Tags: ${4:-money_with_wings}" \
    -d "$2" "https://ntfy.sh/$TOPIC" >/dev/null 2>&1 || true
}

spent() {                   # rupees since this guard started
  awk -v s="$START" -v n="$(date +%s)" -v r="$RATE" \
      'BEGIN{printf "%.0f", (n-s)/3600*r}'
}
hours() {
  awk -v s="$START" -v n="$(date +%s)" 'BEGIN{printf "%.2f", (n-s)/3600}'
}

queue_len() {
  curl -s --max-time 5 "$COMFY/queue" 2>/dev/null \
    | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin); print(len(d.get("queue_running",[]))+len(d.get("queue_pending",[])))
except Exception:
    print(-1)' 2>/dev/null || echo -1
}

gpu_util() {
  nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null \
    | tr -d ' \r' | head -1 || echo 0
}

push "GPU pod up" "Cost guard armed at Rs $RATE/hr. You will be pinged when the queue drains." default rocket

idle_since=0
was_busy=0
nagged=0

while :; do
  q=$(queue_len)
  u=$(gpu_util); u=${u:-0}
  busy=0
  [ "$q" -gt 0 ] 2>/dev/null && busy=1
  [ "${u%%.*}" -gt 20 ] 2>/dev/null && busy=1

  if [ "$busy" -eq 1 ]; then
    was_busy=1
    idle_since=0
    nagged=0
  else
    now=$(date +%s)
    [ "$idle_since" -eq 0 ] && idle_since=$now
    idle_for=$(( (now - idle_since) / 60 ))

    # The one alert that matters: work finished, meter still running.
    if [ "$was_busy" -eq 1 ] && [ "$idle_for" -ge "$IDLE_MIN" ] && [ "$nagged" -eq 0 ]; then
      push "Queue drained - DELETE THE POD" \
"Nothing has run for ${idle_for} min.
Spent so far: Rs $(spent) over $(hours) hr.
Every further hour costs Rs $RATE for nothing.
NeevCloud has no Stop button - Delete. The /data volume survives." \
        urgent warning
      nagged=1
    fi

    # Then keep nagging every 30 idle minutes so it cannot be slept through.
    if [ "$nagged" -eq 1 ] && [ $((idle_for % 30)) -eq 0 ] && [ "$idle_for" -gt "$IDLE_MIN" ]; then
      push "Still idle: Rs $(spent) burned" \
"${idle_for} min idle. $(hours) hr total. Delete the pod." urgent warning
    fi
  fi

  # A local record either way, so cost can be reconstructed after the fact.
  printf '%s,%s,%s,%s\n' "$(date -Iseconds)" "$u" "$q" "$busy" >> /data/costguard.csv
  sleep 60
done
