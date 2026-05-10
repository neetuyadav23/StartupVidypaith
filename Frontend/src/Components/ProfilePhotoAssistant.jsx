// First, add this to your index.html head section:
// <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js" crossorigin="anonymous"></script>
// <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>

// Create a new component: src/Components/ProfilePhotoAssistant.jsx
import React, { useRef, useEffect, useState } from 'react';
import './ProfilePhotoAssistant.css';

const ProfilePhotoAssistant = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [faceData, setFaceData] = useState(null);
  const [tips, setTips] = useState([]);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  let faceDetection = null;
  let camera = null;

  // Initialize MediaPipe Face Detection
  useEffect(() => {
    const initFaceDetection = async () => {
      if (window.FaceDetection) {
        faceDetection = new window.FaceDetection({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
          }
        });

        faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5,
        });

        faceDetection.onResults(onFaceDetectionResults);
      }
    };

    initFaceDetection();

    return () => {
      if (camera) {
        camera.stop();
      }
    };
  }, []);

  const onFaceDetectionResults = (results) => {
    if (results.detections && results.detections.length > 0) {
      const detection = results.detections[0];
      const boundingBox = detection.boundingBox;
      
      // Calculate face metrics
      const faceMetrics = {
        isCentered: checkIfCentered(boundingBox),
        sizeRatio: calculateSizeRatio(boundingBox),
        eyeLevel: calculateEyeLevel(detection.keypoints),
        smileScore: calculateSmileScore(detection.keypoints),
        headTilt: calculateHeadTilt(detection.keypoints)
      };

      setFaceData(faceMetrics);
      generateTips(faceMetrics);
      
      // Draw on canvas
      drawFaceDetection(results);
    } else {
      setFaceData(null);
      setTips([{ type: 'error', message: 'No face detected. Please position yourself in the frame.' }]);
    }
  };

  const checkIfCentered = (box) => {
    const centerX = (box.xMin + box.xMax) / 2;
    return centerX > 0.4 && centerX < 0.6;
  };

  const calculateSizeRatio = (box) => {
    const width = box.xMax - box.xMin;
    const height = box.yMax - box.yMin;
    return (width * height) * 100; // Percentage of frame
  };

  const calculateEyeLevel = (keypoints) => {
    // Keypoints: 0=right eye, 1=left eye, 2=nose, 3=right ear, 4=left ear
    if (keypoints && keypoints.length >= 2) {
      const rightEye = keypoints[0];
      const leftEye = keypoints[1];
      const averageY = (rightEye.y + leftEye.y) / 2;
      return averageY;
    }
    return 0.5;
  };

  const calculateSmileScore = (keypoints) => {
    // Simplified smile detection (using mouth corners if available)
    if (keypoints && keypoints.length >= 6) {
      // Assuming index 5 and 6 are mouth corners
      const mouthLeft = keypoints[5];
      const mouthRight = keypoints[6];
      const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
      return mouthWidth * 10; // Simple smile score
    }
    return 0;
  };

  const calculateHeadTilt = (keypoints) => {
    if (keypoints && keypoints.length >= 2) {
      const rightEye = keypoints[0];
      const leftEye = keypoints[1];
      const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
      return Math.abs(angle);
    }
    return 0;
  };

  const generateTips = (metrics) => {
    const newTips = [];
    
    if (!metrics.isCentered) {
      newTips.push({ 
        type: 'adjustment', 
        message: 'Try to center your face in the frame',
        icon: '🎯'
      });
    }
    
    if (metrics.sizeRatio < 15) {
      newTips.push({ 
        type: 'adjustment', 
        message: 'Move closer to the camera for better framing',
        icon: '👤'
      });
    } else if (metrics.sizeRatio > 40) {
      newTips.push({ 
        type: 'adjustment', 
        message: 'Move back a bit - your face is too close',
        icon: '↔️'
      });
    }
    
    if (metrics.eyeLevel < 0.4 || metrics.eyeLevel > 0.6) {
      newTips.push({ 
        type: 'adjustment', 
        message: 'Adjust camera height to eye level',
        icon: '👁️'
      });
    }
    
    if (metrics.smileScore < 3) {
      newTips.push({ 
        type: 'suggestion', 
        message: 'Try a gentle, confident smile!',
        icon: '😊'
      });
    }
    
    if (metrics.headTilt > 10) {
      newTips.push({ 
        type: 'adjustment', 
        message: 'Straighten your head for a professional look',
        icon: '📏'
      });
    }
    
    // If all metrics are good
    if (newTips.length === 0 && metrics.isCentered && metrics.sizeRatio >= 15 && metrics.sizeRatio <= 40) {
      newTips.push({ 
        type: 'success', 
        message: 'Perfect! You look professional and confident!',
        icon: '✅'
      });
    }
    
    setTips(newTips);
  };

  const drawFaceDetection = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw face bounding box
    if (results.detections && results.detections.length > 0) {
      const detection = results.detections[0];
      const boundingBox = detection.boundingBox;
      
      const x = boundingBox.xMin * canvas.width;
      const y = boundingBox.yMin * canvas.height;
      const width = (boundingBox.xMax - boundingBox.xMin) * canvas.width;
      const height = (boundingBox.yMax - boundingBox.yMin) * canvas.height;
      
      // Draw bounding box
      ctx.strokeStyle = faceData && faceData.isCentered ? '#4CAF50' : '#FF9800';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      // Draw center guide
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw keypoints
      if (detection.keypoints) {
        ctx.fillStyle = '#FF4081';
        detection.keypoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(
            point.x * canvas.width,
            point.y * canvas.height,
            3, 0, 2 * Math.PI
          );
          ctx.fill();
        });
      }
    }
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraOn(true);
        
        // Start face detection
        if (faceDetection) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) {
                await faceDetection.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          camera.start();
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setTips([{ type: 'error', message: 'Unable to access camera. Please check permissions.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (camera) {
      camera.stop();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOn(false);
    setFaceData(null);
    setTips([]);
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    if (!video) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/png');
    setCapturedPhoto(photoData);
    
    // Provide download option
    const downloadLink = document.createElement('a');
    downloadLink.href = photoData;
    downloadLink.download = 'professional-profile-photo.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const uploadToProfile = async () => {
    if (!capturedPhoto) return;
    
    try {
      setIsLoading(true);
      
      // Convert base64 to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'profile-photo.png');
      
      const token = localStorage.getItem('token');
      const uploadResponse = await fetch(`${API_BASE_URL}/students/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        alert('Profile photo updated successfully!');
        // You could refresh the profile here
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-photo-assistant">
      <div className="assistant-header">
        <h2>🎯 Professional Profile Photo Assistant</h2>
        <p>Get AI-powered guidance for the perfect profile picture</p>
      </div>
      
      <div className="assistant-content">
        <div className="camera-section">
          <div className="camera-container">
            <video 
              ref={videoRef} 
              className="camera-feed"
              playsInline
            />
            <canvas 
              ref={canvasRef} 
              className="face-canvas"
            />
            
            <div className="camera-controls">
              {!isCameraOn ? (
                <button 
                  className="camera-btn start-btn"
                  onClick={startCamera}
                  disabled={isLoading}
                >
                  {isLoading ? 'Starting Camera...' : '🎥 Start Camera'}
                </button>
              ) : (
                <>
                  <button 
                    className="camera-btn capture-btn"
                    onClick={capturePhoto}
                  >
                    📸 Capture Photo
                  </button>
                  <button 
                    className="camera-btn stop-btn"
                    onClick={stopCamera}
                  >
                    ⏹️ Stop Camera
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="tips-section">
          <h3>📋 AI Feedback</h3>
          
          <div className="face-metrics">
            {faceData ? (
              <div className="metrics-grid">
                <div className="metric">
                  <span className="metric-label">Centering</span>
                  <span className={`metric-value ${faceData.isCentered ? 'good' : 'needs-work'}`}>
                    {faceData.isCentered ? '✓ Good' : '↔ Adjust'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Framing</span>
                  <span className={`metric-value ${
                    faceData.sizeRatio >= 15 && faceData.sizeRatio <= 40 ? 'good' : 'needs-work'
                  }`}>
                    {faceData.sizeRatio >= 15 && faceData.sizeRatio <= 40 ? '✓ Good' : '📐 Adjust'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Eye Level</span>
                  <span className={`metric-value ${
                    faceData.eyeLevel >= 0.4 && faceData.eyeLevel <= 0.6 ? 'good' : 'needs-work'
                  }`}>
                    {faceData.eyeLevel >= 0.4 && faceData.eyeLevel <= 0.6 ? '✓ Good' : '👁️ Adjust'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Confidence</span>
                  <span className={`metric-value ${faceData.smileScore >= 3 ? 'good' : 'needs-work'}`}>
                    {faceData.smileScore >= 3 ? '😊 Good' : '😐 Smile more'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="no-face-detected">
                <p>👤 Face detection will appear here when camera is on</p>
              </div>
            )}
          </div>
          
          <div className="tips-list">
            <h4>💡 Professional Tips</h4>
            {tips.length > 0 ? (
              <ul>
                {tips.map((tip, index) => (
                  <li key={index} className={`tip-item tip-${tip.type}`}>
                    <span className="tip-icon">{tip.icon}</span>
                    <span className="tip-message">{tip.message}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-tips">Start camera to get personalized tips...</p>
            )}
          </div>
          
          {capturedPhoto && (
            <div className="captured-photo-section">
              <h4>📸 Captured Photo</h4>
              <div className="photo-preview">
                <img src={capturedPhoto} alt="Captured" />
                <div className="photo-actions">
                  <button 
                    className="upload-btn"
                    onClick={uploadToProfile}
                  >
                    💾 Use as Profile Photo
                  </button>
                  <button 
                    className="retake-btn"
                    onClick={() => setCapturedPhoto(null)}
                  >
                    🔄 Retake
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="professional-tips">
        <h4>🎓 Professional Profile Photo Guidelines</h4>
        <div className="guidelines-grid">
          <div className="guideline">
            <div className="guideline-icon">👔</div>
            <div className="guideline-content">
              <strong>Dress professionally</strong>
              <p>Wear formal or business casual attire</p>
            </div>
          </div>
          <div className="guideline">
            <div className="guideline-icon">💡</div>
            <div className="guideline-content">
              <strong>Good lighting</strong>
              <p>Face light source, avoid shadows</p>
            </div>
          </div>
          <div className="guideline">
            <div className="guideline-icon">🎯</div>
            <div className="guideline-content">
              <strong>Eye contact</strong>
              <p>Look directly at the camera</p>
            </div>
          </div>
          <div className="guideline">
            <div className="guideline-icon">😊</div>
            <div className="guideline-content">
              <strong>Confident smile</strong>
              <p>Natural, genuine smile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoAssistant;