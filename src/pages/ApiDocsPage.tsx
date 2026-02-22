import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { Copy, Trash2, Key, Check, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useFeature } from '@/hooks/useFeature';
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Link } from 'react-router-dom';

const ApiDocsPage: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [activeEndpoint, setActiveEndpoint] = useState('shipments');

  // API Key State
  const myKeysQuery = useQuery(api.developer.listApiKeys);
  const myKeys = useStickyQueryData("developer:apiKeys", myKeysQuery, []);
  const generateKey = useMutation(api.developer.generateApiKey);
  const revokeKey = useMutation(api.developer.revokeApiKey);

  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const hasApiAccess = useFeature("API_ACCESS");

  const handleGenerateKey = async () => {
    if (!hasApiAccess) return;
    try {
      setIsGenerating(true);
      const result = await generateKey({ name: `Key ${newlyGeneratedKey ? '(New)' : ''}` });
      setNewlyGeneratedKey(result.key);
      toast.success("API Key Generated");
    } catch (error) {
      toast.error("Failed to generate key");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async (id: any) => {
    if (!confirm("Are you sure you want to revoke this key? It will stop working immediately.")) return;
    try {
      await revokeKey({ id });
      toast.success("Key revoked");
    } catch (error) {
      toast.error("Failed to revoke key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const endpoints = {
    shipments: {
      title: 'Shipments API',
      description: 'Manage and track your freight shipments',
      methods: [
        {
          method: 'GET',
          path: '/api/v1/shipments',
          description: 'Retrieve all shipments',
          parameters: [
            { name: 'status', type: 'string', description: 'Filter by shipment status' },
            { name: 'limit', type: 'number', description: 'Number of results to return' }
          ],
          response: `{\n  "success": true,\n  "count": 5,\n  "data": [ ... ]\n}`
        }
      ]
    },
    quotes: {
      title: 'Quotes API',
      description: 'Request and manage freight quotes',
      methods: [
        {
          method: 'POST',
          path: '/api/v1/quotes',
          description: 'Request a freight quote',
          body: `{\n  "origin": "CNPZG",\n  "destination": "USLAX",\n  "weight": 500\n}`,
          response: `{\n  "success": true,\n  "quoteId": "qt_123"\n}`
        }
      ]
    }
  };

  const renderMethod = (method: any, index: number) => (
    <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6 bg-white shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <span className={`px-3 py-1 text-xs font-bold rounded uppercase tracking-wide ${method.method === 'GET' ? 'bg-green-100 text-green-700' :
          method.method === 'POST' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
          {method.method}
        </span>
        <code className="text-sm font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 text-gray-800">
          {method.path}
        </code>
      </div>
      <p className="text-gray-600 mb-4">{method.description}</p>

      {/* Params and Body sections... (Simplified for clarity in this view, full content implied) */}
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Example Response</h4>
      <pre className="bg-slate-900 text-emerald-400 p-4 rounded-md text-xs overflow-x-auto">
        <code>{method.response}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Developer API</h1>
            <p className="text-sm text-gray-500 mt-1">Integrate freight capabilities directly into your ERP</p>
          </div>
          <div className="text-right">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button>Sign In to Manage Keys</Button>
              </SignInButton>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Signed in as {user?.fullName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick Start Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Authentication
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Authenticate requests by sending your API key in the arguments (for Convex functions) or headers.
              </p>
              <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-blue-300 whitespace-pre">
                    {`// Example: Requesting a GeoRisk Assessment
const assessment = await ctx.runAction(api.geo.getRouteRiskAssessment, {
  origin: "Port of London, UK",
  destination: "Port of Aden, YE",
  waypoints: ["Suez Canal"]
});

// Returns: { score: 88, level: "High", advisory: "..." }`}
                  </pre>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reference</h3>
              {Object.entries(endpoints).map(([key, endpoint]) => (
                <button
                  key={key}
                  onClick={() => setActiveEndpoint(key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeEndpoint === key ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {endpoint.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-8">

            {/* API Key Management Section */}
            {isSignedIn && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50/30 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Your API Keys</h2>
                    <p className="text-sm text-gray-500">Manage access keys for your applications</p>
                  </div>
                  {hasApiAccess ? (
                    <Button onClick={handleGenerateKey} disabled={isGenerating} size="sm" className="gap-2">
                      {isGenerating ? "Generating..." : <><Plus className="w-4 h-4" /> Generate New Key</>}
                    </Button>
                  ) : (
                    <Button variant="secondary" asChild size="sm">
                      <Link to="/payments?tab=subscription">
                        <span className="mr-2">🔒</span> Upgrade to Pro
                      </Link>
                    </Button>
                  )}
                </div>

                {/* New Key Display */}
                {newlyGeneratedKey && (
                  <div className="p-6 bg-green-50 border-b border-green-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-full text-green-700 mt-1">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-green-800 font-medium">New API Key Generated</h3>
                        <p className="text-green-700 text-sm mt-1 mb-3">
                          Please copy this key now. It will not be shown again in full.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white border border-green-200 px-4 py-3 rounded text-green-900 font-mono text-sm break-all">
                            {newlyGeneratedKey}
                          </code>
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(newlyGeneratedKey)} className="bg-white border-green-200 hover:bg-green-50 text-green-700">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Keys List */}
                <div className="divide-y divide-gray-100">
                  {myKeys?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      You don't have any active API keys. Generate one to get started.
                    </div>
                  ) : (
                    myKeys?.map((key: any) => (
                      <div key={key._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded text-gray-500">
                            <Key className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-mono text-sm text-gray-800 font-medium flex items-center gap-2">
                              {key.maskedKey}
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Created {new Date(key.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRevokeKey(key._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Revoke</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Documentation Content */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {endpoints[activeEndpoint as keyof typeof endpoints].title}
              </h2>
              {endpoints[activeEndpoint as keyof typeof endpoints].methods.map(renderMethod)}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
