import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FAQ = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "What is VetConnect?",
      answer: "VetConnect is a platform that connects farmers with licensed veterinarians for remote consultations, health record management, and ongoing animal care support."
    },
    {
      question: "How do I schedule a consultation?",
      answer: "Once you're registered and logged in, navigate to the 'New Consultation' section from your dashboard. Select a veterinarian, choose a time slot, and provide details about your animal's condition."
    },
    {
      question: "Are the veterinarians licensed?",
      answer: "Yes, all veterinarians on our platform are fully licensed and verified professionals with experience in livestock and farm animal care."
    },
    {
      question: "What types of animals can I get help with?",
      answer: "VetConnect supports all types of farm animals including cattle, horses, sheep, goats, pigs, and poultry. Our veterinarians have expertise across various species."
    },
    {
      question: "How much does a consultation cost?",
      answer: "Consultation fees vary by veterinarian and service type. You'll see the pricing before booking. Most virtual consultations range from $50-$150 depending on complexity and duration."
    },
    {
      question: "Can I access my animal's health records?",
      answer: "Yes! All health records, consultation notes, and treatment plans are stored securely in your account and can be accessed anytime from the Animals Management section."
    },
    {
      question: "What if I need emergency help?",
      answer: "For true emergencies, always call your local emergency veterinary service first. VetConnect can provide guidance for urgent but non-critical situations through our priority consultation feature."
    },
    {
      question: "How do video consultations work?",
      answer: "Video consultations are conducted through our secure platform. You'll receive a link to join the video call at your scheduled appointment time. Make sure you have a good internet connection and can show the veterinarian your animal."
    },
    {
      question: "Can I get a second opinion?",
      answer: "Absolutely. You can consult with multiple veterinarians on our platform. Your health records are available to any vet you choose to consult with."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security seriously. All information is encrypted and stored securely. We comply with industry standards for healthcare data protection."
    },
    {
      question: "Do you offer follow-up care?",
      answer: "Yes, veterinarians can schedule follow-up consultations to monitor your animal's progress and adjust treatment plans as needed."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and digital payment methods. Payment is processed securely at the time of booking."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundVideo />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Frequently Asked Questions</h1>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Find answers to common questions about VetConnect
          </p>

          <Accordion type="single" collapsible className="w-full mb-12">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="bg-primary/5 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help you
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/contact")} size="lg">
                Contact Us
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

export default FAQ;
