import React, { useState, useEffect } from 'react';
import {
  GUIDE_HEAD,
  GUIDE_BODY_PATH,
  placeGuide,
} from './poseGuide';
import type { GuideStateType } from './guideState';

export interface PoseGuideOverlayProps {
  state: GuideStateType;
  viewMode?: 'front' | 'side';
  containerRef: React.RefObject<HTMLElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fit?: 'cover' | 'contain';
}

export const PoseGuideOverlay: React.FC<PoseGuideOverlayProps> = ({
  state,
  viewMode = 'front',
  containerRef,
  videoRef,
  fit = 'cover',
}) => {
  const [boxDimensions, setBoxDimensions] = useState<{ w: number; h: number }>({ w: 390, h: 844 });
  const [videoDimensions, setVideoDimensions] = useState<{ w: number; h: number }>({ w: 720, h: 1280 });

  // 1. Observe container box dimensions with ResizeObserver and window events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateBox = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setBoxDimensions({ w, h });
      }
    };

    updateBox();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setBoxDimensions({ w: width, h: height });
          }
        }
      });
      ro.observe(el);
    }

    const onWindowResize = () => updateBox();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', onWindowResize);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('orientationchange', onWindowResize);
    };
  }, [containerRef]);

  // 2. Track video native pixel dimensions from videoRef
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateVideoSize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
      }
    };

    updateVideoSize();

    video.addEventListener('loadedmetadata', updateVideoSize);
    video.addEventListener('resize', updateVideoSize);

    return () => {
      video.removeEventListener('loadedmetadata', updateVideoSize);
      video.removeEventListener('resize', updateVideoSize);
    };
  }, [videoRef]);

  // For side photo view, show no A-pose guide for now (per Step 6.4)
  if (viewMode !== 'front') {
    return null;
  }

  const boxW = boxDimensions.w;
  const boxH = boxDimensions.h;
  const videoW = videoDimensions.w;
  const videoH = videoDimensions.h;

  const { tx, ty, k } = placeGuide({
    videoW,
    videoH,
    boxW,
    boxH,
    fit,
  });

  // Color styles corresponding to guideState:
  // idle: white dashed (10% fill)
  // invalid: red dashed (10% fill)
  // valid: green solid (15% fill)
  let strokeColor = '#ffffff';
  let fillColor = 'rgba(255, 255, 255, 0.10)';
  let strokeDasharray = '6 5';

  if (state === 'valid') {
    strokeColor = '#22c55e';
    fillColor = 'rgba(34, 197, 94, 0.15)';
    strokeDasharray = 'none';
  } else if (state === 'invalid') {
    strokeColor = '#ef4444';
    fillColor = 'rgba(239, 68, 68, 0.10)';
    strokeDasharray = '6 5';
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
      style={{ overflow: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .pose-guide-element {
              transition: fill 200ms ease, stroke 200ms ease;
            }
          }
        `}</style>
      </defs>
      <g transform={`translate(${tx}, ${ty}) scale(${k})`}>
        {/* Head circle */}
        <circle
          cx={GUIDE_HEAD.cx}
          cy={GUIDE_HEAD.cy}
          r={GUIDE_HEAD.r}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1.8}
          strokeDasharray={strokeDasharray}
          style={{ vectorEffect: 'non-scaling-stroke' }}
          className="pose-guide-element"
        />
        {/* Body path */}
        <path
          d={GUIDE_BODY_PATH}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1.8}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ vectorEffect: 'non-scaling-stroke' }}
          className="pose-guide-element"
        />
      </g>
    </svg>
  );
};

export default PoseGuideOverlay;
