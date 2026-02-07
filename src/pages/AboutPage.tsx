import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MediaCardHeader from '@/components/ui/media-card-header';

const AboutPage = () => {
  const stats = [
    { label: "Years of Excellence", value: "25+" },
    { label: "Countries Served", value: "140+" },
    { label: "Annual Shipments", value: "50k+" },
    { label: "Expert Agents", value: "300+" }
  ];

  const team = [
    { name: "James Wilson", role: "Chief Executive Officer", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { name: "Sarah Chen", role: "Head of Global Operations", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    { name: "Michael Ross", role: "Director of customs", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <MediaCardHeader
        title="Driving Global Commerce"
        description="We are more than just a freight forwarder. We are your strategic partner in international trade."
        backgroundImage="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        overlayOpacity={0.6}
        className="h-[400px] lg:h-[500px]"
      >
      </MediaCardHeader>

      {/* Mission Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-2xl font-bold text-primary-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At freightcode, our mission is to simplify the complexities of global supply chains.
                We believe that logistics should be an accelerator for your business, not a bottleneck.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                By combining decades of industry expertise with next-generation technology,
                we provide visibility, reliability, and control over your cargo, anywhere in the world.
              </p>
              <div className="grid grid-cols-2 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="border-l-4 border-secondary pl-6">
                    <div className="text-3xl font-bold text-primary-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary-100 rounded-2xl transform rotate-3"></div>
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                alt="Our Office"
                className="relative rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Leadership Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Guided by industry veterans committed to innovation and service excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 text-center group">
                <div className="w-20 h-20 mx-auto bg-primary-50 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700 mb-6 group-hover:bg-primary-100 transition-colors">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-primary-600 font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-primary-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Join Our Global Network</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-white px-8">
              <Link to="/contact">Contact Us</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
              <Link to="/careers">View Careers</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;