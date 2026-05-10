import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AIWelcomeBanner.css';

const AIWelcomeBanner = () => {
  const [message, setMessage] = useState('Loading personalized welcome...');
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const showAIWelcome = async () => {
    try {
      // Get visitor data
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      // Get location using free IP geolocation API
      let location = 'your city';
      try {
        const locationResponse = await fetch('https://ipapi.co/json/');
        const locationData = await locationResponse.json();
        location = locationData.city || locationData.country_name || 'your location';
      } catch (locationError) {
        console.log('Location fetch failed, using default');
      }
      
      // Fallback messages if API fails
      const fallbackMessages = {
        morning: `Good morning from ${location}! ☀️`,
        afternoon: `Happy afternoon, ${location} visitor! 👋`,
        evening: `Good evening, ${location}! 🌙`,
      };
      
      // Try AI generation (with timeout)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
          {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${process.env.REACT_APP_HF_TOKEN || 'YOUR_HF_TOKEN_HERE'}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: `Generate a short, friendly welcome message (max 15 words) for website visitor. 
                       Time: ${timeOfDay}. Location: ${location}. 
                       Make it warm and inviting.`,
              parameters: { 
                max_length: 50, 
                temperature: 0.7,
                return_full_text: false 
              }
            }),
            signal: controller.signal
          }
        );
        
        clearTimeout(timeout);
        const data = await response.json();
        
        if (data && data[0]?.generated_text) {
          return data[0].generated_text;
        }
      } catch (apiError) {
        console.log('AI API failed, using fallback:', apiError.message);
      }
      
      return fallbackMessages[timeOfDay];
      
    } catch (error) {
      return "Welcome to our website! 🌟";
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadWelcome = async () => {
      setIsLoading(true);
      const welcomeMessage = await showAIWelcome();
      
      if (isMounted) {
        setMessage(welcomeMessage);
        setIsLoading(false);
        
        // Auto-dismiss after 7 seconds
        setTimeout(() => {
          if (isMounted) {
            setIsVisible(false);
          }
        }, 7000);
      }
    };

    loadWelcome();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array ensures it runs once on mount/refresh

  // Add keyboard shortcut to show banner again (for testing)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'w') {
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 7000);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="ai-welcome-banner"
        >
          <div className="ai-welcome-content">
            <div className="ai-welcome-icon">🤖</div>
            <div className="ai-welcome-text">
              {isLoading ? (
                <div className="loading-dots">
                  <span>Loading personalized welcome</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              ) : (
                message
              )}
            </div>
            <button 
              className="ai-welcome-close"
              onClick={() => setIsVisible(false)}
              aria-label="Close welcome message"
            >
              ✕
            </button>
          </div>
          
          {/* Progress bar for 7-second countdown */}
          <motion.div 
            className="ai-welcome-progress"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 7, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIWelcomeBanner;