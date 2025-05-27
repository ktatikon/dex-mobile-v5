import React, { useState, useRef, useEffect } from 'react';
import { useKYC } from '@/contexts/KYCContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Camera,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SelfieCapture: React.FC = () => {
  const { formData, updateDocuments, goToNextStep, goToPreviousStep } = useKYC();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      // Clean up by stopping all tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // Reset states
      setCameraError(null);
      setSelfiePreview(null);
      updateDocuments({ selfie: null });

      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(newStream);

      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Could not access camera. Please ensure you have granted camera permissions.');
    }
  };

  const captureWithCountdown = () => {
    setIsCapturing(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          captureSelfie();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      setCameraError('Camera not ready. Please try again.');
      setIsCapturing(false);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a File object from the blob
          const selfieFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

          // Update form data with selfie
          updateDocuments({ selfie: selfieFile });

          // Create preview URL
          const previewUrl = URL.createObjectURL(blob);
          setSelfiePreview(previewUrl);

          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }, 'image/jpeg', 0.9);
    }

    setIsCapturing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selfie) {
      setCameraError('Please capture a selfie before proceeding');
      return;
    }

    goToNextStep();
  };

  return (
    <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              {/* Countdown overlay */}
              {countdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                  <span className="text-6xl font-bold text-white">{countdown}</span>
                </div>
              )}

              {/* Selfie preview or live camera */}
              {selfiePreview ? (
                <img
                  src={selfiePreview}
                  alt="Selfie preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="relative w-full h-64 bg-black rounded-lg">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!stream && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <p className="text-white">Camera loading...</p>
                    </div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <div className="text-center p-4">
                        <AlertCircle className="mx-auto h-10 w-10 text-dex-primary mb-2" />
                        <p className="text-white">{cameraError}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden canvas for capturing */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex justify-center space-x-4">
              {selfiePreview ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={startCamera}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="min-h-[44px]"
                  onClick={captureWithCountdown}
                  disabled={!stream || isCapturing}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCapturing ? 'Capturing...' : 'Take Selfie'}
                </Button>
              )}
            </div>
          </div>

          <Alert className="bg-dex-dark/50 border-dex-secondary/30">
            <AlertCircle className="h-4 w-4 text-dex-secondary" />
            <AlertDescription className="text-white text-sm">
              Please ensure your face is clearly visible and well-lit. Remove glasses, hats, or anything that obscures your face.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-h-[44px]"
              disabled={!formData.selfie}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SelfieCapture;
