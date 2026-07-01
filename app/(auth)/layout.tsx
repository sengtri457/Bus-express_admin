export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel: Cover Image (Hidden on mobile/tablet) */}
      <div 
        className="hidden lg:flex lg:w-7/12 relative bg-zinc-950 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/assets/images/conductorBus.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-16 text-white h-full w-full">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-300">
              BusExpress Platform
            </p>
          </div>
          
          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Streamline Your Fleet & Passenger Operations
            </h2>
            <p className="text-zinc-300 text-lg leading-relaxed">
              Real-time GPS tracking, smart dispatching, automated scheduling, and operator-ready tools designed for modern transit.
            </p>
          </div>
          
          <div className="text-xs text-zinc-400">
            © {new Date().getFullYear()} BusExpress Admin. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel: Content Form */}
      <div className="flex w-full lg:w-5/12 flex-col justify-center px-8 py-12 sm:px-16 lg:px-20 bg-white">
        <div className="mx-auto w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
