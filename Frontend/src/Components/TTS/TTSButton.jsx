// File: src/components/TTS/TTSButton.jsx
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Globe, Loader } from 'lucide-react';
import TTSTextFormatter from '../../utils/ttsTextFormatter';
import './TTSButton.css';

const TTSButton = ({ event, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);

  // Available languages with proper language codes
  const languages = [
    { code: 'en-US', name: 'English', label: 'English' },
    { code: 'hi-IN', name: 'Hindi', label: 'हिंदी' },
    { code: 'es-ES', name: 'Spanish', label: 'Español' },
    { code: 'fr-FR', name: 'French', label: 'Français' },
    { code: 'de-DE', name: 'German', label: 'Deutsch' },
    { code: 'ta-IN', name: 'Tamil', label: 'தமிழ்' },
    { code: 'te-IN', name: 'Telugu', label: 'తెలుగు' },
    { code: 'bn-IN', name: 'Bengali', label: 'বাংলা' },
    { code: 'ja-JP', name: 'Japanese', label: '日本語' },
    { code: 'ko-KR', name: 'Korean', label: '한국어' }
  ];

  // Google Translate API function
  const translateText = async (text, targetLang) => {
    if (targetLang.startsWith('en')) {
      return text; // No translation needed for English
    }

    try {
      // Using Google Translate API (you need an API key)
      const apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY || 'YOUR_API_KEY';
      const targetLangCode = targetLang.split('-')[0]; // 'hi', 'es', etc.
      
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            target: targetLangCode
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      // Fallback: Use the built-in translation dictionary
      return TTSTextFormatter.formatForTTS(text, targetLang);
    }
  };

  // Translate and format event details for TTS
  const formatEventForTTS = async (eventData, language) => {
    const formatDateForSpeech = (dateString, langCode) => {
      if (!dateString) return 'Date not set';
      
      try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        return TTSTextFormatter.speakDate(year, month, day, langCode);
      } catch {
        return 'Invalid date';
      }
    };

    // Map language code for formatter
    const languageMap = {
      'en-US': 'en-US',
      'hi-IN': 'hi-IN',
      'es-ES': 'es-ES',
      'fr-FR': 'fr-FR',
      'de-DE': 'de-DE',
      'ta-IN': 'ta-IN',
      'te-IN': 'te-IN',
      'bn-IN': 'bn-IN',
      'ja-JP': 'ja-JP',
      'ko-KR': 'ko-KR'
    };
    
    const formatterLang = languageMap[language] || 'en-US';
    
    // Build the text parts
    const textParts = [];
    
    if (eventData.title) {
      const translatedTitle = await translateText(eventData.title, language);
      textParts.push(`${await translateText('Event:', language)} ${TTSTextFormatter.formatTechnicalTerms(translatedTitle, formatterLang)}`);
    }
    
    if (eventData.description) {
      const translatedDesc = await translateText(eventData.description, language);
      textParts.push(`${await translateText('Description:', language)} ${TTSTextFormatter.formatForTTS(translatedDesc, formatterLang)}`);
    }
    
    if (eventData.date) {
      const dateText = formatDateForSpeech(eventData.date, formatterLang);
      textParts.push(`${await translateText('Date:', language)} ${dateText}`);
    }
    
    if (eventData.time) {
      // Format time naturally
      let timeText = eventData.time;
      // Convert "10:00 AM" to "ten o'clock AM" or translated equivalent
      timeText = timeText.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (match, hour, minute, ampm) => {
        hour = parseInt(hour);
        if (minute === '00') {
          const hourWords = TTSTextFormatter.numberToWords(hour);
          return `${hourWords} o'clock ${ampm}`;
        }
        return match; // Keep as-is for non-zero minutes
      });
      
      const translatedTimeText = await translateText(timeText, language);
      textParts.push(`${await translateText('Time:', language)} ${translatedTimeText}`);
    }
    
    if (eventData.location) {
      const locationText = eventData.location.toLowerCase().includes('online') 
        ? await translateText('Online event', language) 
        : `${await translateText('Location:', language)} ${await translateText(eventData.location, language)}`;
      textParts.push(locationText);
    }
    
    if (eventData.startupName) {
      const translatedStartupName = await translateText(eventData.startupName, language);
      textParts.push(`${await translateText('Organized by:', language)} ${translatedStartupName}`);
    }
    
    if (eventData.category) {
      const translatedCategory = await translateText(eventData.category, language);
      textParts.push(`${await translateText('Category:', language)} ${translatedCategory}`);
    }
    
    if (eventData.tags && eventData.tags.length > 0) {
      const tagsText = eventData.tags.map(async tag => {
        const translatedTag = await translateText(tag, language);
        return TTSTextFormatter.formatTechnicalTerms(translatedTag, formatterLang);
      });
      
      const resolvedTags = await Promise.all(tagsText);
      textParts.push(`${await translateText('Tags:', language)} ${resolvedTags.join(', ')}`);
    }
    
    if (eventData.applyLink) {
      textParts.push(await translateText('Registration link is available', language));
    }
    
    if (eventData.maxParticipants) {
      const maxText = parseInt(eventData.maxParticipants) > 0 
        ? await translateText('Maximum participants:', language) + ` ${eventData.maxParticipants}`
        : '';
      if (maxText) textParts.push(maxText);
    }
    
    // Join with natural pauses
    let finalText = textParts.join('. ');
    
    // Apply final formatting
    finalText = TTSTextFormatter.formatAbbreviations(finalText);
    finalText = TTSTextFormatter.formatSpecialCharacters(finalText);
    finalText = TTSTextFormatter.addSpeechPauses(finalText, language);
    
    return finalText;
  };

  // Generate TTS audio
  const generateTTSAudio = async () => {
    if (isLoading || isPlaying) return;
    
    setIsLoading(true);
    setIsPlaying(false);
    
    try {
      const text = await formatEventForTTS(event, selectedLanguage);
      
      // Get base language code for Hugging Face API
      const baseLang = selectedLanguage.split('-')[0]; // en-US -> en
      
      // Using Hugging Face Inference API
      const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/mms-tts-eng',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_HF_TOKEN || 'your_huggingface_token'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text.substring(0, 1000), // Limit text length
            parameters: {
              language: baseLang // Use base language code for API
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Set up audio events
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      });

      setAudioElement(audio);
      setIsLoading(false);
      
      // Play immediately
      audio.play();
      
    } catch (error) {
      console.error('TTS generation failed:', error);
      setIsLoading(false);
      
      // Fallback: Use browser's speech synthesis
      fallbackTTS();
    }
  };

  // Fallback to browser SpeechSynthesis API with improved language handling
  const fallbackTTS = async () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser');
      return;
    }

    const text = await formatEventForTTS(event, selectedLanguage);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Use the exact language code (en-US, hi-IN, etc.)
    const voice = voices.find(v => v.lang === selectedLanguage) || 
                  voices.find(v => v.lang.startsWith(selectedLanguage.split('-')[0])) || 
                  voices[0];
    
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = selectedLanguage;
    }
    
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopTTS = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
    }
    
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const toggleTTS = () => {
    if (isPlaying) {
      stopTTS();
    } else {
      generateTTSAudio();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        URL.revokeObjectURL(audioElement.src);
      }
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [audioElement]);

  // Initialize speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div className={`tts-container ${className}`}>
      <div className="tts-controls">
        <button
          className={`tts-button ${isPlaying ? 'playing' : ''}`}
          onClick={toggleTTS}
          disabled={isLoading}
          title={isPlaying ? "Stop audio" : "Listen to event details"}
        >
          {isLoading ? (
            <Loader size={16} className="tts-spinner" />
          ) : isPlaying ? (
            <VolumeX size={16} />
          ) : (
            <Volume2 size={16} />
          )}
          <span className="tts-label">
            {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Listen'}
          </span>
        </button>

        <div className="language-selector-wrapper">
          <button
            className="language-toggle"
            onClick={() => setShowLanguageSelect(!showLanguageSelect)}
            title="Select language"
          >
            <Globe size={14} />
            <span className="language-code">
              {languages.find(l => l.code === selectedLanguage)?.code.split('-')[0].toUpperCase() || 'EN'}
            </span>
          </button>

          {showLanguageSelect && (
            <div className="language-dropdown">
              <div className="language-dropdown-header">
                <span>Select Language</span>
                <button 
                  className="close-dropdown"
                  onClick={() => setShowLanguageSelect(false)}
                >
                  ×
                </button>
              </div>
              <div className="language-list">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      setShowLanguageSelect(false);
                    }}
                  >
                    <span className="language-name">{lang.label}</span>
                    <span className="language-code-small">{lang.code.split('-')[0].toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status indicator */}
      {isPlaying && (
        <div className="tts-status">
          <div className="sound-wave">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
          <span className="status-text">
            Playing in {languages.find(l => l.code === selectedLanguage)?.name || 'English'}...
          </span>
        </div>
      )}
    </div>
  );
};

export default TTSButton;