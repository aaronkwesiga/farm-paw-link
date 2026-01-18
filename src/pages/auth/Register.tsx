import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, User, UserCog, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { getUserFriendlyError, getValidationError } from "@/lib/errorHandling";
import { authRateLimiter } from "@/lib/rateLimiting";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["farmer", "pet_owner", "veterinarian"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Register = () => {
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"farmer" | "pet_owner" | "veterinarian">(
    (searchParams.get("role") as any) || "farmer"
  );
  const [loading, setLoading] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "veterinarian") {
      setRole("veterinarian");
    }
  }, [searchParams]);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit before attempting registration
    const identifier = email.toLowerCase().trim();
    const limitCheck = authRateLimiter.checkLimit(identifier);
    if (limitCheck.limited) {
      setRateLimitMessage(limitCheck.message);
      setLockoutSeconds(limitCheck.remainingSeconds);
      return;
    }

    try {
      registerSchema.parse({ fullName, email, password, confirmPassword, role });
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName.trim(),
            role: role,
          },
        },
      });

      if (error) {
        // Record failed attempt
        const result = authRateLimiter.recordFailedAttempt(identifier);
        if (result.locked) {
          setRateLimitMessage(result.message);
          setLockoutSeconds(result.remainingSeconds);
        } else if (result.message) {
          setRateLimitMessage(result.message);
        }
        throw error;
      }

      // Clear rate limit on success
      authRateLimiter.recordSuccess(identifier);

      if (data.session) {
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "registration"),
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
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join VetConnect to access veterinary care</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {rateLimitMessage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {rateLimitMessage}
                  {lockoutSeconds > 0 && (
                    <span className="block mt-1 font-mono text-sm">
                      Time remaining: {Math.floor(lockoutSeconds / 60)}:{(lockoutSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Aaron kwesiga"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={lockoutSeconds > 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={lockoutSeconds > 0}
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
                disabled={lockoutSeconds > 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={lockoutSeconds > 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>I am a:</Label>
              <RadioGroup value={role} onValueChange={(value: any) => setRole(value)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="farmer" id="farmer" />
                  <Label htmlFor="farmer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Farmer / Pet Owner</div>
                      <div className="text-xs text-muted-foreground">
                        I need veterinary consultations for my animals
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="veterinarian" id="veterinarian" />
                  <Label htmlFor="veterinarian" className="flex items-center gap-2 cursor-pointer flex-1">
                    <UserCog className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Veterinarian</div>
                      <div className="text-xs text-muted-foreground">
                        I want to provide veterinary consultations
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" disabled={loading || lockoutSeconds > 0}>
              {loading ? "Creating account..." : lockoutSeconds > 0 ? "Temporarily Locked" : "Create Account"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-primary hover:underline font-medium">
                Login here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;