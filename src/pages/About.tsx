import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Users, Shield, Target } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Heart,
      title: "Animal Welfare",
      description: "We're dedicated to improving the health and well-being of animals through accessible veterinary care."
    },
    {
      icon: Users,
      title: "Community First",
      description: "Connecting farmers and veterinarians to build a stronger, more supportive agricultural community."
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description: "Your data and your animals' health records are protected with enterprise-grade security."
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Leveraging technology to make veterinary care more efficient and accessible for everyone."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">About VetConnect</h1>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Bridging the gap between farmers and veterinary professionals
          </p>

          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-muted-foreground">
              VetConnect was created to address the challenges farmers face in accessing timely veterinary care for their animals. 
              Our platform connects farmers directly with licensed veterinarians, making it easier to manage animal health records, 
              schedule consultations, and receive expert guidance when it matters most.
            </p>
            <p className="text-muted-foreground">
              Whether you're managing a small farm or a large agricultural operation, VetConnect provides the tools you need to 
              keep your animals healthy and your operations running smoothly.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-center mb-8">Our Core Values</h2>
          
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            {values.map((value, index) => (
              <div key={index} className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
            <p className="text-muted-foreground mb-6">
              Be part of the solution to better animal healthcare
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/auth/register")} size="lg">
                Get Started
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

export default About;
