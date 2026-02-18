import React from 'react';
import { Link } from 'react-router-dom';
import MediaCardHeader from '@/components/ui/media-card-header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const CarrierIntegrationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <MediaCardHeader
          title="Carrier API Integration"
          subtitle="System Administration"
          description="Monitor live carrier integrations, API health, and rate shopping performance."
          backgroundImage="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          overlayOpacity={0.6}
          className="h-20 mb-8"
        />
        {/* Integration Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-500">Active APIs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">2,173</div>
              <div className="text-sm text-gray-500">Rate Calls Today</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">98.5%</div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">245ms</div>
              <div className="text-sm text-gray-500">Avg Response</div>
            </div>
          </div>
        </div>

        {/* API Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-green-600 text-2xl">✅</span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">ReachShip API</h3>
                <p className="text-sm text-green-600">Status: ONLINE</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Response Time: 245ms</p>
              <p>Success Rate: 99.2%</p>
              <p>Carriers: FedEx, UPS, DHL, USPS</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-blue-600 text-2xl">✅</span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">EasyShip API</h3>
                <p className="text-sm text-blue-600">Status: ONLINE</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Response Time: 312ms</p>
              <p>Success Rate: 97.8%</p>
              <p>Carriers: DHL, Royal Mail, International</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-red-600 text-2xl">❌</span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Shippo API</h3>
                <p className="text-sm text-red-600">Status: OFFLINE</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>No API key configured</p>
              <p>Fallback: Mock data</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-yellow-600 text-2xl">⚠️</span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">FedEx Direct</h3>
                <p className="text-sm text-yellow-600">Status: DEMO</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Test environment only</p>
              <p>Production keys needed</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/">
                <span className="mr-2">🔄</span>
                Test Live Rates
              </Link>
            </Button>
            <Button variant="outline" className="justify-start">
              <span className="mr-2">📊</span>
              View Analytics
            </Button>
            <Button variant="outline" className="justify-start">
              <span className="mr-2">⚙️</span>
              API Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarrierIntegrationPage;
