import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface OnlineVet {
  id: string;
  user_id: string;
  full_name: string;
  online_at: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface PresencePayload {
  id?: string;
  user_id?: string;
  full_name?: string;
  online_at?: string;
  latitude?: number | null;
  longitude?: number | null;
  presence_ref?: string;
}

export const useVetPresence = () => {
  const [onlineVets, setOnlineVets] = useState<Map<string, OnlineVet>>(new Map());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const presenceChannel = supabase.channel("vet-presence", {
      config: {
        presence: {
          key: "vets",
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const newOnlineVets = new Map<string, OnlineVet>();
        
        Object.values(state).forEach((presences) => {
          (presences as PresencePayload[]).forEach((presence) => {
            if (presence.user_id && presence.id && presence.full_name && presence.online_at) {
              newOnlineVets.set(presence.user_id, {
                id: presence.id,
                user_id: presence.user_id,
                full_name: presence.full_name,
                online_at: presence.online_at,
                latitude: presence.latitude,
                longitude: presence.longitude,
              });
            }
          });
        });
        
        setOnlineVets(newOnlineVets);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setOnlineVets((prev) => {
          const updated = new Map(prev);
          (newPresences as PresencePayload[]).forEach((presence) => {
            if (presence.user_id && presence.id && presence.full_name && presence.online_at) {
              updated.set(presence.user_id, {
                id: presence.id,
                user_id: presence.user_id,
                full_name: presence.full_name,
                online_at: presence.online_at,
                latitude: presence.latitude,
                longitude: presence.longitude,
              });
            }
          });
          return updated;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setOnlineVets((prev) => {
          const updated = new Map(prev);
          (leftPresences as PresencePayload[]).forEach((presence) => {
            if (presence.user_id) {
              updated.delete(presence.user_id);
            }
          });
          return updated;
        });
      })
      .subscribe();

    setChannel(presenceChannel);

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  const trackVetPresence = useCallback(
    async (vetData: { id: string; user_id: string; full_name: string; latitude?: number | null; longitude?: number | null }) => {
      if (!channel) return;

      await channel.track({
        ...vetData,
        online_at: new Date().toISOString(),
      });
    },
    [channel]
  );

  const isVetOnline = useCallback(
    (userId: string) => {
      return onlineVets.has(userId);
    },
    [onlineVets]
  );

  const getOnlineVetData = useCallback(
    (userId: string) => {
      return onlineVets.get(userId);
    },
    [onlineVets]
  );

  return {
    onlineVets,
    trackVetPresence,
    isVetOnline,
    getOnlineVetData,
    channel,
  };
};
