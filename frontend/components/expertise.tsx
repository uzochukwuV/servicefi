const services = [
  {
    number: "01",
    title: "Architectural Design",
    description: "Comprehensive design solutions from concept through construction documentation, with attention to detail and spatial relationships."
  },
  {
    number: "02",
    title: "Urban Planning",
    description: "Strategic development of urban environments that consider community needs, sustainability, and long-term growth."
  },
  {
    number: "03",
    title: "Interior Architecture",
    description: "Thoughtful interior spaces that extend architectural principles inward, creating cohesive and functional environments."
  },
  {
    number: "04",
    title: "Project Management",
    description: "End-to-end oversight ensuring projects are delivered on time, within budget, and to the highest standards."
  }
]

export function Expertise() {
  return (
    <section id="expertise" className="py-20 md:py-32 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-5">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6 sticky top-32">
              Expertise
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Our practice encompasses a range of architectural services, each approached with rigor and creative insight.
            </p>
          </div>
          
          <div className="lg:col-span-7">
            <div className="space-y-12">
              {services.map((service, index) => (
                <div 
                  key={index}
                  className="pb-12 border-b border-border last:border-0"
                >
                  <div className="flex gap-8">
                    <span className="text-sm text-muted-foreground font-mono mt-1">
                      {service.number}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-2xl font-normal tracking-tight mb-4">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
