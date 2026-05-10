import React from 'react';
import './FeatureCard.css';

const FeatureCard = ({ image, title, description, color, index }) => {
  return (
    <div 
      className="feature-card"
      style={{ 
        '--card-color': color,
      }}
    >
      {/* Card background elements */}
      <div className="card-glow"></div>
      <div className="card-border"></div>
      
      {/* Image container */}
      <div className="feature-image-container">
        <div className="image-glow"></div>
        {image ? (
          <img 
            src={image} 
            alt={title}
            className="feature-image"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.parentNode.querySelector('.feature-image-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="feature-image-fallback" style={{ display: 'none' }}>
          {['💡', '👥', '💬', '🎯'][index]}
        </div>
      </div>
      
      {/* Content */}
      <div className="card-content">
        <h3 className="feature-title">
          {title}
        </h3>
        
        <p className="feature-description">
          {description}
        </p>
      </div>
      
      {/* Decorative corner elements */}
      <div className="card-corner top-left"></div>
      <div className="card-corner top-right"></div>
      <div className="card-corner bottom-left"></div>
      <div className="card-corner bottom-right"></div>
    </div>
  );
};

export default FeatureCard;