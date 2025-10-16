import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-muted-foreground">
                VetConnect ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
                  <p className="text-muted-foreground">
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Name, email address, and contact information</li>
                    <li>Account credentials</li>
                    <li>Farm location and property details</li>
                    <li>Payment information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Animal Health Information</h3>
                  <p className="text-muted-foreground">
                    Information about your animals' health, including medical records, treatment plans, and consultation notes.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Usage Information</h3>
                  <p className="text-muted-foreground">
                    We automatically collect information about how you interact with our platform, including device information, 
                    IP addresses, and usage patterns.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Connect you with veterinarians</li>
                <li>Process your transactions</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Ensure the security and integrity of our platform</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
              <p className="text-muted-foreground mb-2">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Veterinarians you choose to consult with</li>
                <li>Service providers who assist in operating our platform</li>
                <li>Law enforcement when required by law</li>
                <li>Other parties with your consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your information against unauthorized access, 
                alteration, disclosure, or destruction. All data is encrypted in transit and at rest.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
              <p className="text-muted-foreground mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. 
                Health records are maintained in accordance with applicable veterinary record-keeping requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not directed to individuals under 18 years of age. We do not knowingly collect information 
                from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: privacy@vetconnect.com<br />
                Phone: +1 (555) 123-4567
              </p>
            </section>
          </div>

          <div className="mt-12 text-center">
            <Button onClick={() => navigate("/")} size="lg">
              Back to Home
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
