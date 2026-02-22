import React from 'react';
import { Link } from 'react-router-dom';
import MediaCardHeader from '@/components/ui/media-card-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Truck, Activity, ShieldCheck, Globe, RefreshCcw, BarChart3, Settings } from 'lucide-react';
import AdminPageHeader from '@/components/layout/admin/AdminPageHeader';

const CarrierIntegrationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Carrier Integrations"
        subtitle="Monitor live carrier APIs, health, and rate performance."
        icon={Truck}
      />

      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active APIs', value: '3', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Globe },
          { label: 'Rate Calls (24h)', value: '2,173', color: 'text-blue-600', bg: 'bg-blue-50', icon: Activity },
          { label: 'Success Rate', value: '98.5%', color: 'text-purple-600', bg: 'bg-purple-50', icon: ShieldCheck },
          { label: 'Avg Latency', value: '245ms', color: 'text-orange-600', bg: 'bg-orange-50', icon: Activity },
        ].map((stat, i) => (
          <Card key={i} className="p-4 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-1.5 border-slate-200 text-slate-400">Live</Badge>
            </div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color} mt-0.5 tracking-tight`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* API Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'ReachShip API', status: 'ONLINE', success: '99.2%', latency: '245ms', carriers: 'FedEx, UPS, DHL, USPS', color: 'emerald' },
          { name: 'EasyShip API', status: 'ONLINE', success: '97.8%', latency: '312ms', carriers: 'DHL, Royal Mail, International', color: 'blue' },
          { name: 'Shippo API', status: 'OFFLINE', success: '0%', latency: 'N/A', carriers: 'Mock data fallback', color: 'red' },
          { name: 'FedEx Direct', status: 'DEMO', success: '100%', latency: '180ms', carriers: 'Test environment only', color: 'amber' },
        ].map((api, i) => (
          <Card key={i} className="p-4 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-${api.color}-50 text-${api.color}-600 font-bold border border-${api.color}-100`}>
                  {api.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{api.name}</h3>
                  <Badge className={`bg-${api.color}-50 text-${api.color}-700 border-${api.color}-200 text-[9px] uppercase font-bold h-4 px-1`}>
                    {api.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-900">{api.latency}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Latency</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold">Success Rate</p>
                <p className="text-xs font-bold text-slate-700">{api.success}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold">Capabilities</p>
                <p className="text-xs font-bold text-slate-700 truncate" title={api.carriers}>{api.carriers}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-tight">System Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" size="sm" className="h-9 justify-start text-xs font-bold tracking-tight bg-slate-50/50 hover:bg-slate-100">
            <RefreshCcw className="mr-2 h-3.5 w-3.5 text-blue-500" /> Test Live Rates
          </Button>
          <Button variant="outline" size="sm" className="h-9 justify-start text-xs font-bold tracking-tight bg-slate-50/50 hover:bg-slate-100">
            <BarChart3 className="mr-2 h-3.5 w-3.5 text-purple-500" /> View Analytics
          </Button>
          <Button variant="outline" size="sm" className="h-9 justify-start text-xs font-bold tracking-tight bg-slate-50/50 hover:bg-slate-100">
            <Settings className="mr-2 h-3.5 w-3.5 text-slate-500" /> API Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarrierIntegrationPage;
