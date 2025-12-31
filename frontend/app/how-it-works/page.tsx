import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HowItWorks() {
  return (
    <main className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-balance">How ServiceFi Works</h1>
          <p className="text-xl text-muted-foreground mb-16 text-pretty">
            A complete guide to understanding time-based, consumption-backed RealFi assets.
          </p>

          {/* The Problem */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-6">The Problem</h2>
            <Card className="p-8 border-2">
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Millions of service-based businesses struggle with cash flow despite having future revenue locked in
                  their service capacity.
                </p>
                <ul className="space-y-3 ml-6">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                    <span>They must pay rent, staff, and utilities upfront</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                    <span>Revenue arrives slowly over time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                    <span>Traditional loans are expensive or unavailable</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-accent mt-2 flex-shrink-0" />
                    <span>
                      Existing DeFi RWAs focus on invoices, real estate, or commodities—complex and inaccessible
                    </span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          {/* The Solution */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-6">The Solution</h2>
            <Card className="p-8 border-2 border-accent">
              <p className="text-lg leading-relaxed mb-6">
                ServiceFi turns future service delivery into a liquid, on-chain financial primitive.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Service providers mint <strong className="text-foreground">Service Credit Tokens</strong>—on-chain
                assets representing prepaid service units (e.g., 1 haircut, 1 gym day, 1 consultation). These tokens can
                be sold directly to customers, purchased by DeFi liquidity pools at a discount, or used as
                yield-generating RealFi instruments.
              </p>
            </Card>
          </div>

          {/* The Process */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8">The Process</h2>
            <div className="space-y-6">
              {[
                {
                  step: "01",
                  title: "Service Tokenization",
                  description:
                    "A business mints Service Credit Tokens corresponding to real services it offers. Each token includes a fixed price, expiration date, and redemption rules.",
                },
                {
                  step: "02",
                  title: "Liquidity Advance",
                  description:
                    "DeFi liquidity pools purchase these tokens at a discounted rate (e.g., 15% discount), providing the business with instant working capital.",
                },
                {
                  step: "03",
                  title: "Customer Redemption",
                  description:
                    "Customers purchase or receive tokens and redeem them by consuming the service in the real world. The redemption is verified on-chain.",
                },
                {
                  step: "04",
                  title: "Yield Realization",
                  description:
                    "When the service is delivered, the token is burned. The value difference between issuance discount and full redemption becomes yield for liquidity providers.",
                },
                {
                  step: "05",
                  title: "Risk Management",
                  description:
                    "Expired tokens naturally self-liquidate. No physical asset custody, no price oracles, no liquidation logistics required.",
                },
              ].map((item, idx) => (
                <Card key={idx} className="p-8 border-2 hover:border-accent transition-colors">
                  <div className="flex items-start gap-6">
                    <div className="text-4xl font-bold text-accent flex-shrink-0">{item.step}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Example Scenario */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-6">Example Scenario</h2>
            <Card className="p-8 border-2 bg-muted/50">
              <h3 className="text-xl font-bold mb-4">Hair Salon Case Study</h3>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Business:</strong> A hair salon needs $10,000 for rent and
                  payroll.
                </p>
                <p>
                  <strong className="text-foreground">Minting:</strong> They mint 200 tokens for haircuts, each
                  representing a $50 service.
                </p>
                <p>
                  <strong className="text-foreground">Liquidity:</strong> DeFi pool buys all 200 tokens at $42.50 each
                  (15% discount), providing $8,500 instant capital.
                </p>
                <p>
                  <strong className="text-foreground">Redemption:</strong> Customers purchase and redeem tokens over 90
                  days at face value ($50).
                </p>
                <p>
                  <strong className="text-foreground">Yield:</strong> LPs earn $1,500 profit (18% return) from the $7.50
                  spread per token.
                </p>
                <p className="pt-4 border-t border-border">
                  <strong className="text-foreground">Result:</strong> The salon gets working capital without debt.
                  Customers get discounted services. LPs earn real yield from economic activity.
                </p>
              </div>
            </Card>
          </div>

          {/* Why It's Different */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-6">Why This Is Different</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold mb-3 text-lg">Unlike Traditional RWAs</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                    <span>No physical inventory to store or ship</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                    <span>No reliance on external price feeds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                    <span>No legal enforcement complexity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                    <span>No speculative asset pricing</span>
                  </li>
                </ul>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold mb-3 text-lg">Unlike Typical DeFi</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                    <span>Yield comes from real service consumption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                    <span>Risk is bounded by time and expiration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                    <span>Capital flows directly into real economy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                    <span>Time-based, consumption-backed assets</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/marketplace">Explore the Marketplace</Link>
            </Button>
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
