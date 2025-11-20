import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorHandling";
import { Smartphone, CheckCircle } from "lucide-react";

const MFASetup = () => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [step, setStep] = useState<"enroll" | "verify">("enroll");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth/login");
      return;
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors && factors.totp.length > 0) {
      toast({
        title: "Already Enrolled",
        description: "Google Authenticator is already set up for your account",
      });
      navigate("/profile");
    }
  };

  const handleEnroll = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Google Authenticator",
      });

      if (error) {
        throw error;
      }

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep("verify");

      toast({
        title: "QR Code Generated",
        description: "Scan this QR code with Google Authenticator",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "mfa_enrollment"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verificationCode,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Google Authenticator has been enabled for your account",
      });
      navigate("/profile");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
      <BackgroundVideo />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "enroll" ? "Enable Google Authenticator" : "Verify Setup"}
          </CardTitle>
          <CardDescription>
            {step === "enroll" 
              ? "Add an extra layer of security to your account" 
              : "Enter the code from your authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "enroll" ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Setup Instructions:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Download Google Authenticator from your app store</li>
                  <li>Click the button below to generate a QR code</li>
                  <li>Scan the QR code with the authenticator app</li>
                  <li>Enter the 6-digit code to complete setup</li>
                </ol>
              </div>

              <Button onClick={handleEnroll} className="w-full" disabled={loading}>
                {loading ? "Generating..." : "Generate QR Code"}
              </Button>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/profile")}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="bg-muted p-3 rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                <code className="text-sm font-mono">{secret}</code>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2 flex flex-col items-center">
                  <Label htmlFor="verification">Verification Code</Label>
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={(value) => setVerificationCode(value)}
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
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code shown in Google Authenticator
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Complete Setup"}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MFASetup;
