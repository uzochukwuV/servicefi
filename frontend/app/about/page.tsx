import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function About() {
  return (
    <main className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 text-balance">About ServiceFi</h1>
          <p className="text-xl text-muted-foreground mb-16 text-pretty">
            Building the future where time, access, and labor are liquid financial assets.
          </p>

          {/* Vision */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
            <Card className="p-8 border-2">
              <p className="text-lg leading-relaxed mb-4">ServiceFi lays the foundation for a future where:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                  <span>Time, access, and labor are liquid financial assets</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                  <span>Small businesses fund themselves without banks</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                  <span>DeFi capital directly powers everyday services</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                  <span>Real economic activity becomes composable on-chain</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Why Mantle */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Built on Mantle</h2>
            <Card className="p-8 border-2 border-accent">
              <p className="text-lg leading-relaxed mb-4">ServiceFi is built on Mantle Network because:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Low transaction costs</strong> enable micro-value services to be
                    economically viable
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">High throughput</strong> supports high-frequency redemption and
                    minting
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">RealFi focus</strong> aligns with service-based economies and
                    real-world utility
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Real-world adoption</strong> beyond speculation
                  </span>
                </li>
              </ul>
            </Card>
          </div>

          {/* One-Line Thesis */}
          <div className="mb-16">
            <Card className="p-12 border-2 text-center bg-muted/50">
              <div className="text-sm text-muted-foreground mb-2">One-Line Thesis</div>
              <h2 className="text-3xl font-bold text-balance">
                ServiceFi turns future services into instant liquidity—unlocking real yield from real work.
              </h2>
            </Card>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What happens if a service is not redeemed?",
                  a: "Tokens have built-in expiration dates. Unredeemed tokens automatically expire and self-liquidate, returning the discount value to the liquidity pool. This natural mechanism eliminates complex enforcement.",
                },
                {
                  q: "How is service redemption verified?",
                  a: "Businesses verify redemption through their point-of-sale systems integrated with our smart contracts. The token is burned on-chain when the service is delivered, creating an immutable record.",
                },
                {
                  q: "What protects liquidity providers from business default?",
                  a: "Risk is diversified across multiple businesses and service types. Each token is time-bounded, limiting exposure. Additionally, businesses undergo verification and maintain reputation scores based on redemption rates.",
                },
                {
                  q: "Can I resell service tokens?",
                  a: "Yes, tokens are fully transferable and can be traded on secondary markets. This creates additional liquidity for both customers and investors.",
                },
                {
                  q: "How do you prevent fake services or fraud?",
                  a: "Businesses must complete a verification process including proof of business registration, location verification, and track record review. Ongoing monitoring tracks redemption rates and customer reviews.",
                },
                {
                  q: "What types of services work best?",
                  a: "Services with predictable demand, established customer bases, and clear redemption mechanics work best. Personal services, recurring memberships, and professional consultations are ideal categories.",
                },
              ].map((faq, idx) => (
                <Card key={idx} className="p-6 border-2">
                  <h3 className="font-bold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
              <p className="text-muted-foreground">Join the ServiceFi ecosystem today.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/marketplace">Browse Services</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/business">List Your Business</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © 2025 ServiceFi. Built on Mantle Network.
        </div>
      </footer>
    </main>
  )
}
