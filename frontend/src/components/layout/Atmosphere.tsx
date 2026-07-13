export function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-grid-fade opacity-70" />
      <div className="absolute inset-0 bg-noise mix-blend-overlay" />
      <div className="aurora-orb absolute -left-24 top-10 h-[28rem] w-[28rem] animate-orb-drift bg-accent-indigo/25" />
      <div className="aurora-orb absolute -right-16 top-40 h-[22rem] w-[22rem] animate-orb-drift-delayed bg-accent-cyan/20" />
      <div className="aurora-orb absolute bottom-10 left-1/3 h-[18rem] w-[18rem] animate-orb-pulse bg-accent-indigo/15" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />
    </div>
  );
}
