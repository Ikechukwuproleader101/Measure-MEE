import React from 'react';

/**
 * Old silhouette artwork preserved for reference and comparison.
 * Source: original CameraCaptureScreen.tsx SVG paths.
 */
export const OldFrontSilhouette = ({ isValid = false }) => (
  <svg
    viewBox="0 0 340 560"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-full max-h-[490px] select-none pointer-events-none drop-shadow-md transition-colors duration-300 ${
      isValid ? 'text-emerald-400' : 'text-primary'
    }`}
  >
    <line x1="170" y1="30" x2="170" y2="530" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" className="opacity-40" />
    <path d="M170 54 C153 54 143 68 143 88 C143 108 153 124 170 124 C187 124 197 108 197 88 C197 68 187 54 170 54 Z" stroke="currentColor" strokeWidth="1.8" strokeDasharray="5 4" className="opacity-85" />
    <path
      d="M158 123 C157 132 153 138 144 142 C132 147 114 156 104 175 C95 192 84 225 78 260 C72 292 68 335 72 360 C73 365 77 368 81 364 C84 360 87 348 90 330 C95 295 106 255 114 225 C118 208 122 195 125 188 C127 205 129 235 131 270 C133 300 131 328 126 355 C120 388 114 430 110 475 C108 495 107 518 106 525 C109 527 121 528 127 525 C129 515 133 480 138 438 C143 395 148 355 152 320 C156 288 163 260 170 252 C177 260 184 288 188 320 C192 355 197 395 202 438 C207 480 211 515 213 525 C219 528 231 527 234 525 C233 518 232 495 230 475 C226 430 220 388 214 355 C209 328 207 300 209 270 C211 235 213 205 215 188 C218 195 222 208 226 225 C234 255 245 295 250 330 C253 348 256 360 259 364 C263 368 267 365 268 360 C272 335 268 292 262 260 C256 225 245 192 236 175 C226 156 208 147 196 142 C187 138 183 132 182 123"
      stroke="currentColor" strokeWidth="1.8" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" className="opacity-85"
    />
  </svg>
);

export const OldSideSilhouette = ({ isValid = false }) => (
  <svg
    viewBox="0 0 340 560"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-full max-h-[490px] select-none pointer-events-none drop-shadow-md transition-colors duration-300 ${
      isValid ? 'text-emerald-400' : 'text-primary'
    }`}
  >
    <line x1="170" y1="30" x2="170" y2="530" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" className="opacity-40" />
    <path d="M172 54 C158 54 148 66 146 82 C145 92 140 98 135 102 C140 106 148 108 152 118 C155 125 162 126 170 126 C182 126 192 114 192 90 C192 68 184 54 172 54 Z" stroke="currentColor" strokeWidth="1.8" strokeDasharray="5 4" className="opacity-85" />
    <path
      d="M152 126 C142 142 136 170 138 205 C140 230 148 250 150 270 C152 295 148 330 144 370 C140 410 138 450 136 490 C135 515 130 525 138 526 C150 528 165 528 172 525 C175 510 176 480 178 440 C180 400 184 360 188 320 C192 280 196 240 194 200 C192 170 185 145 174 130 C170 125 168 126 166 126"
      stroke="currentColor" strokeWidth="1.8" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" className="opacity-85"
    />
    <path
      d="M164 165 C160 190 158 230 156 270 C154 300 152 335 154 355 C156 360 160 360 162 355 C165 335 168 300 170 270 C172 230 174 190 172 165"
      stroke="currentColor" strokeWidth="1.8" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"
    />
  </svg>
);

