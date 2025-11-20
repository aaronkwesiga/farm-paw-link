import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Send, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { getUserFriendlyError } from '@/lib/errorHandling';

interface Message {
  id: string;
  consultation_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
  sender?: {
    full_name: string;
  };
}

interface MessagingPanelProps {
  consultationId: string;
}

export const MessagingPanel = ({ consultationId }: MessagingPanelProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!consultationId) return;

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`consultation-${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch sender profiles
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', senderIds);

      if (profilesError) throw profilesError;

      // Merge the data
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const enrichedMessages = messagesData?.map(msg => ({
        ...msg,
        sender: profilesMap.get(msg.sender_id),
      })) || [];

      setMessages(enrichedMessages);
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "messages_load"),
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('consultation_messages')
        .insert({
          consultation_id: consultationId,
          sender_id: user.id,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error, "message_send"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Consultation Messages</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isOwnMessage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {!isOwnMessage && (
                  <p className="text-xs font-semibold mb-1">
                    {msg.sender?.full_name}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.created_at), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
