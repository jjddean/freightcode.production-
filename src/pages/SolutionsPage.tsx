import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MediaCardHeader from '@/components/ui/media-card-header';

const SolutionsPage = () => {
  const industries = [
    {
      title: "Small & Medium Enterprises",
      description: "Agile logistics for growing businesses. We handle compliance and booking so you can focus on scaling.",
      icon: "🚀",
      path: "/quotes"
    },
    {
      title: "Enterprise Organizations",
      description: "Comprehensive supply chain management with dedicated account teams and custom API integrations.",
      icon: "🏢",
      path: "/contact"
    },
    {
      title: "Sensitive & Pharma",
      description: "Temperature-controlled and high-security options for pharmaceutical and high-value exports.",
      icon: "💊",
      path: "/services"
    },
    {
      title: "Automotive & Heavy Lift",
      description: "Specialized equipment and expertise for moving vehicles, machinery, and oversized cargo.",
      icon: "🚗",
      path: "/quotes"
    },
    {
      title: "E-Commerce Retail",
      description: "Fast-track air freight and consolidation services designed for high-turnover online retailers.",
      icon: "🛒",
      path: "/services"
    },
    {
      title: "Cross-Border Trade",
      description: "Navigation of complex regional trade agreements and customs requirements for seamless border crossings.",
      icon: "🌐",
      path: "/compliance"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <MediaCardHeader
        title="Tailored Solutions for Every Sector"
        description="From startups to global enterprises, we engineer supply chain strategies that align with your unique business goals."
        backgroundImage="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        overlayOpacity={0.6}
        className="h-[400px] lg:h-[500px]"
      >
        <div className="flex gap-4">
          <Button asChild size="lg" className="bg-white text-primary-900 hover:bg-white/90">
            <Link to="/contact">Discuss Your Needs</Link>
          </Button>
        </div>
      </MediaCardHeader>

      {/* Industries Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary-900 mb-4">Industries We Serve</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Specialized expertise across diverse sectors ensures your specific requirements are always met.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {industry.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                {industry.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {industry.description}
              </p>
              <Link
                to={industry.path}
                className="inline-flex items-center text-sm text-primary-600 font-semibold hover:text-primary-800 transition-colors"
              >
                Learn more <span className="ml-1">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-secondary/10 rounded-2xl transform -rotate-2"></div>
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                alt="Global Shipping Operations"
                className="relative rounded-xl shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">Why Choose freightcode Solutions?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Custom Pricing Models</h3>
                    <p className="text-sm text-gray-600">Volume-based discounts and flexible payment terms aligned with your cash flow.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Dedicated Account Management</h3>
                    <p className="text-sm text-gray-600">Single point of contact who understands your business nuances.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Global Compliance</h3>
                    <p className="text-sm text-gray-600">Proactive management of tariffs, sanctions, and regulatory changes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-primary-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Let's Build Your Solution</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-white px-8">
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionsPage;