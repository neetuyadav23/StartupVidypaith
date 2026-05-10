import React from 'react';
import Header from '../Components/Header/Header.jsx';
import { Calendar, MapPin, Sparkles, ArrowRight } from 'lucide-react';

const EventsSection = () => {
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Newsletter form submitted');
  };

  // Sample events data
  const upcomingEvents = [
    {
      id: 1,
      title: 'Campus Innovation Mixer',
      date: '2025-01-15',
      location: 'University Auditorium',
      description: 'Network with student founders and industry mentors.',
      status: 'Upcoming'
    },
    {
      id: 2,
      title: 'Startup Funding Workshop',
      date: '2025-01-22',
      location: 'Tech Hub, Block B',
      description: 'Learn how to pitch and secure your first round of funding.',
      status: 'Upcoming'
    },
    {
      id: 3,
      title: 'Women in Tech Panel',
      date: '2024-12-10',
      location: 'Online / Virtual',
      description: 'A discussion with successful women entrepreneurs from our alumni network.',
      status: 'Past'
    },
  ];

  // Format date to a more readable form
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-semibold tracking-wide text-orange-600 uppercase">
              What's Stirring?
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Startup Events & Updates
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Pop-up workshops, founder meetups, and the latest buzz from Banasthali's startup scene. 
            Come see what we're building.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Column: Events List */}
          <div className="lg:w-1/2">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Upcoming & Recent
              </h3>
              <p className="text-gray-600">
                Mark your calendar for these gatherings.
              </p>
            </div>

            <div className="space-y-6">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 hover:border-orange-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{event.title}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.date)}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.status === 'Upcoming' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-gray-600">{event.description}</p>
                  <button className="mt-4 flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                    View details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-black rounded-2xl text-white">
              <h4 className="text-xl font-bold mb-2">Host an Event With Us</h4>
              <p className="text-gray-300 mb-4">
                Have a workshop or talk that would benefit our community? We'd love to collaborate.
              </p>
              <button className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Propose an Event
              </button>
            </div>
          </div>

          {/* Right Column: Newsletter (Like Bouquet Infusions) */}
          <div className="lg:w-1/2">
            <div className="sticky top-8">
              <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Stay in the Loop
                </h3>
                <p className="text-gray-600 mb-2">
                  Get the latest on campus events, founder stories, and opportunities.
                </p>
                <p className="text-gray-500 text-sm mb-8">
                  We promise no spam, just valuable updates. Unsubscribe anytime.
                </p>

                <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                        placeholder="e.g., Priya Sharma"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <input type="checkbox" id="updates" className="rounded" defaultChecked />
                    <label htmlFor="updates" className="text-sm text-gray-600">
                      Send me workshop reminders and weekly digests
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Subscribe for Updates
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Follow Our Journey</h4>
                  <div className="flex gap-4">
                    {['Instagram', 'LinkedIn', 'YouTube'].map((platform) => (
                      <a
                        key={platform}
                        href="#"
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;