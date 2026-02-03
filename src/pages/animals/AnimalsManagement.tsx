import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PawPrint, Plus, Loader2, Trash2, Edit } from "lucide-react";
import { z } from "zod";
import { getValidationError } from "@/lib/errorHandling";
import { useLanguage } from "@/contexts/LanguageContext";

const animalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  animal_type: z.enum(["cattle", "goat", "sheep", "poultry", "pig", "dog", "cat", "other"]),
  breed: z.string().optional(),
  age_years: z.number().min(0).optional(),
  age_months: z.number().min(0).max(11).optional(),
  weight_kg: z.number().min(0).optional(),
});

type Animal = {
  id: string;
  name: string | null;
  animal_type: string;
  breed: string | null;
  age_years: number | null;
  age_months: number | null;
  weight_kg: number | null;
  medical_history: string | null;
  created_at: string;
};

const ANIMAL_TYPES = ["cattle", "goat", "sheep", "poultry", "pig", "dog", "cat", "other"] as const;

const AnimalsManagement = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    animal_type: "",
    breed: "",
    age_years: "",
    age_months: "",
    weight_kg: "",
    medical_history: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchAnimals();
  }, []);

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
      .select("*")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: t("common.error"),
        description: t("animals.loadError"),
        variant: "destructive",
      });
    } else {
      setAnimals(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      animalSchema.parse({
        name: formData.name,
        animal_type: formData.animal_type,
        breed: formData.breed || undefined,
        age_years: formData.age_years ? Number(formData.age_years) : undefined,
        age_months: formData.age_months ? Number(formData.age_months) : undefined,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t("auth.validationError"),
          description: getValidationError(error),
          variant: "destructive",
        });
        return;
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const animalData = {
      name: formData.name,
      animal_type: formData.animal_type as any,
      breed: formData.breed || null,
      age_years: formData.age_years ? Number(formData.age_years) : null,
      age_months: formData.age_months ? Number(formData.age_months) : null,
      weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
      medical_history: formData.medical_history || null,
      owner_id: session.user.id,
    };

    if (editingAnimal) {
      const { error } = await supabase
        .from("animals")
        .update(animalData)
        .eq("id", editingAnimal.id);

      if (error) {
        toast({
          title: t("common.error"),
          description: t("animals.updateError"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("common.success"),
          description: t("animals.updateSuccess"),
        });
        setDialogOpen(false);
        fetchAnimals();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("animals").insert([animalData]);

      if (error) {
        toast({
          title: t("common.error"),
          description: t("animals.addError"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("common.success"),
          description: t("animals.addSuccess"),
        });
        setDialogOpen(false);
        fetchAnimals();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("animals.confirmDelete"))) return;

    const { error } = await supabase.from("animals").delete().eq("id", id);

    if (error) {
      toast({
        title: t("common.error"),
        description: t("animals.deleteError"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("common.success"),
        description: t("animals.deleteSuccess"),
      });
      fetchAnimals();
    }
  };

  const handleEdit = (animal: Animal) => {
    setEditingAnimal(animal);
    setFormData({
      name: animal.name || "",
      animal_type: animal.animal_type,
      breed: animal.breed || "",
      age_years: animal.age_years?.toString() || "",
      age_months: animal.age_months?.toString() || "",
      weight_kg: animal.weight_kg?.toString() || "",
      medical_history: animal.medical_history || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      animal_type: "",
      breed: "",
      age_years: "",
      age_months: "",
      weight_kg: "",
      medical_history: "",
    });
    setEditingAnimal(null);
  };

  const getLocalizedAnimalType = (type: string) => {
    return t(`animals.types.${type}`) || type;
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("animals.title")}</h1>
            <p className="text-muted-foreground">{t("animals.subtitle")}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("animals.addAnimal")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAnimal ? t("animals.editAnimal") : t("animals.addNewAnimal")}
                </DialogTitle>
                <DialogDescription>
                  {editingAnimal ? t("animals.updateDetails") : t("animals.enterDetails")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("animals.name")} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="animal_type">{t("animals.type")} *</Label>
                  <Select
                    value={formData.animal_type}
                    onValueChange={(value) => setFormData({ ...formData, animal_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("animals.selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getLocalizedAnimalType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">{t("animals.breed")}</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age_years">{t("animals.ageYears")}</Label>
                    <Input
                      id="age_years"
                      type="number"
                      min="0"
                      value={formData.age_years}
                      onChange={(e) => setFormData({ ...formData, age_years: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age_months">{t("animals.ageMonths")}</Label>
                    <Input
                      id="age_months"
                      type="number"
                      min="0"
                      max="11"
                      value={formData.age_months}
                      onChange={(e) => setFormData({ ...formData, age_months: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight_kg">{t("animals.weight")}</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_history">{t("animals.medicalHistory")}</Label>
                  <Textarea
                    id="medical_history"
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingAnimal ? t("animals.updateAnimal") : t("animals.addAnimal")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {animals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <PawPrint className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("animals.noAnimals")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("animals.addFirst")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {animals.map((animal) => (
              <Card key={animal.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {animal.name || t("common.unnamed")}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(animal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(animal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>{getLocalizedAnimalType(animal.animal_type)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {animal.breed && (
                      <p><strong>{t("animals.breed")}:</strong> {animal.breed}</p>
                    )}
                    {(animal.age_years || animal.age_months) && (
                      <p>
                        <strong>{t("animals.age")}:</strong>{" "}
                        {animal.age_years ? `${animal.age_years} ${t("common.years")} ` : ""}
                        {animal.age_months ? `${animal.age_months} ${t("common.months")}` : ""}
                      </p>
                    )}
                    {animal.weight_kg && (
                      <p><strong>{t("animals.weight")}:</strong> {animal.weight_kg} kg</p>
                    )}
                    {animal.medical_history && (
                      <p className="text-muted-foreground">
                        <strong>{t("animals.medicalHistory")}:</strong> {animal.medical_history.substring(0, 100)}
                        {animal.medical_history.length > 100 && "..."}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AnimalsManagement;
