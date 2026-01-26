import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, PawPrint, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorHandling";
import { useLanguage } from "@/contexts/LanguageContext";

type Consultation = {
  id: string;
  subject: string;
  status: string;
  urgency_level: string;
  created_at: string;
  vet_id: string | null;
};

type Animal = {
  id: string;
  name: string | null;
  animal_type: string;
  breed: string | null;
};

const FarmerDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth/login");
        return;
      }

      fetchDashboardData(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const fetchDashboardData = async (userId: string) => {
    try {
      const [consultationsRes, animalsRes] = await Promise.all([
        supabase
          .from("consultations")
          .select("*")
          .eq("farmer_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("animals").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
      ]);

      if (consultationsRes.error) throw consultationsRes.error;
      if (animalsRes.error) throw animalsRes.error;

      setConsultations(consultationsRes.data || []);
      setAnimals(animalsRes.data || []);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: getUserFriendlyError(error, "dashboard_load"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      in_progress: "bg-info text-info-foreground",
      completed: "bg-success text-success-foreground",
      cancelled: "bg-muted text-muted-foreground",
    };

    const statusLabels: Record<string, string> = {
      pending: t("status.pending"),
      in_progress: t("status.inProgress"),
      completed: t("status.completed"),
      cancelled: t("status.cancelled"),
    };

    return (
      <Badge className={statusColors[status] || "bg-muted"}>
        {statusLabels[status] || status.replace("_", " ")}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyColors: Record<string, string> = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-info text-info-foreground",
      high: "bg-warning text-warning-foreground",
      emergency: "bg-destructive text-destructive-foreground",
    };

    const urgencyLabels: Record<string, string> = {
      low: t("urgency.low"),
      medium: t("urgency.medium"),
      high: t("urgency.high"),
      emergency: t("urgency.emergency"),
    };

    return <Badge className={urgencyColors[urgency] || "bg-muted"}>{urgencyLabels[urgency] || urgency}</Badge>;
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

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundVideo />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("farmerDashboard.title")}</h1>
          <p className="text-muted-foreground">{t("farmerDashboard.subtitle")}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/consultation/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  {t("farmerDashboard.requestConsultation")}
                </CardTitle>
                <CardDescription>{t("farmerDashboard.requestConsultationDesc")}</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/animals">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-secondary" />
                  {t("farmerDashboard.manageAnimals")}
                </CardTitle>
                <CardDescription>{t("farmerDashboard.manageAnimalsDesc")}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-primary">{animals.length}</CardTitle>
              <CardDescription>{t("farmerDashboard.totalAnimals")}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-secondary">
                {consultations.filter((c) => c.status === "pending").length}
              </CardTitle>
              <CardDescription>{t("farmerDashboard.pendingConsultations")}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-success">
                {consultations.filter((c) => c.status === "completed").length}
              </CardTitle>
              <CardDescription>{t("farmerDashboard.completedConsultations")}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Consultations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {t("farmerDashboard.recentConsultations")}
            </CardTitle>
            <CardDescription>{t("farmerDashboard.recentConsultationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("farmerDashboard.noConsultations")}</p>
                <Link to="/consultation/new">
                  <Button>{t("farmerDashboard.firstConsultation")}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{consultation.subject}</h3>
                      <div className="flex gap-2">
                        {getUrgencyBadge(consultation.urgency_level)}
                        {getStatusBadge(consultation.status)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("farmerDashboard.created")}: {new Date(consultation.created_at).toLocaleDateString()}
                    </p>
                    <Link to={`/consultation/${consultation.id}`}>
                      <Button variant="outline" size="sm">
                        {t("farmerDashboard.viewDetails")}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FarmerDashboard;
