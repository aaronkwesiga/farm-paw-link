import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MessagingPanel } from "@/components/consultation/MessagingPanel";

type Consultation = {
  id: string;
  subject: string;
  description: string;
  symptoms: string | null;
  status: string;
  urgency_level: string;
  created_at: string;
  farmer_id: string;
  vet_id: string | null;
  animal_id: string;
  diagnosis: string | null;
  treatment_plan: string | null;
  follow_up_notes: string | null;
  image_urls: string[] | null;
};

const ConsultationDetail = () => {
  const { id } = useParams();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth/login");
      return;
    }

    const { data: consultData, error: consultError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", id)
      .single();

    if (consultError) {
      toast({
        title: "Error",
        description: "Failed to load consultation",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setConsultation(consultData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <BackgroundVideo />
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!consultation) return null;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      in_progress: "bg-info text-info-foreground",
      completed: "bg-success text-success-foreground",
      cancelled: "bg-muted text-muted-foreground",
    };
    return <Badge className={colors[status] || "bg-muted"}>{status.replace("_", " ")}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-info text-info-foreground",
      high: "bg-warning text-warning-foreground",
      emergency: "bg-destructive text-destructive-foreground",
    };
    return <Badge className={colors[urgency] || "bg-muted"}>{urgency}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundVideo />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{consultation.subject}</CardTitle>
                  <CardDescription>
                    Requested on {new Date(consultation.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {getUrgencyBadge(consultation.urgency_level)}
                  {getStatusBadge(consultation.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{consultation.description}</p>
              </div>
              {consultation.symptoms && (
                <div>
                  <h3 className="font-semibold mb-2">Symptoms</h3>
                  <p className="text-muted-foreground">{consultation.symptoms}</p>
                </div>
              )}
              {consultation.image_urls && consultation.image_urls.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {consultation.image_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Consultation ${idx + 1}`}
                        className="rounded-lg w-full h-48 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <MessagingPanel consultationId={id!} />

          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConsultationDetail;
