import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

const VideoCarousel = ({ videos, onClose, isVisible }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isVisible || videos.length === 0) return;

    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
      setProgress(0);
    };

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    if (isPlaying) {
      video.play().catch(err => console.warn('Auto-play blocked:', err));
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isVisible, videos.length]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  const currentVideo = videos[currentVideoIndex];

  if (!isVisible || !currentVideo) return null;

  // Check if it's a YouTube URL
  const isYouTube = currentVideo.url?.includes('youtube.com') || currentVideo.url?.includes('youtu.be') || currentVideo.url?.includes('youtube-nocookie.com');
  const isVimeo = currentVideo.url?.includes('vimeo.com');

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
      {/* Video Container */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {/* Video - Different rendering for different sources */}
        {isYouTube ? (
          <iframe
            ref={videoRef}
            src={currentVideo.url}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => {
              // Reset progress when iframe loads
              setProgress(0);
            }}
          />
        ) : isVimeo ? (
          <iframe
            src={currentVideo.url}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={currentVideo.url}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            onEnded={() => {
              setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
              setProgress(0);
            }}
            onTimeUpdate={(e) => {
              if (e.target.duration) {
                setProgress((e.target.currentTime / e.target.duration) * 100);
              }
            }}
          />
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

        {/* Header - Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-white/90 hover:bg-white text-black rounded-full p-3 shadow-lg transition-all z-10 hover:scale-110"
          title="Fermer la vidéo"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Bottom Content - Professional Design */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-8 px-8">
          <div className="max-w-7xl mx-auto">
            {/* Video Info */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">
                {currentVideo.title}
              </h2>
              {currentVideo.description && (
                <p className="text-lg text-gray-200">
                  {currentVideo.description}
                </p>
              )}
            </div>

            {/* QR Codes + Download Links */}
            <div className="flex items-center justify-between gap-8 mb-8">
              {/* Left - PlayStore QR */}
              <div className="flex flex-col items-center gap-4">
                <QRCodeGenerator
                  url="https://play.google.com/store/apps/details?id=com.intellection.mobile"
                  size={180}
                  label="Android"
                />
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 rounded-lg border-2 border-white shadow-xl">
                  {/* Google Play Logo */}
                  <svg className="w-7 h-7 text-white" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M6 24c0 9.9 8.1 18 18 18 9.9 0 18-8.1 18-18S33.9 6 24 6 6 14.1 6 24z" opacity="0.3" />
                    <path d="M24.5 6L6.6 24l17.9 18 16.8-18z" fill="#4285F4" />
                    <path d="M6.6 24L1.4 29.3c-.6.6-.6 1.6 0 2.2l17 18.1 5.3-5.6-17-15.9-5.1-4.1z" fill="#34A853" />
                    <path d="M6.6 24l-5.2-5.3c-.6-.6-.6-1.6 0-2.2l17-18.1 5.3 5.6-17 15.9 5.1 4.1z" fill="#FBBC05" />
                    <path d="M24.5 6v36l17-18z" fill="#EA4335" />
                  </svg>
                  <span className="text-white font-bold text-lg">Google Play</span>
                </div>
              </div>

              {/* Center - Video Counter */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-white text-center">
                  <div className="text-5xl font-bold mb-2">
                    {currentVideoIndex + 1} / {videos.length}
                  </div>
                  <div className="text-gray-300 text-sm">Contenu Intellection</div>
                </div>
              </div>

              {/* Right - AppStore QR */}
              <div className="flex flex-col items-center gap-4">
                <QRCodeGenerator
                  url="https://apps.apple.com/ma/app/intellection-classboard/id6758705463?l=ar"
                  size={180}
                  label="iOS"
                />
                <div className="flex items-center gap-3 bg-black px-6 py-3 rounded-lg border-2 border-white shadow-xl hover:bg-gray-900 transition-all">
                  {/* Apple Logo */}
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.3-3.16-2.54-1.73-2.39-3.01-6.59-1.25-9.67.92-1.66 2.44-2.76 4.15-2.85 1.29-.02 2.52.87 3.44.87.92 0 2.38-1.08 3.99-.92 1.35.1 2.62.6 3.44 1.54-.33.2-1.86 1.08-1.88 3.24-.02 2.5 2.05 3.35 2.05 3.35s-1.4 2.11-3.29 2.93z" />
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  <span className="text-white font-bold text-lg">App Store</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-gray-300 text-sm">
                Vidéo {currentVideoIndex + 1} de {videos.length}
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-all backdrop-blur border border-white/30"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="absolute top-6 left-6 text-white">
          <div className="text-2xl font-bold">📚 Intellection</div>
          <div className="text-sm text-gray-400">ClassBoard</div>
        </div>
      </div>
    </div>
  );
};

export default VideoCarousel;
