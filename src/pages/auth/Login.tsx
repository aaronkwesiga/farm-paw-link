import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, ArrowLeft, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { getUserFriendlyError, getValidationError } from "@/lib/errorHandling";
import { authRateLimiter } from "@/lib/rateLimiting";
import { useLanguage } from "@/contexts/LanguageContext";

const Login = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.passwordMinLength")),
  });

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          setRateLimitMessage("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Check rate limit on email change
  useEffect(() => {
    if (email) {
      const { limited, remainingSeconds, message } = authRateLimiter.checkLimit(email.toLowerCase());
      if (limited) {
        setRateLimitMessage(message);
        setLockoutSeconds(remainingSeconds);
      }
    }
  }, [email]);

  const handleSendTOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit before attempting login
    const identifier = email.toLowerCase().trim();
    const limitCheck = authRateLimiter.checkLimit(identifier);
    if (limitCheck.limited) {
      setRateLimitMessage(limitCheck.message);
      setLockoutSeconds(limitCheck.remainingSeconds);
      return;
    }
    
    try {
      loginSchema.parse({ email, password });
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

    setLoading(true);

    try {
      // Sign in with password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Record failed attempt and check for lockout
        const result = authRateLimiter.recordFailedAttempt(identifier);
        if (result.locked) {
          setRateLimitMessage(result.message);
          setLockoutSeconds(result.remainingSeconds);
        } else if (result.message) {
          setRateLimitMessage(result.message);
        }
        throw signInError;
      }

      // Clear rate limit on successful password verification
      authRateLimiter.recordSuccess(identifier);
      setRateLimitMessage("");

      // Check if user has MFA enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      
      if (!factors || factors.totp.length === 0) {
        // MFA not enabled - allow login without it
        toast({
          title: t("auth.loginSuccess"),
          description: t("auth.mfaReminder"),
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
        title: t("auth.enterAuthCode"),
        description: t("auth.openAuthApp"),
      });
      
      setStep("totp");
    } catch (error: any) {
      toast({
        title: t("common.error"),
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
        title: t("auth.invalidCode"),
        description: t("auth.enterSixDigits"),
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
        title: t("common.success"),
        description: t("auth.mfaSuccess"),
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: t("common.error"),
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
            {step === "credentials" ? t("auth.welcomeBack") : t("auth.authenticatorCode")}
          </CardTitle>
          <CardDescription>
            {step === "credentials" 
              ? t("auth.loginSubtitle")
              : t("auth.enterCode")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleSendTOTP} className="space-y-4">
              {rateLimitMessage && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {rateLimitMessage}
                    {lockoutSeconds > 0 && (
                      <span className="block mt-1 font-mono text-sm">
                        {t("auth.timeRemaining")}: {Math.floor(lockoutSeconds / 60)}:{(lockoutSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={lockoutSeconds > 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={lockoutSeconds > 0}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || lockoutSeconds > 0}>
                {loading ? t("auth.verifying") : lockoutSeconds > 0 ? t("auth.temporarilyLocked") : t("auth.continueWithAuth")}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <Link to="/auth/register" className="text-primary hover:underline font-medium">
                  {t("auth.registerHere")}
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
                {t("auth.back")}
              </Button>

              <div className="space-y-2 flex flex-col items-center">
                <Label htmlFor="otp">{t("auth.verificationCode")}</Label>
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
                  {t("auth.enterCodeFromApp")}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? t("auth.verifying") : t("auth.verifyAndLogin")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;