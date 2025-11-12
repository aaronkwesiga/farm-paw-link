import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface VetVerificationBadgeProps {
  licenseNumber?: string | null;
  specialization?: string | null;
  className?: string;
  showSpecialization?: boolean;
}

export const VetVerificationBadge = ({
  licenseNumber,
  specialization,
  className,
  showSpecialization = true,
}: VetVerificationBadgeProps) => {
  const isVerified = !!licenseNumber;

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {isVerified ? (
        <Badge variant="default" className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Veterinarian</span>
        </Badge>
      ) : (
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <span>Pending Verification</span>
        </Badge>
      )}

      {showSpecialization && specialization && (
        <Badge variant="outline" className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>{specialization}</span>
        </Badge>
      )}
    </div>
  );
};
