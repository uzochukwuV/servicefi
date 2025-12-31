const projects = [
  {
    title: "Urban Residence",
    location: "New York, 2024",
    category: "Residential",
    image: "/modern-minimalist-urban-residence-architecture-bla.jpg"
  },
  {
    title: "Cultural Center",
    location: "Berlin, 2023",
    category: "Public",
    image: "/contemporary-cultural-center-architecture-minimali.jpg"
  },
  {
    title: "Private Villa",
    location: "Los Angeles, 2024",
    category: "Residential",
    image: "/minimalist-private-villa-architecture-modern-black.jpg"
  },
  {
    title: "Office Complex",
    location: "Tokyo, 2023",
    category: "Commercial",
    image: "/modern-office-building-architecture-minimalist-bla.jpg"
  },
  {
    title: "Art Gallery",
    location: "London, 2022",
    category: "Cultural",
    image: "/contemporary-art-gallery-architecture-minimalist-b.jpg"
  },
  {
    title: "Waterfront Pavilion",
    location: "Copenhagen, 2023",
    category: "Public",
    image: "/waterfront-pavilion-architecture-minimalist-black-.jpg"
  }
]

export function Portfolio() {
  return (
    <section id="portfolio" className="py-20 md:py-32 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            Selected Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            A curated selection of projects spanning residential, commercial, and public architecture.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">
          {projects.map((project, index) => (
            <article key={index} className="group">
              <div className="aspect-[3/2] bg-muted mb-6 overflow-hidden">
                <img 
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-normal tracking-tight">
                    {project.title}
                  </h3>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {project.category}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {project.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
