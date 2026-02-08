import { InstantQuoteWidget } from "@/components/widgets/InstantQuoteWidget";

export const InteractiveHero = () => {
    return (
        <div className="relative w-full h-[600px] bg-[#0B1026] rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Premium Animated Background (Non-WebGL replacement for Mapbox) */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Simulated Data Streams / Routes */}
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent w-full animate-data-flow"
                            style={{
                                top: `${20 + (i * 15)}%`,
                                left: '-100%',
                                animationDelay: `${i * 1.5}s`,
                                animationDuration: `${5 + (i * 2)}s`
                            }}
                        />
                    ))}
                </div>

                {/* Decorative Glowing Orbs */}
                <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Overlay UI: Quote Search */}
            <div className="absolute top-6 left-6 z-10 w-full p-4 sm:p-0">
                <InstantQuoteWidget />
            </div>

            <style>{`
                @keyframes dataFlow {
                    0% { left: -100%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }
                .animate-data-flow {
                    animation: dataFlow linear infinite;
                }
            `}</style>
        </div>
    );
};
