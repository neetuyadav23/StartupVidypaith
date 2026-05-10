import React from 'react';
import { motion } from 'framer-motion';
import Header from '../../Components/Header/Header.jsx';
import Footer from '../../Components/Footer/Footer.jsx';
import HeroBanner from '../../Components/HeroBanner/HeroBanner.jsx';
import FeaturesSection from '../../Components/FeaturesSection/FeaturesSection.jsx';
// In Home.jsx, after HeroBanner and before Footer
import ScrollingBanner from '../../Components/ScrollingBanner/ScrollingBanner.jsx';
import './Home.css'; // Create this file
import StartupShowcase from '../../Components/StartupShowcase/StartupShowcase.jsx';

const Home = () => {
  // Animation variants for HeroBanner
  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.2,
      }
    }
  };

  // Animation for page content (future sections)
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.4,
        ease: "easeIn",
      }
    }
  };

  return (
    <motion.div 
      className="home-page"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header with subtle animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Header />
      </motion.div>

       <ScrollingBanner />

      {/* Hero Banner with smooth animations */}
      <motion.section
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        className="hero-section"
      >
        <HeroBanner />
        
      </motion.section>

      {/* You can add more sections here with animations */}
      
      <FeaturesSection />
      <StartupShowcase />

      {/* Footer with fade-in */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="footer-section"
      >
        <Footer />
      </motion.footer>
    </motion.div>
  );
};

export default Home;