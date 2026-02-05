import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, User, Search, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useVetPresence } from "@/hooks/useVetPresence";
import VetMap from "@/components/vet/VetMap";
import OnlineIndicator from "@/components/vet/OnlineIndicator";

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
  latitude: number | null;
  longitude: number | null;
  is_available: boolean | null;
}

const FindVets = () => {
  const [vets, setVets] = useState<VetProfile[]>([]);
  const [filteredVets, setFilteredVets] = useState<VetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVet, setSelectedVet] = useState<VetProfile | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isVetOnline, getOnlineVetData } = useVetPresence();

  const handleSelectVet = (vet: VetProfile) => {
    setSelectedVet(vet);
  };

  const fetchVets = useCallback(async () => {
    try {
      // Use the secure function that only returns public vet data
      // (excludes phone_number and license_number for privacy)
      const { data, error } = await supabase
        .rpc("get_public_vet_profiles");

      if (error) throw error;
      
      // Map the response to include null for sensitive fields
      const safeVets = (data || []).map((vet: any) => ({
        ...vet,
        phone_number: null, // Not exposed publicly
        license_number: null, // Not exposed publicly
      }));
      
      setVets(safeVets);
      setFilteredVets(safeVets);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: t("findVets.failedToLoad"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchVets();
  }, [fetchVets]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVets(vets);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredVets(
        vets.filter(
          (vet) =>
            vet.full_name.toLowerCase().includes(query) ||
            vet.location?.toLowerCase().includes(query) ||
            vet.specialization?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, vets]);

  // Sort vets: online first, then by name
  const sortedVets = [...filteredVets].sort((a, b) => {
    const aOnline = isVetOnline(a.user_id);
    const bOnline = isVetOnline(b.user_id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const vetsWithLocation = sortedVets.filter(
    (vet) => vet.latitude !== null && vet.longitude !== null
  );

  // Get real-time location for online vets
  const getVetLocation = (vet: VetProfile) => {
    const onlineData = getOnlineVetData(vet.user_id);
    if (onlineData?.latitude && onlineData?.longitude) {
      return { lat: onlineData.latitude, lng: onlineData.longitude };
    }
    return vet.latitude && vet.longitude ? { lat: vet.latitude, lng: vet.longitude } : null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundVideo />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("findVets.title")}</h1>
          <p className="text-muted-foreground">
            {t("findVets.subtitle")}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("findVets.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <Card className="order-2 lg:order-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t("findVets.vetLocations")}
                </CardTitle>
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 animate-pulse">
                  <span className="inline-block w-2 h-2 rounded-full bg-success mr-1.5"></span>
                  LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <VetMap
                vets={vetsWithLocation}
                selectedVet={selectedVet}
                onSelectVet={handleSelectVet}
              />
              {vetsWithLocation.length === 0 && !loading && (
                <p className="text-center text-muted-foreground mt-4">
                  {t("findVets.noLocationData")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vet List */}
          <div className="order-1 lg:order-2 space-y-4">
            <h2 className="text-xl font-semibold">
              {sortedVets.length} {sortedVets.length !== 1 ? t("findVets.veterinarians") : t("findVets.veterinarian")} {t("findVets.found")}
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-3 bg-muted rounded w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedVets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("findVets.noVets")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {sortedVets.map((vet) => {
                  const vetIsOnline = isVetOnline(vet.user_id);
                  
                  return (
                    <Card
                      key={vet.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedVet?.id === vet.id ? "ring-2 ring-primary" : ""
                      } ${vetIsOnline ? "border-success/50" : ""}`}
                      onClick={() => setSelectedVet(vet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={vet.profile_image_url || undefined} />
                              <AvatarFallback>
                                <User className="h-8 w-8" />
                              </AvatarFallback>
                            </Avatar>
                            {/* Online indicator on avatar */}
                            <div className="absolute -bottom-1 -right-1">
                              <OnlineIndicator isOnline={vetIsOnline} size="md" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg truncate">
                                {vet.full_name}
                              </h3>
                              {vet.license_number && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {t("findVets.verified")}
                                </Badge>
                              )}
                              {vetIsOnline && (
                                <Badge className="bg-success text-success-foreground">
                                  {t("findVets.online")}
                                </Badge>
                              )}
                              {!vetIsOnline && vet.is_available && (
                                <Badge variant="outline">
                                  {t("findVets.available")}
                                </Badge>
                              )}
                            </div>

                            {vet.specialization && (
                              <p className="text-sm text-muted-foreground">
                                {vet.specialization}
                              </p>
                            )}

                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {vet.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {vet.location}
                                </span>
                              )}
                              {vet.phone_number && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {vet.phone_number}
                                </span>
                              )}
                            </div>

                            {vet.bio && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {vet.bio}
                              </p>
                            )}

                            <div className="mt-3">
                              <Link to={`/vet/${vet.user_id}`}>
                                <Button size="sm">{t("findVets.viewProfile")}</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FindVets;
