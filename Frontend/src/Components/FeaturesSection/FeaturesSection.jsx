import React from 'react';
import './FeaturesSection.css';
import FeatureCard from './FeatureCard';

const FeaturesSection = () => {
  const features = [
    {
      image: '/idea.png',
      title: 'Startup Directory',
      description: 'Browse innovative startup ideas from Banasthali students',
      color: '#FF6B35'
    },
    { 
      image: '/team.jpeg',
      title: 'Team Formation',
      description: 'Connect with talented students to build your dream team',
      color: '#4ECDC4'
    },
    {
      image: '/idea.png',
      title: 'Idea Validation',
      description: 'Get feedback and mentorship for your startup concepts',
      color: '#FFD166'
    },
    {
      image: '/internship.jpeg',
      title: 'Internship Opportunities',
      description: 'Get internships inside startups and gain real-world experience',
      color: '#06D6A0'
    }
  ];

  return (
    <section className="features-section">
      <div className="features-bg"></div>
      <div className="features-orange-glow"></div>
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">How It Works</h2>
          <div className="title-underline">
            <div className="underline-dot"></div>
            <div className="underline-dot"></div>
            <div className="underline-dot"></div>
          </div>
          <p className="features-subtitle">
            A complete ecosystem for student entrepreneurs at Banasthali
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              image={feature.image}
              title={feature.title}
              description={feature.description}
              color={feature.color}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;