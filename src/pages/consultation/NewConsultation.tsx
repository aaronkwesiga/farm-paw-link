import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { uploadFiles, uploading } = useFileUpload();
  const { t } = useLanguage();

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
          title: t("common.error"),
          description: "Failed to load animals",
          variant: "destructive",
        });
      } else {
        setAnimals(data || []);
      }
      setLoadingAnimals(false);
    };

    fetchAnimals();
  }, [navigate, toast, t]);

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
          title: t("common.error"),
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

      let imageUrls: string[] = [];

      // Upload images if any
      if (images.length > 0) {
        imageUrls = await uploadFiles(images, {
          bucket: 'consultation-images',
          folder: session.user.id,
          maxFiles: 5,
        });
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
        title: t("common.success"),
        description: t("consultation.success"),
      });

      navigate("/dashboard/farmer");
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "Failed to submit consultation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingAnimals) {
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("consultation.title")}</CardTitle>
            <CardDescription>
              {t("consultation.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="animal">{t("consultation.selectAnimal")} *</Label>
                <Select value={animalId} onValueChange={setAnimalId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("consultation.chooseAnimal")} />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.name || t("common.unnamed")} - {animal.animal_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {animals.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("consultation.noAnimals")}{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigate("/animals")}
                    >
                      {t("consultation.addAnimalFirst")}
                    </Button>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t("consultation.subject")} *</Label>
                <Input
                  id="subject"
                  placeholder={t("consultation.subjectPlaceholder")}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">{t("consultation.urgencyLevel")} *</Label>
                <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("consultation.selectUrgency")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("consultation.urgencyLow")}</SelectItem>
                    <SelectItem value="medium">{t("consultation.urgencyMedium")}</SelectItem>
                    <SelectItem value="high">{t("consultation.urgencyHigh")}</SelectItem>
                    <SelectItem value="emergency">{t("consultation.urgencyEmergency")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">{t("consultation.symptoms")}</Label>
                <Textarea
                  id="symptoms"
                  placeholder={t("consultation.symptomsPlaceholder")}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("consultation.description")} *</Label>
                <Textarea
                  id="description"
                  placeholder={t("consultation.descriptionPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">{t("consultation.uploadImages")}</Label>
                <label 
                  htmlFor="images" 
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer block"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("consultation.clickToUpload")}
                  </span>
                  {images.length > 0 && (
                    <p className="text-sm text-primary mt-2">
                      {images.length} {t("consultation.imagesSelected")}
                    </p>
                  )}
                </label>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/farmer")}
                  className="flex-1"
                >
                  {t("consultation.cancel")}
                </Button>
                <Button type="submit" disabled={loading || uploading || animals.length === 0} className="flex-1">
                  {(loading || uploading) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading ? t("consultation.uploading") : t("consultation.submitting")}
                    </>
                  ) : (
                    t("consultation.submitRequest")
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
