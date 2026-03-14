import { useEffect, useRef, useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { useAnalyzeFace } from '@workspace/api-client-react';
import type { FaceAnalysisResponse } from '@workspace/api-client-react';
import { Camera as CameraIcon, ScanFace, SquareSquare, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, getEmotionColors } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [latestResult, setLatestResult] = useState<FaceAnalysisResponse | null>(null);
  const { toast } = useToast();
  
  const analyzeMutation = useAnalyzeFace();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setHasPermission(true);
      }
    } catch (err) {
      console.error(err);
      setHasPermission(false);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera permissions to use this feature.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      captureAndAnalyze();
    }, 3000); // Capture every 3 seconds

    return () => clearInterval(interval);
  }, [isActive]);

  const captureAndAnalyze = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      // Remove data:image/jpeg;base64, prefix if API requires raw base64, 
      // Assuming API handles data URIs or raw base64 based on typical setups.
      const rawBase64 = base64Image.split(',')[1];
      
      analyzeMutation.mutate(
        { data: { image_data: rawBase64 } },
        { 
          onSuccess: (res) => setLatestResult(res),
          onError: (err) => console.error("Face scan failed", err)
        }
      );
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 md:p-8 max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <ScanFace className="w-8 h-8 text-primary" />
            Facial Emotion Analysis
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Real-time biometric scanning to detect micro-expressions. We don't save your video feed—only emotional metadata is extracted.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-2 relative aspect-video bg-black flex items-center justify-center overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.15)]">
              
              {!isActive && hasPermission !== false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <CameraIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                  <button 
                    onClick={startCamera}
                    className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 hover:scale-105 transition-all shadow-xl"
                  >
                    Start Scanner
                  </button>
                </div>
              )}

              {hasPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/20 text-destructive z-10 text-center p-6">
                  <AlertCircle className="w-12 h-12 mb-4" />
                  <p className="font-bold text-lg">Camera Access Required</p>
                  <p className="text-sm mt-2 opacity-80">Please check your browser settings.</p>
                </div>
              )}

              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={cn("w-full h-full object-cover rounded-2xl", isActive ? "opacity-100" : "opacity-0")}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Overlay UI */}
              {isActive && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden border-2 border-primary/30">
                  <SquareSquare className="absolute top-4 left-4 w-8 h-8 text-primary opacity-50" />
                  <SquareSquare className="absolute top-4 right-4 w-8 h-8 text-primary opacity-50 rotate-90" />
                  <SquareSquare className="absolute bottom-4 left-4 w-8 h-8 text-primary opacity-50 -rotate-90" />
                  <SquareSquare className="absolute bottom-4 right-4 w-8 h-8 text-primary opacity-50 rotate-180" />
                  
                  {analyzeMutation.isPending && (
                    <motion.div 
                      className="w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_cyan] absolute top-0"
                      animate={{ y: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    />
                  )}
                </div>
              )}
            </div>
            
            {isActive && (
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={stopCamera}
                  className="px-6 py-2 bg-destructive/20 text-destructive hover:bg-destructive hover:text-white border border-destructive/50 rounded-full font-medium transition-all"
                >
                  Stop Scanner
                </button>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="glass-card rounded-3xl p-6 flex flex-col">
            <h2 className="text-xl font-display font-bold mb-6">Real-time Analysis</h2>
            
            {latestResult ? (
              <motion.div 
                key={latestResult.face_emotion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Primary Emotion</p>
                  <div className={cn("inline-flex items-center px-4 py-2 rounded-xl text-lg font-bold border capitalize", getEmotionColors(latestResult.face_emotion))}>
                    {latestResult.face_emotion}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Confidence Score</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-display font-bold">{(latestResult.confidence * 100).toFixed(1)}</span>
                    <span className="text-muted-foreground mb-1">%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      className="h-full bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${latestResult.confidence * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {latestResult.dominant_emotion && (
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Secondary Traits</p>
                    <div className="text-white/80 bg-white/5 px-4 py-3 rounded-xl">
                      {latestResult.dominant_emotion}
                    </div>
                  </div>
                )}
                
                <div className="mt-auto pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Live stream connected. Syncing...
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <ScanFace className="w-16 h-16 mb-4" />
                <p className="text-center">Start scanner to view real-time emotional breakdown.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
