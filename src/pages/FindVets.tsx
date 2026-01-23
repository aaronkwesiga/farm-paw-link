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
import { MapPin, Phone, User, Search, Star, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import VetMap from "@/components/vet/VetMap";

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

  const handleSelectVet = (vet: VetProfile) => {
    setSelectedVet(vet);
  };

  const fetchVets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "veterinarian");

      if (error) throw error;
      setVets(data || []);
      setFilteredVets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load veterinarians",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  const vetsWithLocation = filteredVets.filter(
    (vet) => vet.latitude !== null && vet.longitude !== null
  );

  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundVideo />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Find Veterinarians</h1>
          <p className="text-muted-foreground">
            Discover qualified veterinarians in your area
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <Card className="order-2 lg:order-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Vet Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VetMap
                vets={vetsWithLocation}
                selectedVet={selectedVet}
                onSelectVet={handleSelectVet}
              />
              {vetsWithLocation.length === 0 && !loading && (
                <p className="text-center text-muted-foreground mt-4">
                  No veterinarians with location data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vet List */}
          <div className="order-1 lg:order-2 space-y-4">
            <h2 className="text-xl font-semibold">
              {filteredVets.length} Veterinarian{filteredVets.length !== 1 ? "s" : ""} Found
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
            ) : filteredVets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No veterinarians found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredVets.map((vet) => (
                  <Card
                    key={vet.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedVet?.id === vet.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedVet(vet)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={vet.profile_image_url || undefined} />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg truncate">
                              {vet.full_name}
                            </h3>
                            {vet.license_number && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                            {vet.is_available && (
                              <Badge className="bg-success text-success-foreground">
                                Available
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
                              <Button size="sm">View Profile</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
