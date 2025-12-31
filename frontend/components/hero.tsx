export function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] tracking-tight text-balance mb-8">
              Architecture that defines space and purpose
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              We design environments that balance function with form, creating structures that respond to their context and elevate human experience.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] bg-muted">
              <img 
                src="/modern-minimalist-architecture-building-exterior-b.jpg" 
                alt="Architecture"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
