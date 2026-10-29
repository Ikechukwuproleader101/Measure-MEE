import React, { useState, useEffect } from 'react';
import {
  GUIDE_HEAD_PATH,
  GUIDE_BODY_PATH,
  GUIDE_CENTER_LINE,
  placeGuide,
} from './poseGuide';
import { COLORS } from './poseConstants';
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

  // Observe container box dimensions
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

  // Track video native pixel dimensions
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

  // No guide for side view yet
  if (viewMode !== 'front') {
    return null;
  }

  const boxW = boxDimensions.w;
  const boxH = boxDimensions.h;
  const videoW = videoDimensions.w;
  const videoH = videoDimensions.h;

  const { tx, ty, k } = placeGuide({ videoW, videoH, boxW, boxH, fit });

  // Colors: idle=white dashed, invalid=red dashed, valid=green solid
  let strokeColor = COLORS.none;
  let strokeDasharray = '5 4';

  if (state === 'valid') {
    strokeColor = COLORS.valid;
    strokeDasharray = 'none';
  } else if (state === 'invalid') {
    strokeColor = COLORS.invalid;
    strokeDasharray = '5 4';
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
        {/* Center line */}
        <line
          x1={GUIDE_CENTER_LINE.x1}
          y1={GUIDE_CENTER_LINE.y1}
          x2={GUIDE_CENTER_LINE.x2}
          y2={GUIDE_CENTER_LINE.y2}
          stroke={strokeColor}
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity={0.4}
          style={{ vectorEffect: 'non-scaling-stroke' }}
          className="pose-guide-element"
        />
        {/* Head */}
        <path
          d={GUIDE_HEAD_PATH}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.8}
          strokeDasharray={strokeDasharray}
          opacity={0.85}
          style={{ vectorEffect: 'non-scaling-stroke' }}
          className="pose-guide-element"
        />
        {/* Body */}
        <path
          d={GUIDE_BODY_PATH}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.8}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
          style={{ vectorEffect: 'non-scaling-stroke' }}
          className="pose-guide-element"
        />
      </g>
    </svg>
  );
};

export default PoseGuideOverlay;
