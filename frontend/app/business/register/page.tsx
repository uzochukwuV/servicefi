'use client';

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBusinessRegistration } from "@/hooks/useBusinessRegistration"
import { useAccount } from "wagmi"
import { useState } from "react"
import { toast } from "sonner"

export default function BusinessRegister() {
  const { address, isConnected } = useAccount();
  const { registerBusiness, isRegistered, isLoading } = useBusinessRegistration();
  const [formData, setFormData] = useState({
    name: '',
    businessType: 'Personal Services',
    registrationNumber: '',
    address: '',
    phone: '',
    email: '',
  });
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!agreed) {
      toast.error('Please agree to the terms');
      return;
    }

    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await registerBusiness(formData);
      toast.success('Registration submitted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  if (isRegistered) {
    return (
      <main className="min-h-screen bg-muted/30">
        <Navigation />
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Already Registered</h1>
              <p className="text-muted-foreground mb-6">
                Your business is already registered as a service provider.
              </p>
              <Button 
                onClick={() => window.location.href = '/business'}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Go to Dashboard
              </Button>
            </Card>
          </div>
        </section>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-muted/30">
      <Navigation />

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Business Registration</h1>
            <p className="text-muted-foreground">Complete verification to start tokenizing your services</p>
          </div>

          <Card className="p-8 border-2">
            <div className="space-y-8">
              {/* Business Information */}
              <div>
                <h2 className="text-xl font-bold mb-4">Business Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Name</label>
                    <input
                      type="text"
                      placeholder="Elite Hair Studio"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-input bg-background"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Business Type</label>
                      <select 
                        value={formData.businessType}
                        onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                        className="w-full px-4 py-2 border border-input bg-background"
                      >
                        <option>Personal Services</option>
                        <option>Professional Services</option>
                        <option>Fitness & Wellness</option>
                        <option>Business Services</option>
                        <option>Local Services</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Registration Number</label>
                      <input
                        type="text"
                        placeholder="123456789"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Address</label>
                    <input
                      type="text"
                      placeholder="123 Main St, City, State, ZIP"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-2 border border-input bg-background"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="contact@business.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Documents */}
              <div className="pt-8 border-t border-border">
                <h2 className="text-xl font-bold mb-4">Verification Documents</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Registration Certificate</label>
                    <div className="border-2 border-dashed border-border p-8 text-center hover:border-accent transition-colors cursor-pointer">
                      <div className="text-sm text-muted-foreground">Click to upload or drag and drop</div>
                      <div className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Proof of Address</label>
                    <div className="border-2 border-dashed border-border p-8 text-center hover:border-accent transition-colors cursor-pointer">
                      <div className="text-sm text-muted-foreground">Click to upload or drag and drop</div>
                      <div className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Owner ID Verification</label>
                    <div className="border-2 border-dashed border-border p-8 text-center hover:border-accent transition-colors cursor-pointer">
                      <div className="text-sm text-muted-foreground">Click to upload or drag and drop</div>
                      <div className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Connection */}
              <div className="pt-8 border-t border-border">
                <h2 className="text-xl font-bold mb-4">Wallet Setup</h2>
                <Card className="p-6 bg-muted/50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">Connect Your Business Wallet</div>
                      <div className="text-sm text-muted-foreground mb-4">
                        This wallet will receive liquidity from token minting and manage redemptions
                      </div>
                      {!isConnected ? (
                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                          Connect Wallet
                        </Button>
                      ) : (
                        <div className="text-sm text-accent">
                          ✓ Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Terms */}
              <div className="pt-8 border-t border-border">
                <div className="flex items-start gap-3 mb-6">
                  <input 
                    type="checkbox" 
                    className="mt-1" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <label className="text-sm text-muted-foreground">
                    I confirm that all information provided is accurate and I agree to ServiceFi's{" "}
                    <span className="text-accent hover:underline cursor-pointer">Terms of Service</span> and{" "}
                    <span className="text-accent hover:underline cursor-pointer">Business Agreement</span>
                  </label>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleSubmit}
                  disabled={isLoading || !isConnected || !agreed}
                >
                  {isLoading ? 'Registering...' : 'Submit for Verification'}
                </Button>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Verification typically takes 1-2 business days
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  )
}
