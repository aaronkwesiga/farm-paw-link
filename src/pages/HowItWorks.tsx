import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, MessageSquare, Calendar, Stethoscope } from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Users,
      title: "Create Your Account",
      description: "Sign up as a farmer or veterinarian to get started with VetConnect."
    },
    {
      icon: Calendar,
      title: "Manage Your Animals",
      description: "Keep track of your livestock with detailed animal profiles and health records."
    },
    {
      icon: MessageSquare,
      title: "Request Consultation",
      description: "Easily connect with veterinarians for expert advice and consultations."
    },
    {
      icon: Stethoscope,
      title: "Get Expert Care",
      description: "Receive professional veterinary guidance to keep your animals healthy."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">How It Works</h1>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            VetConnect makes it easy to manage your animals and connect with veterinary professionals
          </p>

          <div className="grid gap-8 md:grid-cols-2 mb-12">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">
              Join VetConnect today and experience seamless animal healthcare management
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/auth/register")} size="lg">
                Sign Up Now
              </Button>
              <Button onClick={() => navigate("/")} variant="outline" size="lg">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
