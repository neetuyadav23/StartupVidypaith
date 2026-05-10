import React, { useState } from 'react';
import './SuccessStories.css'; // Changed to regular CSS import
import Header from '../../Components/Header/Header.jsx';
import Footer from '../../Components/Footer/Footer.jsx';
import { 
  FaQuoteLeft, 
  FaTrophy, 
  FaStar, 
  FaGraduationCap, 
  FaLeaf, 
  FaHeartbeat,
  FaLaptopCode,
  FaTwitter, 
  FaFacebookF, 
  FaLinkedinIn, 
  FaInstagram, 
  FaYoutube 
} from 'react-icons/fa';

const SuccessStories = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Stories' },
    { id: 'funded', label: 'Funded Startups' },
    { id: 'tech', label: 'Tech' },
    { id: 'social', label: 'Social Impact' },
    { id: 'women', label: 'Women Founders' }
  ];

  const featuredStories = [
    {
      id: 1,
      name: 'Rahul Verma',
      title: 'Founder & CEO, AgriGrow',
      company: 'AgriGrow',
      description: 'AI-powered crop management solutions',
      quote: '"Startup Vidyapith gave me the tools and confidence to transform my family farming background into a tech-driven agribusiness."',
      achievement: 'Raised ₹12 Cr in Series A funding',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
      category: ['tech', 'funded'],
      logo: <FaLeaf />,
      color: '#28a745'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      title: 'Co-founder, MedTech Solutions',
      company: 'MedTech Solutions',
      description: 'AI-driven diagnostic tools for early disease detection',
      quote: '"The network I built at Startup Vidyapith connected me with the right investors and healthcare professionals."',
      achievement: 'Partnered with 50+ hospitals nationwide',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      category: ['tech', 'women'],
      logo: <FaHeartbeat />,
      color: '#dc3545'
    },
    {
      id: 3,
      name: 'Arun Patel',
      title: 'Founder, EduTech Innovators',
      company: 'EduTech Innovators',
      description: 'Personalized learning platforms for rural education',
      quote: '"The incubator program helped me validate my idea and build a scalable business model."',
      achievement: 'Impacting 10,000+ students',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      category: ['social'],
      logo: <FaLaptopCode />,
      color: '#007bff'
    }
  ];

  const moreStories = [
    {
      id: 4,
      name: 'Neha Gupta',
      company: 'GreenPack',
      description: 'Sustainable packaging solutions',
      achievement: 'Reduced plastic waste by 500+ tons annually',
      tags: ['Sustainability', 'Manufacturing'],
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786'
    },
    {
      id: 5,
      name: 'Rajesh Kumar',
      company: 'FinTech Solutions',
      description: 'Blockchain-based financial services',
      achievement: 'Processed ₹200+ Cr in transactions',
      tags: ['FinTech', 'Blockchain'],
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
    },
    {
      id: 6,
      name: 'Anjali Mehta',
      company: 'TravelLocal',
      description: 'Hyperlocal travel experiences platform',
      achievement: 'Featured in Forbes 30 Under 30 Asia',
      tags: ['Travel', 'Platform'],
      image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df'
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Sonia Reddy',
      title: 'Founder, HealthTech Innovations',
      quote: 'The mentorship I received at Startup Vidyapith was transformational. My mentor helped me navigate early-stage challenges I didn\'t even know existed.',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/women/32.jpg'
    },
    {
      id: 2,
      name: 'Amit Joshi',
      title: 'CEO, TechLogistics',
      quote: 'The network I built here is priceless. I found my co-founder, first investors, and even early customers through Startup Vidyapith connections.',
      rating: 4.5,
      image: 'https://randomuser.me/api/portraits/men/54.jpg'
    }
  ];

  const stats = [
    { value: '250+', label: 'Startups Launched' },
    { value: '₹85 Cr+', label: 'Total Funding Raised' },
    { value: '1200+', label: 'Successful Alumni' },
    { value: '15+', label: 'Countries with Alumni' }
  ];

  const filteredStories = activeFilter === 'all' 
    ? featuredStories 
    : featuredStories.filter(story => story.category.includes(activeFilter));

  return (
    <div className="container">
         <Header />
      {/* Hero Section */}
      <section className="hero">
        <div className="heroContent">
          <h1 className="heroTitle">
            From Learners to <span className="highlight">Leaders</span>
          </h1>
          <p className="heroSubtitle">
            Discover how our alumni are transforming industries and creating impact through innovation
          </p>
          
          <div className="statsGrid">
            {stats.map((stat, index) => (
              <div key={index} className="statItem">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="filterSection">
        <div className="filterContainer">
          <h2>Browse Stories by Category</h2>
          <div className="filterButtons">
            {filters.map(filter => (
              <button
                key={filter.id}
                className={`filterBtn ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="storiesSection">
        <div className="sectionHeader">
          <h2>Featured <span className="highlight">Success Stories</span></h2>
          <p>Meet some of our most inspiring alumni who turned their ideas into thriving businesses</p>
        </div>

        <div className="featuredGrid">
          {filteredStories.map(story => (
            <div key={story.id} className="featuredCard">
              <div 
                className="storyImage"
                style={{ backgroundImage: `url(${story.image})` }}
              >
                <div className="companyLogo" style={{ backgroundColor: story.color }}>
                  {story.logo}
                </div>
              </div>
              
              <div className="storyContent">
                <div className="storyHeader">
                  <h3>{story.company}</h3>
                  <p className="storyDescription">{story.description}</p>
                </div>
                
                <div className="storyQuote">
                  <FaQuoteLeft className="quoteIcon" />
                  <p>{story.quote}</p>
                </div>
                
                <div className="storyPerson">
                  <div>
                    <h4>{story.name}</h4>
                    <p className="personTitle">{story.title}</p>
                  </div>
                  <div className="achievement">
                    <FaTrophy />
                    <span>{story.achievement}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* More Stories Grid */}
      <section className="moreStories">
        <div className="sectionHeader">
          <h2>More <span className="highlight">Inspiring Journeys</span></h2>
          <p>Discover how our community is building the future, one startup at a time</p>
        </div>

        <div className="moreStoriesGrid">
          {moreStories.map(story => (
            <div key={story.id} className="moreStoryCard">
              <div 
                className="moreStoryImage"
                style={{ backgroundImage: `url(${story.image})` }}
              />
              
              <div className="moreStoryContent">
                <h3>{story.company}</h3>
                <p className="moreStoryDescription">{story.description}</p>
                
                <div className="moreStoryPerson">
                  <h4>{story.name}</h4>
                  <p className="moreStoryAchievement">{story.achievement}</p>
                </div>
                
                <div className="tags">
                  {story.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonialsSection">
        <div className="sectionHeader">
          <h2>What Our <span className="highlight">Alumni Say</span></h2>
          <p>Hear directly from those who've walked the path before you</p>
        </div>

        <div className="testimonialsGrid">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="testimonialCard">
              <div className="testimonialContent">
                <FaQuoteLeft className="testimonialQuoteIcon" />
                <p>{testimonial.quote}</p>
              </div>
              
              <div className="testimonialAuthor">
                <div className="authorImage">
                  <img src={testimonial.image} alt={testimonial.name} />
                </div>
                <div className="authorInfo">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.title}</p>
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        className={i < Math.floor(testimonial.rating) ? 'filledStar' : 'emptyStar'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="ctaSection">
        <div className="ctaContent">
          <h2>Ready to Write Your Success Story?</h2>
          <p>Join Startup Vidyapith and turn your entrepreneurial dreams into reality</p>
          <div className="ctaButtons">
            <button className="ctaPrimary">Apply Now</button>
            <button className="ctaSecondary">Explore Programs</button>
          </div>
        </div>
      </section>

      {/* Footer */}
     <Footer />
    </div>
  );
};

export default SuccessStories;