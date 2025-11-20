import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Loader2, User, Shield, CheckCircle, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserFriendlyError } from "@/lib/errorHandling";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadFiles, uploading } = useFileUpload();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/auth/login");
          return;
        }

        setEmail(session.user.email || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone_number, profile_image_url")
          .eq("user_id", session.user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || "");
          setPhone(profile.phone_number || "");
          setProfileImageUrl(profile.profile_image_url || "");
        }

        // Check MFA status
        const { data: factors } = await supabase.auth.mfa.listFactors();
        setMfaEnabled(factors?.totp.length > 0);
      } catch (error: any) {
        toast({
          title: "Error",
          description: getUserFriendlyError(error, "profile_load"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth/login");
        return;
      }

      const uploadedUrls = await uploadFiles([file], {
        bucket: 'animal-images',
        folder: session.user.id,
        maxFiles: 1,
      });

      if (uploadedUrls.length === 0) return;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_image_url: uploadedUrls[0] })
        .eq("user_id", session.user.id);

      if (updateError) throw updateError;

      setProfileImageUrl(uploadedUrls[0]);
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "profile_photo_upload"),
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone_number: phone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "profile_update"),
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-6 w-6" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImageUrl || undefined} alt="Profile" />
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-image"
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploading && (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <Button type="submit" disabled={updating} className="w-full">
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>
              Manage two-factor authentication for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Google Authenticator</p>
                  {mfaEnabled && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {mfaEnabled 
                    ? "Two-factor authentication is enabled" 
                    : "Add extra security by requiring a code from your phone"}
                </p>
              </div>
              {!mfaEnabled && (
                <Button asChild>
                  <Link to="/auth/mfa-setup">Enable</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
