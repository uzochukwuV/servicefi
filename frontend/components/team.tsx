const team = [
  {
    name: "Sarah Mitchell",
    role: "Principal Architect",
    credentials: "AIA, LEED AP",
    image: "/professional-architect-portrait-black-and-white.jpg"
  },
  {
    name: "David Chen",
    role: "Senior Architect",
    credentials: "AIA, RIBA",
    image: "/professional-architect-portrait-black-and-white-ma.jpg"
  },
  {
    name: "Elena Rodriguez",
    role: "Design Director",
    credentials: "AIA",
    image: "/professional-architect-portrait-black-and-white-fe.jpg"
  },
  {
    name: "Marcus Johnson",
    role: "Project Manager",
    credentials: "PMP, LEED AP",
    image: "/professional-architect-portrait-black-and-white-ma.jpg"
  }
]

export function Team() {
  return (
    <section id="team" className="py-20 md:py-32 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            Team
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            A collaborative practice built on diverse expertise and shared commitment to design excellence.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {team.map((member, index) => (
            <div key={index}>
              <div className="aspect-square bg-muted mb-6">
                <img 
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-normal tracking-tight">
                  {member.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {member.role}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {member.credentials}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
