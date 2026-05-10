import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Target, Lightbulb, TrendingUp, Users, Network, Database, 
  ShieldCheck, GraduationCap, ArrowRight, Award, Globe, Zap, Heart,
  ChevronRight, ExternalLink, Sparkles, BookOpen, Star, Globe2, Users2, Target as TargetIcon
} from 'lucide-react';
import Header from '../../Components/Header/Header.jsx';
import './About.css';

function About() {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const teamRef = useRef(null);
  const impactRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe scroll animations - only run when component is mounted
  const { scrollYProgress: heroProgress } = useScroll({
    target: isMounted ? heroRef : undefined,
    offset: ["start start", "end start"]
  });

  const { scrollYProgress: teamProgress } = useScroll({
    target: isMounted ? teamRef : undefined,
    offset: ["start end", "center start"]
  });

  const heroParallax = useTransform(heroProgress, [0, 1], [0, 100]);
  const teamY = useTransform(teamProgress, [0, 1], [0, -50]);

  // Use InView for section animations
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const storyInView = useInView(storyRef, { once: true, amount: 0.3 });
  const teamInView = useInView(teamRef, { once: true, amount: 0.3 });
  const impactInView = useInView(impactRef, { once: true, amount: 0.3 });

  // Team members data
  const teamMembers = [
    {
      id: 1,
      initials: "SV",
      name: "Shruti Verma",
      role: "Founder & Lead",
      bio: "Full Stack Developer with passion for entrepreneurship",
      color: "#FF6B35",
      icon: <Rocket size={20} />
    },
    {
      id: 2,
      initials: "BP",
      name: "Bhavya Pandey",
      role: "Tech Lead",
      bio: "Backend specialist & system architect",
      color: "#4ECDC4",
      icon: <Database size={20} />
    },
    {
      id: 3,
      initials: "RS",
      name: "Riya Sharma",
      role: "Design Head",
      bio: "UI/UX designer & frontend enthusiast",
      color: "#FFD166",
      icon: <Sparkles size={20} />
    },
    {
      id: 4,
      initials: "AK",
      name: "Anjali Kumar",
      role: "Marketing & Outreach",
      bio: "Community building & event management",
      color: "#06D6A0",
      icon: <Users2 size={20} />
    }
  ];

  // Features data
  const features = [
    {
      icon: <TrendingUp size={24} />,
      title: "Strengthen Startup Culture",
      description: "Build a thriving entrepreneurial ecosystem at Banasthali Vidyapith"
    },
    {
      icon: <Users size={24} />,
      title: "Access to Opportunities",
      description: "Provide internships and entrepreneurial opportunities"
    },
    {
      icon: <Network size={24} />,
      title: "Networking Platform",
      description: "Connect founders, students, and mentors"
    },
    {
      icon: <Database size={24} />,
      title: "Centralized Hub",
      description: "One platform for all innovation resources"
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Verified Community",
      description: "Secure and trusted network of innovators"
    },
    {
      icon: <BookOpen size={24} />,
      title: "Learning Resources",
      description: "Curated content for startup development"
    }
  ];

  // Stats data
  const stats = [
    { number: '50+', label: 'Startups Launched', icon: <Rocket size={24} />, color: '#FF6B35' },
    { number: '100+', label: 'Student Members', icon: <Users size={24} />, color: '#4ECDC4' },
    { number: '20+', label: 'Mentors', icon: <Award size={24} />, color: '#FFD166' },
    { number: '15+', label: 'Events Conducted', icon: <Zap size={24} />, color: '#06D6A0' }
  ];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div ref={containerRef} className="about-page">
      {/* Header Component */}
      <Header />
      
      {/* Hero Section */}
      <section ref={heroRef} className="about-hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-shapes">
            <div className="hero-shape shape-1"></div>
            <div className="hero-shape shape-2"></div>
          </div>
        </div>

        <div className="hero-decor decor-rocket">
          <Rocket size={180} strokeWidth={1} />
        </div>
        <div className="hero-decor decor-target">
          <Target size={150} strokeWidth={1} />
        </div>

        <motion.div 
          className="hero-content"
          initial="hidden"
          animate={heroInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="hero-header">
            <motion.span 
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Star size={16} /> About Startup Vidyapith
            </motion.span>
            
            <h1 className="hero-title">
              Empowering<span className="highlight">_</span>Innovators
            </h1>
            
            <motion.p 
              className="hero-subtitle"
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
            >
              Building the next generation of student entrepreneurs at Banasthali Vidyapith
            </motion.p>
            
            <motion.div 
              className="hero-cta-container"
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                className="hero-cta"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Our Ecosystem <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Impact Stats */}
      <section className="impact-stats">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="stat-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-number" style={{ color: stat.color }}>
                {stat.number}
              </div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What is Startup Vidyapith? */}
      <section ref={storyRef} className="intro-section">
        <motion.div 
          className="intro-card hover-card"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="icon-blue-circle"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Database size={40} />
          </motion.div>
          <div className="intro-text">
            <h2>What is Startup Vidyapith?</h2>
            <p>
              Startup Vidyapith is a centralized platform for student-led startups to showcase ventures, 
              offer internships, and build a vibrant entrepreneurial community within Banasthali Vidyapith.
              We bridge the gap between academic learning and real-world entrepreneurship.
            </p>
            <motion.button
              className="intro-button"
              whileHover={{ x: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More <ChevronRight size={16} />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Vision & Mission */}
      <section className="vision-mission-grid">
        <motion.div 
          className="vm-card hover-card"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="icon-blue-circle"
            whileHover={{ scale: 1.1 }}
          >
            <TargetIcon size={28} />
          </motion.div>
          <h3>Our Vision</h3>
          <p>To create a strong ecosystem where students and young innovators can learn, build, and grow impactful startup ideas that solve real-world problems.</p>
        </motion.div>
        
        <motion.div 
          className="vm-card hover-card"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <motion.div 
            className="icon-blue-circle"
            whileHover={{ scale: 1.1 }}
          >
            <Lightbulb size={28} />
          </motion.div>
          <h3>Our Mission</h3>
          <p>Bridge the gap between ideas and execution by offering structured learning, internships, mentorship, and entrepreneurship events to aspiring entrepreneurs.</p>
        </motion.div>
      </section>

      {/* Goals & Features */}
      <section className="goals-section">
        <motion.div 
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Our Ecosystem</span>
          <h2>Goals & Key Features</h2>
          <p>Building a comprehensive ecosystem for student entrepreneurship</p>
        </motion.div>
        
        <motion.div 
          className="features-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-item hover-card"
              variants={fadeInUp}
              whileHover={{ y: -8 }}
            >
              <motion.div 
                className="icon-blue-circle"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                {feature.icon}
              </motion.div>
              <div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* User Types */}
      <section className="user-types-section">
        <motion.div 
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">For Everyone</span>
          <h2>User Types</h2>
          <p>Three roles working together to build a thriving startup ecosystem</p>
        </motion.div>
        
        <div className="user-grid">
          {[
            {
              icon: <ShieldCheck size={45} />,
              title: "Admin",
              description: "Manage platform, approve startups, and oversee community activities",
              color: "#2563eb"
            },
            {
              icon: <GraduationCap size={45} />,
              title: "Student",
              description: "Explore startups, apply for internships, and connect with founders",
              color: "#10b981"
            },
            {
              icon: <Rocket size={45} />,
              title: "Founder",
              description: "Showcase your startup, offer internships, and build your team",
              color: "#8b5cf6"
            }
          ].map((user, index) => (
            <motion.div 
              key={index}
              className="user-card hover-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <motion.div 
                className="icon-large"
                style={{ background: `linear-gradient(135deg, ${user.color}, ${user.color}80)` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {user.icon}
              </motion.div>
              <h3>{user.title}</h3>
              <p>{user.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Our Team */}
      <section ref={teamRef} className="team-section">
        <motion.div 
          className="team-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div className="team-header">
            <span className="section-label">Meet The Team</span>
            <h2 className="section-title">
              Four Girls, One Vision
            </h2>
            <p className="team-subtitle">
              Passionate students driving innovation at Banasthali
            </p>
          </div>

          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={member.id}
                className="team-member hover-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="member-avatar" style={{ backgroundColor: member.color + '20' }}>
                  <motion.div 
                    className="avatar-initials"
                    style={{ color: member.color }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {member.initials}
                  </motion.div>
                  <motion.div 
                    className="avatar-hover"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {member.icon}
                  </motion.div>
                </div>
                <div className="member-info">
                  <h4 className="member-name">
                    {member.name}
                  </h4>
                  <p className="member-role" style={{ color: member.color }}>
                    {member.role}
                  </p>
                  <p className="member-bio">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Join CTA */}
      <section className="join-section">
        <motion.div 
          className="join-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <div className="join-card">
            <div className="join-content">
              <h2 className="join-title">Ready to Innovate?</h2>
              <p className="join-text">
                Join our community of student entrepreneurs and start your journey 
                with Startup_Vidyapith today.
              </p>
              
              <div className="join-buttons">
                <motion.button
                  className="join-button primary"
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Become a Member <ChevronRight size={18} />
                </motion.button>
                <motion.button
                  className="join-button secondary"
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore Startups <ExternalLink size={18} />
                </motion.button>
              </div>
            </div>
            
            <div className="join-decoration">
              <motion.div 
                className="decoration-circle"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="decoration-circle"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <motion.div 
          className="footer-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div className="footer-logo">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Globe2 size={24} className="globe-icon" />
            </motion.div>
            Startup<span className="highlight">_</span>Vidyapith
          </div>
          <p className="footer-tagline">
            Empowering Student Entrepreneurs at Banasthali Vidyapith
          </p>
          <div className="footer-social">
            {['Instagram', 'LinkedIn', 'Twitter', 'GitHub'].map((platform) => (
              <motion.a 
                key={platform} 
                href="#" 
                className="social-link"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                {platform}
              </motion.a>
            ))}
          </div>
          <p className="footer-copyright">
            © 2024 Startup_Vidyapith. All rights reserved.
          </p>
        </motion.div>
      </footer>
    </div>
  );
}

export default About;