import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Calendar, FileText, Video, Clock, Shield } from "lucide-react";

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Video,
      title: "Virtual Consultations",
      description: "Connect with licensed veterinarians through secure video calls for immediate guidance on animal health concerns."
    },
    {
      icon: Calendar,
      title: "Appointment Scheduling",
      description: "Book and manage appointments with veterinarians at times that work best for your farm operations."
    },
    {
      icon: FileText,
      title: "Health Records Management",
      description: "Maintain comprehensive digital health records for all your animals in one secure, accessible location."
    },
    {
      icon: Stethoscope,
      title: "Emergency Support",
      description: "Access urgent veterinary advice when you need it most, helping you make critical decisions quickly."
    },
    {
      icon: Clock,
      title: "Follow-up Care",
      description: "Receive ongoing support and monitoring for animals undergoing treatment or recovery."
    },
    {
      icon: Shield,
      title: "Preventive Care Plans",
      description: "Work with veterinarians to develop customized preventive care strategies for your livestock."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundVideo />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Our Services</h1>
          <p className="text-center text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
            Comprehensive veterinary care solutions designed for modern farming operations
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {services.map((service, index) => (
              <div key={index} className="flex flex-col gap-4 p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join VetConnect today and give your animals the professional care they deserve
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/auth/register")} size="lg">
                Sign Up Now
              </Button>
              <Button onClick={() => navigate("/how-it-works")} variant="outline" size="lg">
                Learn How It Works
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
