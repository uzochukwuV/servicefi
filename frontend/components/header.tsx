export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <div className="text-xl font-medium tracking-tight">
            STUDIO
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <a href="#portfolio" className="text-sm uppercase tracking-wider hover:text-muted-foreground transition-colors">
              Portfolio
            </a>
            <a href="#expertise" className="text-sm uppercase tracking-wider hover:text-muted-foreground transition-colors">
              Expertise
            </a>
            <a href="#team" className="text-sm uppercase tracking-wider hover:text-muted-foreground transition-colors">
              Team
            </a>
            <a href="#contact" className="text-sm uppercase tracking-wider hover:text-muted-foreground transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
