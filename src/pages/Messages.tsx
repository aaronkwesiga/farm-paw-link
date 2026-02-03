import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, User, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatRelativeTime } from "@/lib/dateLocalization";

interface Consultation {
  id: string;
  subject: string;
  status: string;
  farmer_id: string;
  vet_id: string | null;
  updated_at: string;
}

interface Message {
  id: string;
  consultation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface ConversationPreview {
  consultation: Consultation;
  lastMessage: Message | null;
  otherParty: {
    id: string;
    full_name: string;
    profile_image_url: string | null;
  } | null;
  unreadCount: number;
}

const Messages = () => {
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth/login");
          return;
        }

        setUserId(session.user.id);

        // Fetch consultations where user is farmer or vet
        const { data: consultations, error: consultationsError } = await supabase
          .from("consultations")
          .select("*")
          .or(`farmer_id.eq.${session.user.id},vet_id.eq.${session.user.id}`)
          .order("updated_at", { ascending: false });

        if (consultationsError) throw consultationsError;

        const conversationPreviews: ConversationPreview[] = [];

        for (const consultation of consultations || []) {
          // Get last message
          const { data: messages } = await supabase
            .from("consultation_messages")
            .select("*")
            .eq("consultation_id", consultation.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMessage = messages?.[0] || null;

          // Get other party's profile
          const otherPartyId = consultation.farmer_id === session.user.id
            ? consultation.vet_id
            : consultation.farmer_id;

          let otherParty = null;
          if (otherPartyId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("user_id, full_name, profile_image_url")
              .eq("user_id", otherPartyId)
              .single();

            if (profile) {
              otherParty = {
                id: profile.user_id,
                full_name: profile.full_name,
                profile_image_url: profile.profile_image_url,
              };
            }
          }

          conversationPreviews.push({
            consultation,
            lastMessage,
            otherParty,
            unreadCount: 0, // Could implement read receipts later
          });
        }

        setConversations(conversationPreviews);
      } catch (error: any) {
        toast({
          title: t("common.error"),
          description: t("consultationDetail.failedToLoad"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages-center")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultation_messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, toast, t]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning text-warning-foreground";
      case "in_progress":
        return "bg-info text-info-foreground";
      case "completed":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKey = `status.${status === "in_progress" ? "inProgress" : status}`;
    return t(statusKey);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundVideo />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("messaging.title")}</h1>
          <p className="text-muted-foreground">
            {t("messaging.subtitle")}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t("messaging.noMessages")}</h2>
              <p className="text-muted-foreground">
                {t("messaging.noMessagesDesc")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map(({ consultation, lastMessage, otherParty }) => (
              <Card
                key={consultation.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/consultation/${consultation.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherParty?.profile_image_url || undefined} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">
                          {otherParty?.full_name || t("messaging.pendingAssignment")}
                        </h3>
                        <Badge className={getStatusColor(consultation.status)}>
                          {getStatusLabel(consultation.status)}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground truncate">
                        {consultation.subject}
                      </p>

                      {lastMessage && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-muted-foreground truncate flex-1">
                            {lastMessage.sender_id === userId ? `${t("common.you")}: ` : ""}
                            {lastMessage.message}
                          </p>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(lastMessage.created_at, language)}
                          </span>
                        </div>
                      )}
                    </div>
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

export default Messages;