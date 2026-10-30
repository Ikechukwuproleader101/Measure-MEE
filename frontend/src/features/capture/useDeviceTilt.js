import { useState, useEffect, useRef } from 'react';
import { RULES } from './poseRules.js';
import { evaluateTilt } from './tilt.js';

let permissionGranted = false;

/**
 * Requests iOS DeviceOrientation permission if required.
 * Safe to call on all platforms from user interaction handlers.
 */
export async function requestTiltPermission() {
  if (permissionGranted) return true;
  if (
    typeof window !== 'undefined' &&
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        permissionGranted = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Hook to monitor device orientation, compute tilt and shake rate, and evaluate against rules.
 */
export function useDeviceTilt({ enabled = true } = {}) {
  const [tiltState, setTiltState] = useState(() => evaluateTilt({ hasData: false }));
  const historyRef = useRef([]);
  const prevEvalRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setTiltState(evaluateTilt({ hasData: false }));
      return;
    }

    // Set timeout to confirm unavailability if no events fire within noDataMs
    timeoutRef.current = setTimeout(() => {
      if (!hasDataRef.current) {
        setTiltState(evaluateTilt({ hasData: false }));
      }
    }, RULES.tilt.noDataMs);

    const handleOrientation = (event) => {
      const now = performance.now();
      const beta = event.beta;
      const gamma = event.gamma;

      if (beta === null || gamma === null) return;
      hasDataRef.current = true;

      // Track history over 500ms for shake detection
      const history = historyRef.current;
      history.push({ time: now, beta, gamma });

      // Evict items older than 500ms
      while (history.length > 0 && now - history[0].time > 500) {
        history.shift();
      }

      let shakeRate = 0;
      if (history.length >= 2) {
        const oldest = history[0];
        const dt = (now - oldest.time) / 1000;
        if (dt > 0.05) {
          const dBeta = Math.abs(beta - oldest.beta);
          const dGamma = Math.abs(gamma - oldest.gamma);
          const degDiff = Math.hypot(dBeta, dGamma);
          shakeRate = degDiff / dt;
        }
      }

      // Orientation type from ScreenOrientation API or fallback
      let orientationType = '';
      if (window.screen?.orientation?.type) {
        orientationType = window.screen.orientation.type;
      } else if (typeof window.orientation !== 'undefined') {
        orientationType = Math.abs(window.orientation) === 90 ? 'landscape-primary' : 'portrait-primary';
      }

      const evaluation = evaluateTilt({
        beta,
        gamma,
        orientationType,
        shakeRate,
        hasData: true,
        prev: prevEvalRef.current,
      });

      prevEvalRef.current = evaluation.nextPrev;
      setTiltState({ ...evaluation, shakeRate });
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      historyRef.current = [];
    };
  }, [enabled]);

  return tiltState;
}

