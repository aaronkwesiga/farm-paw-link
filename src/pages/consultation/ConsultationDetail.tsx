import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Consultation = {
  id: string;
  subject: string;
  description: string;
  symptoms: string | null;
  status: string;
  urgency_level: string;
  created_at: string;
  farmer_id: string;
  vet_id: string | null;
  animal_id: string;
  diagnosis: string | null;
  treatment_plan: string | null;
  follow_up_notes: string | null;
  image_urls: string[] | null;
};

type Message = {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  attachment_url: string | null;
};

const ConsultationDetail = () => {
  const { id } = useParams();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, [id]);

  const fetchData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth/login");
      return;
    }

    setCurrentUserId(session.user.id);

    const { data: consultData, error: consultError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", id)
      .single();

    if (consultError) {
      toast({
        title: "Error",
        description: "Failed to load consultation",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setConsultation(consultData);

    const { data: messagesData, error: messagesError } = await supabase
      .from("consultation_messages")
      .select("*")
      .eq("consultation_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } else {
      setMessages(messagesData || []);
    }

    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`consultation_${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultation_messages",
          filter: `consultation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { error } = await supabase.from("consultation_messages").insert({
        consultation_id: id,
        sender_id: session.user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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

  if (!consultation) return null;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      in_progress: "bg-info text-info-foreground",
      completed: "bg-success text-success-foreground",
      cancelled: "bg-muted text-muted-foreground",
    };
    return <Badge className={colors[status] || "bg-muted"}>{status.replace("_", " ")}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-info text-info-foreground",
      high: "bg-warning text-warning-foreground",
      emergency: "bg-destructive text-destructive-foreground",
    };
    return <Badge className={colors[urgency] || "bg-muted"}>{urgency}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundVideo />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{consultation.subject}</CardTitle>
                  <CardDescription>
                    Requested on {new Date(consultation.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {getUrgencyBadge(consultation.urgency_level)}
                  {getStatusBadge(consultation.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{consultation.description}</p>
              </div>
              {consultation.symptoms && (
                <div>
                  <h3 className="font-semibold mb-2">Symptoms</h3>
                  <p className="text-muted-foreground">{consultation.symptoms}</p>
                </div>
              )}
              {consultation.image_urls && consultation.image_urls.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {consultation.image_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Consultation ${idx + 1}`}
                        className="rounded-lg w-full h-48 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consultation Messages</CardTitle>
              <CardDescription>Chat with your veterinarian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 border rounded-lg">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === currentUserId ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_id === currentUserId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                />
                <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConsultationDetail;
