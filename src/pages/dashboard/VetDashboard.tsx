import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, CheckCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VetVerificationBadge } from "@/components/vet/VetVerificationBadge";
import { getUserFriendlyError } from "@/lib/errorHandling";
import { useVetPresence } from "@/hooks/useVetPresence";

type Consultation = {
  id: string;
  subject: string;
  status: string;
  urgency_level: string;
  created_at: string;
  farmer_id: string;
  description: string;
};

const VetDashboard = () => {
  const [pendingConsultations, setPendingConsultations] = useState<Consultation[]>([]);
  const [myConsultations, setMyConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [vetProfile, setVetProfile] = useState<{ id: string; user_id: string; full_name: string; license_number: string | null; specialization: string | null; latitude: number | null; longitude: number | null } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackVetPresence, channel } = useVetPresence();

  // Track vet presence when they're on the dashboard
  useEffect(() => {
    if (vetProfile && channel) {
      trackVetPresence({
        id: vetProfile.id,
        user_id: vetProfile.user_id,
        full_name: vetProfile.full_name,
        latitude: vetProfile.latitude,
        longitude: vetProfile.longitude,
      });
    }
  }, [vetProfile, channel, trackVetPresence]);

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
      const [pendingRes, myRes, profileRes] = await Promise.all([
        // For pending consultations, fetch limited data to protect privacy
        supabase
          .from("consultations")
          .select("id, urgency_level, created_at, status, animal_id")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        // For assigned consultations, fetch full details
        supabase
          .from("consultations")
          .select("*")
          .eq("vet_id", userId)
          .order("created_at", { ascending: false }),
        // Fetch vet profile with location data for presence tracking
        supabase
          .from("profiles")
          .select("id, user_id, full_name, license_number, specialization, latitude, longitude")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (pendingRes.error) throw pendingRes.error;
      if (myRes.error) throw myRes.error;

      // For pending consultations, add placeholder data
      const pendingWithLimitedInfo = (pendingRes.data || []).map(consultation => ({
        ...consultation,
        subject: consultation.urgency_level === 'emergency' 
          ? 'Emergency case - immediate attention needed'
          : 'Consultation request pending',
        description: 'Details will be available after accepting the consultation',
        farmer_id: '',
      }));

      setPendingConsultations(pendingWithLimitedInfo as Consultation[]);
      setMyConsultations(myRes.data || []);
      setVetProfile(profileRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "dashboard_load"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConsultation = async (consultationId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // Optimistic locking: only update if vet_id is still null
      const { data, error } = await supabase
        .from("consultations")
        .update({
          vet_id: session.user.id,
          status: "in_progress",
        })
        .eq("id", consultationId)
        .is("vet_id", null) // Critical: only update unassigned consultations
        .select()
        .single();

      // If no data returned, another vet already accepted this consultation
      if (!data) {
        toast({
          title: "Consultation Unavailable",
          description: "This consultation was already accepted by another veterinarian",
          variant: "destructive",
        });
        // Refresh to remove from pending list
        fetchDashboardData(session.user.id);
        return;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: "Consultation accepted successfully",
      });

      // Refresh data
      fetchDashboardData(session.user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept consultation",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      in_progress: "bg-info text-info-foreground",
      completed: "bg-success text-success-foreground",
      cancelled: "bg-muted text-muted-foreground",
    };

    return (
      <Badge className={statusColors[status] || "bg-muted"}>
        {status.replace("_", " ")}
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

    return <Badge className={urgencyColors[urgency] || "bg-muted"}>{urgency}</Badge>;
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
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Veterinarian Dashboard</h1>
              <p className="text-muted-foreground">Manage consultations and help farmers</p>
            </div>
            {vetProfile && (
              <VetVerificationBadge
                licenseNumber={vetProfile.license_number}
                specialization={vetProfile.specialization}
              />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-warning">
                {pendingConsultations.length}
              </CardTitle>
              <CardDescription>Pending Consultations</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-info">
                {myConsultations.filter((c) => c.status === "in_progress").length}
              </CardTitle>
              <CardDescription>In Progress</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-success">
                {myConsultations.filter((c) => c.status === "completed").length}
              </CardTitle>
              <CardDescription>Completed</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Consultations Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="my-cases" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              My Cases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Available Consultations</CardTitle>
                <CardDescription>Accept consultations to start helping farmers</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingConsultations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending consultations at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingConsultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{consultation.subject}</h3>
                          {getUrgencyBadge(consultation.urgency_level)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {consultation.description?.substring(0, 150)}...
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Requested: {new Date(consultation.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptConsultation(consultation.id)}
                            size="sm"
                          >
                            Accept Case to View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-cases">
            <Card>
              <CardHeader>
                <CardTitle>My Consultations</CardTitle>
                <CardDescription>Consultations you're currently managing</CardDescription>
              </CardHeader>
              <CardContent>
                {myConsultations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">You haven't accepted any consultations yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myConsultations.map((consultation) => (
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
                          Started: {new Date(consultation.created_at).toLocaleDateString()}
                        </p>
                        <Link to={`/consultation/${consultation.id}`}>
                          <Button variant="outline" size="sm">
                            Manage Case
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default VetDashboard;