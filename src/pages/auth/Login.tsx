import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { getUserFriendlyError, getValidationError } from "@/lib/errorHandling";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: getValidationError(error),
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Sign in with password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Check if user has MFA enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      
      if (!factors || factors.totp.length === 0) {
        // MFA not enabled - allow login without it
        toast({
          title: "Login Successful",
          description: "Consider enabling Google Authenticator for extra security",
        });
        navigate("/dashboard");
        return;
      }

      // MFA is enabled - create challenge for TOTP verification
      const factor = factors.totp[0];
      
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      if (challengeError) {
        throw challengeError;
      }
      
      setFactorId(factor.id);
      setChallengeId(challengeData.id);
      toast({
        title: "Enter Authenticator Code",
        description: "Open Google Authenticator and enter the 6-digit code",
      });
      
      setStep("totp");
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "login"),
        variant: "destructive",
      });
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verify the TOTP code with the stored challenge ID
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: otp,
      });

      if (verifyError) {
        throw verifyError;
      }

      // Ensure session is properly set after MFA verification
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      toast({
        title: "Success",
        description: "Logged in successfully with Google Authenticator",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "mfa_verification"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("credentials");
    setOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
      <BackgroundVideo />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "credentials" ? "Welcome Back" : "Authenticator Code"}
          </CardTitle>
          <CardDescription>
            {step === "credentials" 
              ? "Login to access your VetConnect account" 
              : "Enter the 6-digit code from Google Authenticator"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleSendTOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Continue with Authenticator"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/auth/register" className="text-primary hover:underline font-medium">
                  Register here
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyTOTP} className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="space-y-2 flex flex-col items-center">
                <Label htmlFor="otp">Verification Code</Label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-sm text-muted-foreground">
                  Enter code from Google Authenticator
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;