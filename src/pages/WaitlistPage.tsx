import React, { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '@/components/ui/brand-logo';
import { InteractiveHero } from './InteractiveHero';

const WaitlistPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Capture UTM params if available
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const source = searchParams.get('utm_source') || 'direct';
    const refCode = searchParams.get('ref') || undefined;

    const joinWaitlist = useMutation(api.marketing.joinWaitlist);
    const [referralData, setReferralData] = useState<{ code: string; position: number } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setLoading(true);
        try {
            const result = await joinWaitlist({
                email,
                company: company || 'Unknown',
                role: role || 'other',
                source,
                ref: refCode
            });

            // @ts-ignore
            if (result.success) {
                // @ts-ignore
                setReferralData({ code: result.referralCode, position: result.position });
                setSubmitted(true);
                toast.success("You're on the list!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // SUCCESS STATE (Light Theme preserved for clarity, or Dark Theme? Let's go Dark for consistency)
    if (submitted && referralData) {
        const shareUrl = `${window.location.origin}/access?ref=${referralData.code}`;
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200">
                <div className="max-w-xl w-full bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500"></div>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-full mb-6 relative border border-slate-700">
                            <span className="text-4xl">🚀</span>
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-slate-900">
                                #{referralData.position}
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">You're in the queue!</h2>
                        <p className="text-slate-400">
                            Current Position: <span className="font-bold text-white">#{referralData.position}</span>
                        </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                            <span className="text-xl">🎟️</span> Your Golden Ticket
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Refer 5 friends to skip the line and get instant access.
                        </p>
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <code className="flex-1 font-mono text-sm text-blue-300 px-2 truncate">
                                {shareUrl}
                            </code>
                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-500 text-white"
                                onClick={() => {
                                    navigator.clipboard.writeText(shareUrl);
                                    toast.success("Link copied!");
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                            <div className="text-2xl font-bold text-white">0</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Referrals</div>
                        </div>
                        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800 opacity-50">
                            <div className="text-2xl font-bold text-slate-600">5</div>
                            <div className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Goal</div>
                        </div>
                        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800 opacity-50">
                            <div className="text-xl font-bold text-slate-600">Locked</div>
                            <div className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Access</div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-12 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                        onClick={() => window.location.href = '#'}
                    >
                        Return to Home
                    </Button>
                </div>
            </div>
        );
    }

    // MAIN CORPORATE LANDING PAGE DESIGN (Dark Mode)
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">

            {/* CUSTOM HEADER (Replaces Navbar for this page) */}
            <header className="absolute top-0 left-0 w-full z-50">
                <div className="max-w-6xl mx-auto px-12 md:px-20 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <BrandLogo size="lg" />
                    </div>

                    {/* Navigation Links (Restored) */}
                    <nav className="hidden md:flex items-center gap-8">
                        {['Services', 'Solutions', 'Platform', 'Resources', 'About', 'Contact'].map((item) => (
                            <Link
                                key={item}
                                to={`/${item.toLowerCase()}`}
                                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-4">
                        <a href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                            Sign In
                        </a>
                        <a href="/register" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                            Sign Up
                        </a>
                    </div>
                </div>
            </header>

            {/* 1. HERO SECTION */}
            {/* 1. HERO SECTION */}
            <div className="relative pt-24 pb-20 border-b border-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row gap-12 items-center">

                        {/* Left: Copy */}
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-300 text-xs font-mono">
                                <span className="animate-pulse">●</span> GeoRisk Engine Live
                            </div>

                            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                                Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Freight Forwarding</span>
                            </h1>

                            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl text-left leading-relaxed">
                                Streamlined global logistics with instant quotes, digital documentation, and real-time tracking for complex shipping lanes.
                                <br className="hidden md:block mt-4" />
                                <span className="text-slate-300 italic">"Navigate volatile regions with real-time geopolitical intelligence and automated compliance."</span>
                            </p>

                            {/* EMBEDDED WAITLIST FORM (Dark Mode) */}
                            <div className="pt-6 max-w-md">
                                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                    <div className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="work@company.com"
                                            className="h-12 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        <Button
                                            type="submit"
                                            className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold whitespace-nowrap"
                                            disabled={loading}
                                        >
                                            {loading ? '...' : 'Get Access'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                        Limited Release. No credit card required.
                                    </p>
                                </form>
                            </div>

                            <div className="pt-8 flex items-center gap-6 text-xs text-slate-500 font-mono">
                                <span>✅ NO "CALL FOR PRICING"</span>
                                <span>✅ INSTANT SETUP</span>
                            </div>
                        </div>

                        {/* Right: The Product (High Density UI Mock) */}
                        <div className="flex-1 w-full max-w-lg">
                            <InteractiveHero />
                        </div>

                    </div>
                </div>
            </div>

            {/* 2. FEATURE TILES */}
            <div className="py-20 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-6">

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:bg-slate-800/50 hover:border-slate-700 transition-all group">
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">💬</div>
                            <h3 className="text-lg font-bold text-white mb-2">Instant AI Quoting</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Generate accurate multi-modal quotes in seconds.
                                Factors in surcharges automatically.
                            </p>
                        </div>

                        <div className="bg-slate-900 border border-blue-900/30 p-6 rounded-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">📍</div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                GeoRisk Navigator™
                                <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">NEW</span>
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Predict delays before you book.
                                Real-time volatility scores (0-100) for global routes.
                            </p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:bg-slate-800/50 hover:border-slate-700 transition-all group">
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">⚠️</div>
                            <h3 className="text-lg font-bold text-white mb-2">Automated Compliance</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Automate KYC & AML checks. Onboard shippers in minutes, not days.
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            {/* 3. VALUE PROP */}
            <div className="py-20 bg-slate-900 border-y border-slate-800">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-10">Built for Operators. Not Slide Decks.</h2>

                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="flex gap-4">
                            <div className="text-emerald-400 text-xl">✅</div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Transparent SaaS Pricing</h4>
                                <p className="text-xs text-slate-400 mt-1">No hidden implementation fees. Pay monthly, cancel anytime.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-emerald-400 text-xl">✅</div>
                            <div>
                                <h4 className="font-bold text-white text-sm">API First</h4>
                                <p className="text-xs text-slate-400 mt-1">Connect to your existing TMS or CRM with our open documentation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default WaitlistPage;
