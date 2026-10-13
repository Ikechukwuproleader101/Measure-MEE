import React from 'react';

export interface BodyCameraProps {
  onBack?: () => void;
  onComplete?: (blobs: { front: Blob | null; side: Blob | null }, formData?: FormData) => void;
  onUpload?: (formData: FormData, blobs: { front: Blob | null; side: Blob | null }) => Promise<void> | void;
}

export declare const BodyCamera: React.FC<BodyCameraProps>;
export default BodyCamera;
