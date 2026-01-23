import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Phone,
  User,
  Mail,
  CheckCircle,
  ArrowLeft,
  Briefcase,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VetVerificationBadge } from "@/components/vet/VetVerificationBadge";

interface VetProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  location: string | null;
  bio: string | null;
  specialization: string | null;
  license_number: string | null;
  profile_image_url: string | null;
  is_available: boolean | null;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
}

const VetProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [vet, setVet] = useState<VetProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVetProfile = async () => {
      if (!userId) return;

      try {
        // Fetch vet profile
        const { data: vetData, error: vetError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .eq("role", "veterinarian")
          .single();

        if (vetError) throw vetError;
        setVet(vetData);

        // Fetch portfolio items
        const { data: portfolioData, error: portfolioError } = await supabase
          .from("vet_portfolios")
          .select("*")
          .eq("vet_id", userId)
          .order("created_at", { ascending: false });

        if (portfolioError) throw portfolioError;
        setPortfolio(portfolioData || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load veterinarian profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVetProfile();
  }, [userId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <BackgroundVideo />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!vet) {
    return (
      <div className="min-h-screen flex flex-col">
        <BackgroundVideo />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Veterinarian Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The veterinarian profile you're looking for doesn't exist.
              </p>
              <Link to="/find-vets">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Find Vets
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundVideo />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          to="/find-vets"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Find Vets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarImage src={vet.profile_image_url || undefined} />
                  <AvatarFallback>
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-2xl font-bold">{vet.full_name}</h1>

                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                  {vet.license_number && (
                    <VetVerificationBadge licenseNumber={vet.license_number} />
                  )}
                  {vet.is_available && (
                    <Badge className="bg-success text-success-foreground">
                      Available
                    </Badge>
                  )}
                </div>

                {vet.specialization && (
                  <p className="text-muted-foreground mt-2">{vet.specialization}</p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {vet.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{vet.location}</span>
                  </div>
                )}
                {vet.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{vet.phone_number}</span>
                  </div>
                )}
              </div>

              {vet.bio && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm text-muted-foreground">{vet.bio}</p>
                </div>
              )}

              <div className="mt-6">
                <Link to="/consultation/new">
                  <Button className="w-full">Request Consultation</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Portfolio & Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {portfolio.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No portfolio items yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolio.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        {item.image_url && (
                          <div className="aspect-video">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold">{item.title}</h4>
                            {item.category && (
                              <Badge variant="outline">{item.category}</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {item.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VetProfilePage;
