import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Smartphone, Users, Clock, Shield, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-hover to-secondary py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:32px_32px] [mask-image:radial-gradient(white,transparent_70%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Professional Veterinary Care, Accessible from Anywhere
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Connect with licensed veterinarians instantly. Get expert advice for your livestock
              and pets through our mobile and online consultation platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/auth/register?role=veterinarian">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Join as Veterinarian
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose VetConnect?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bridging the gap between rural farmers and professional veterinary care through
              technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Mobile-First Design</CardTitle>
                <CardDescription>
                  Access veterinary care from your smartphone, even in areas with limited internet
                  connectivity
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-secondary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Licensed Professionals</CardTitle>
                <CardDescription>
                  Connect with verified, licensed veterinarians who understand local animal health
                  challenges
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-accent/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>24/7 Availability</CardTitle>
                <CardDescription>
                  Get urgent consultations anytime, anywhere. Never let distance delay critical
                  animal care
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your animal health records and consultations are protected with bank-level
                  security
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-success/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Track Health Records</CardTitle>
                <CardDescription>
                  Maintain comprehensive health records for all your animals in one secure
                  location
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-secondary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Stethoscope className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Follow-Up Care</CardTitle>
                <CardDescription>
                  Receive follow-up consultations and treatment monitoring from your veterinarian
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get veterinary care in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-muted-foreground">
                Sign up as a farmer or pet owner. Add your animals' information to get started.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Submit Consultation</h3>
              <p className="text-muted-foreground">
                Describe your animal's symptoms, upload photos, and select urgency level.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Expert Care</h3>
              <p className="text-muted-foreground">
                Receive diagnosis and treatment plan from a licensed veterinarian.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers and pet owners who trust VetConnect for their animal health
            needs
          </p>
          <Link to="/auth/register">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
            >
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;