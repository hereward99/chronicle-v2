import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Edit, Award, BookOpen, Image as ImageIcon, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/hooks/useSessions";
import { usePlots } from "@/hooks/usePlots";
import { useCharacters } from "@/hooks/useCharacters";
import { useSessionCharacters } from "@/hooks/useSessionCharacters";

import { EditSessionDialog } from "@/components/dialogs/EditSessionDialog";
import { MentionText } from "@/components/mentions/MentionText";
import { ChronicleDate } from "@/components/ChronicleDate";
import { SessionRecorder } from "@/components/sessions/SessionRecorder";
import { DetailPageHeader, DetailNotFound } from "@/components/DetailPageHeader";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { sessions, loading } = useSessions();
  const { plots } = usePlots();
  const { characters } = useCharacters();
  const { characterIds: participantIds } = useSessionCharacters(id);
  const [editOpen, setEditOpen] = useState(false);

  const session = sessions.find(s => s.id === id);
  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!session) return <DetailNotFound label="Session" backTo="/sessions" />;

  const plot = plots.find(p => p.id === session.plot_id);
  const participants = characters.filter(c => participantIds.includes(c.id));

  const images = (session.attachments || []).filter(a => a.type?.startsWith("image/"));
  const docs = (session.attachments || []).filter(a =>
    a.type?.includes("pdf") || a.type?.includes("document") || a.type?.includes("text") || a.name?.match(/\.(pdf|doc|docx|txt|rtf)$/i)
  );

  return (
    <div>
      <DetailPageHeader
        title={session.title}
        backTo="/sessions"
        subtitle={
          <div className="flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(session.date_played).toLocaleDateString()}</span>
            {typeof session.experience_awarded === "number" && session.experience_awarded > 0 && (
              <span className="inline-flex items-center gap-1"><Award className="h-4 w-4" /> {session.experience_awarded} XP</span>
            )}
          </div>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        }
      />

      <div className="space-y-6 max-w-4xl">
        <ChronicleDate
          inGameStart={session.in_game_date_start}
          inGameEnd={session.in_game_date_end}
          prefix="Set in"
          withIcon
          as="div"
          className="text-sm text-muted-foreground"
        />

        {plot && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2"><BookOpen className="h-4 w-4" /> Story</h3>
            <Link to={`/stories/${plot.id}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">{plot.title}</Badge>
            </Link>
          </section>
        )}

        {session.summary && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Summary</h3>
            <MentionText text={session.summary} className="text-sm text-muted-foreground whitespace-pre-wrap" />
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Participants</h3>
          {participants.length ? (
            <div className="flex flex-wrap gap-2">
              {participants.map(c => (
                <Link key={c.id} to={`/characters/${c.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">{c.name}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No participants tagged</p>
          )}
        </section>

        <SessionRecorder session={session} />

        {images.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={i} className="aspect-video rounded-lg overflow-hidden border cursor-pointer hover:opacity-80" onClick={() => window.open(img.url, "_blank")}>
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {docs.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</h3>
            <div className="space-y-2">
              {docs.map((doc, i) => (
                <Button key={i} variant="outline" className="w-full justify-start" onClick={() => window.open(doc.url, "_blank")}>
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="truncate">{doc.name}</span>
                </Button>
              ))}
            </div>
          </section>
        )}
      </div>

      {editOpen && <EditSessionDialog session={session} open={editOpen} onOpenChange={setEditOpen} />}
    </div>
  );
}
