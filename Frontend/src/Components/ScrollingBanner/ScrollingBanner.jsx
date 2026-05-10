import React, { useRef } from 'react';
import './ScrollingBanner.css';

const ScrollingBanner = () => {
  const scrollerRef = useRef(null);
  
  // Suggested content for the banner
  const bannerContent = [
    "🚀 Empower Women Entrepreneurs",
    "💡 Connect with Campus Talent",
    "🤝 Find Co-Founders",
    "📈 Grow Your Startup",
    "🎓 Banasthali Vidyapith Initiative",
    "🌟 Where Ideas Meet Execution",
    "🔗 Build the Future Together"
  ];

  // Duplicate content for seamless loop
  const duplicatedContent = [...bannerContent, ...bannerContent];

  return (
    <section className="scrolling-banner-section">
      <div 
        className="scrolling-banner-container"
        ref={scrollerRef}
        onMouseEnter={() => scrollerRef.current?.classList.add('paused')}
        onMouseLeave={() => scrollerRef.current?.classList.remove('paused')}
        aria-label="Scrolling announcements"
      >
        <div className="scrolling-content">
          {duplicatedContent.map((text, index) => (
            <div key={index} className="scrolling-item">
              <span className="scrolling-text">{text}</span>
              <span className="scrolling-divider">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrollingBanner;