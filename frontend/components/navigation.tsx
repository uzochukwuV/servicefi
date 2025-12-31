"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WalletConnect } from "@/components/wallet-connect"
import { useState } from "react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight">
            ServiceFi
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="/how-it-works" className="text-sm hover:text-accent transition-colors">
              How It Works
            </Link>
            <Link href="/marketplace" className="text-sm hover:text-accent transition-colors">
              Marketplace
            </Link>
            <Link href="/orderbook" className="text-sm hover:text-accent transition-colors">
              Order Book
            </Link>
            <Link href="/about" className="text-sm hover:text-accent transition-colors">
              About
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/business">For Business</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/customer">For Customers</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/investor">For Investors</Link>
            </Button>
            <WalletConnect />
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            <Link href="/" className="block py-2 text-sm hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="/how-it-works" className="block py-2 text-sm hover:text-accent transition-colors">
              How It Works
            </Link>
            <Link href="/marketplace" className="block py-2 text-sm hover:text-accent transition-colors">
              Marketplace
            </Link>
            <Link href="/orderbook" className="block py-2 text-sm hover:text-accent transition-colors">
              Order Book
            </Link>
            <Link href="/about" className="block py-2 text-sm hover:text-accent transition-colors">
              About
            </Link>
            <div className="pt-3 space-y-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link href="/business">For Business</Link>
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link href="/customer">For Customers</Link>
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link href="/investor">For Investors</Link>
              </Button>
              <div className="w-full">
                <WalletConnect />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
