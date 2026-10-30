// Constraint attempts from most to least demanding.
export function buildConstraintAttempts(facingMode) {
  return [
    { video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
    { video: { facingMode: { ideal: facingMode } }, audio: false },
    { video: true, audio: false },
  ];
}

// Permission problems are final; everything else is worth retrying.
export function isPermissionError(err) {
  return !!err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
}

// Tries each constraint set (two tries each) and returns the first stream that works.
export async function getStreamWithFallback({
  facingMode,
  getUserMedia = (c) => navigator.mediaDevices.getUserMedia(c),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  retriesPerAttempt = 2,
  retryDelayMs = 300,
}) {
  let lastErr;
  for (const constraints of buildConstraintAttempts(facingMode)) {
    for (let retry = 0; retry < retriesPerAttempt; retry++) {
      try {
        return await getUserMedia(constraints);
      } catch (err) {
        lastErr = err;
        if (isPermissionError(err)) throw err;
        await sleep(retryDelayMs);
      }
    }
  }
  throw lastErr;
}

// Decides whether a camera that produced no picture should be restarted automatically.
export function shouldAutoRetry({ videoWidth, readyState, retries, maxRetries = 2 }) {
  const noPicture = videoWidth === 0 || readyState < 2;
  return noPicture && retries < maxRetries;
}

