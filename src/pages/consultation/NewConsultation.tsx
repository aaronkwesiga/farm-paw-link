import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { z } from "zod";

const consultationSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  symptoms: z.string().optional(),
  urgency_level: z.enum(["low", "medium", "high", "emergency"]),
  animal_id: z.string().uuid("Please select an animal"),
});

type Animal = {
  id: string;
  name: string | null;
  animal_type: string;
};

const NewConsultation = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<string>("");
  const [animalId, setAnimalId] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnimals = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("animals")
        .select("id, name, animal_type")
        .eq("owner_id", session.user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load animals",
          variant: "destructive",
        });
      } else {
        setAnimals(data || []);
      }
      setLoadingAnimals(false);
    };

    fetchAnimals();
  }, [navigate, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      consultationSchema.parse({
        subject,
        description,
        symptoms: symptoms || undefined,
        urgency_level: urgencyLevel,
        animal_id: animalId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth/login");
        return;
      }

      const imageUrls: string[] = [];

      // Upload images if any
      if (images.length > 0) {
        for (const image of images) {
          const fileExt = image.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("consultation-images")
            .upload(filePath, image);

          if (uploadError) {
            throw uploadError;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("consultation-images").getPublicUrl(filePath);

          imageUrls.push(publicUrl);
        }
      }

      const { error } = await supabase.from("consultations").insert({
        farmer_id: session.user.id,
        animal_id: animalId,
        subject,
        description,
        symptoms: symptoms || null,
        urgency_level: urgencyLevel,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Consultation request submitted successfully",
      });

      navigate("/dashboard/farmer");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit consultation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingAnimals) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Request Veterinary Consultation</CardTitle>
            <CardDescription>
              Fill out the form below to request professional veterinary advice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="animal">Select Animal *</Label>
                <Select value={animalId} onValueChange={setAnimalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.name || "Unnamed"} - {animal.animal_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {animals.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No animals registered.{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigate("/animals")}
                    >
                      Add an animal first
                    </Button>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level *</Label>
                <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Routine checkup</SelectItem>
                    <SelectItem value="medium">Medium - Needs attention soon</SelectItem>
                    <SelectItem value="high">High - Urgent care needed</SelectItem>
                    <SelectItem value="emergency">Emergency - Critical condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe any symptoms you've observed"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the animal's condition, behavior, and any other relevant details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">Upload Images (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Label htmlFor="images" className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">
                      Click to upload images (max 5)
                    </span>
                  </Label>
                  {images.length > 0 && (
                    <p className="text-sm text-primary mt-2">
                      {images.length} image(s) selected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/farmer")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || animals.length === 0} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default NewConsultation;
