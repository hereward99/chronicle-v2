import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GroupMembersPanel } from "@/components/groups/GroupMembersPanel";
import { InGameDateInput } from "@/components/InGameDateInput";
import { useSessions, Session } from "@/hooks/useSessions";
import { useChronicles } from "@/hooks/useChronicles";
import { usePlots } from "@/hooks/usePlots";
import { useCharacters } from "@/hooks/useCharacters";
import { useSessionCharacters } from "@/hooks/useSessionCharacters";
import { z } from "zod";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftSavedIndicator } from "@/components/DraftSavedIndicator";
import { SessionRecorder } from "@/components/sessions/SessionRecorder";

const sessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  summary: z.string().max(3000, "Summary must be less than 3000 characters").optional(),
  date_played: z.string().min(1, "Date is required"),
  experience_awarded: z.number().int().min(0).max(10),
  plot_id: z.string().nullable(),
});

interface CreateSessionDialogProps {
  children: React.ReactNode;
}

export function CreateSessionDialog({ children }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    date_played: new Date().toISOString().split('T')[0],
    experience_awarded: 1,
    plot_id: null as string | null,
    in_game_date_start: "",
    in_game_date_end: "",
  });
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [createdSession, setCreatedSession] = useState<Session | null>(null);
  
  const { createSession } = useSessions();
  const { currentChronicle, createDefaultChronicle } = useChronicles();
  const { plots } = usePlots();
  const { characters } = useCharacters();
  const { setSessionCharacters } = useSessionCharacters();
  const { clearDraft, hasDraft, status: draftStatus, lastSavedAt: draftSavedAt } = useFormDraft(
    'create-session',
    formData,
    setFormData,
    { enabled: open }
  );

  const chronicleCharacters = characters.filter(c => c.chronicle_id === currentChronicle?.id);
  const chroniclePlots = plots.filter(p => p.chronicle_id === currentChronicle?.id);

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = sessionSchema.parse({
        ...formData,
        summary: formData.summary || undefined,
        plot_id: formData.plot_id,
      });
      
      setLoading(true);

      let chronicleId = currentChronicle?.id;
      if (!chronicleId) {
        const defaultChronicle = await createDefaultChronicle();
        chronicleId = defaultChronicle.id;
      }

      const newSession = await createSession({
        title: validated.title,
        summary: validated.summary || null,
        date_played: validated.date_played,
        experience_awarded: validated.experience_awarded,
        chronicle_id: chronicleId,
        plot_id: validated.plot_id,
        in_game_date_start: formData.in_game_date_start || null,
        in_game_date_end: formData.in_game_date_end || null,
      });

      if (selectedCharacterIds.length > 0 && newSession?.id) {
        await setSessionCharacters(newSession.id, selectedCharacterIds);
      }

      clearDraft();
      setFormData({
        title: "",
        summary: "",
        date_played: new Date().toISOString().split('T')[0],
        experience_awarded: 1,
        plot_id: null,
        in_game_date_start: "",
        in_game_date_end: "",
      });
      setSelectedCharacterIds([]);

      if (newSession) {
        setCreatedSession(newSession);
      } else {
        setOpen(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const field = issue.path[0]?.toString();
          if (field) fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }: { field: string }) => 
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setErrors({}); setCreatedSession(null); } }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Log New Session</DialogTitle>
          <DialogDescription>
            Record a gaming session for your chronicle
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-title">Session Title *</Label>
            <Input
              id="session-title"
              value={formData.title}
              onChange={(e) => { setFormData(prev => ({ ...prev, title: e.target.value })); clearFieldError('title'); }}
              placeholder="Session title"
              className={`bg-input border-border ${errors.title ? 'border-destructive' : ''}`}
              required
            />
            <FieldError field="title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="story">Story (Optional)</Label>
            <Select
              value={formData.plot_id || "none"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, plot_id: value === "none" ? null : value }))}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select a story..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No story</SelectItem>
                {chroniclePlots.map((plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    {plot.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-played">Date Played *</Label>
              <Input
                id="date-played"
                type="date"
                value={formData.date_played}
                onChange={(e) => { setFormData(prev => ({ ...prev, date_played: e.target.value })); clearFieldError('date_played'); }}
                className={`bg-input border-border ${errors.date_played ? 'border-destructive' : ''}`}
                required
              />
              <FieldError field="date_played" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience Awarded</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="10"
                value={formData.experience_awarded}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_awarded: parseInt(e.target.value) || 0 }))}
                className="bg-input border-border"
              />
            </div>
          </div>

          <InGameDateInput
            startValue={formData.in_game_date_start}
            endValue={formData.in_game_date_end}
            onStartChange={(v) => setFormData(prev => ({ ...prev, in_game_date_start: v }))}
            onEndChange={(v) => setFormData(prev => ({ ...prev, in_game_date_end: v }))}
            className="space-y-2"
          />
          {/* Character Picker */}
          <div className="space-y-2">
            <Label>Characters in Session</Label>
            {chronicleCharacters.length > 0 ? (
              <GroupMembersPanel
                characters={chronicleCharacters}
                members={selectedCharacterIds.map(id => ({ characterId: id }))}
                onAdd={(characterId) => {
                  setSelectedCharacterIds(prev =>
                    prev.includes(characterId) ? prev : [...prev, characterId]
                  );
                }}
                onRemove={(characterId) => {
                  setSelectedCharacterIds(prev => prev.filter(id => id !== characterId));
                }}
                addLabel="Add Character"
                emptyCopy="No characters added yet"
                listHeight="h-[180px]"
              />
            ) : (
              <p className="text-xs text-muted-foreground">No characters in this chronicle yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-summary">Session Summary</Label>
            <MentionInput
              id="session-summary"
              value={formData.summary}
              onChange={(value) => setFormData(prev => ({ ...prev, summary: value }))}
              placeholder="What happened in this session? Use @ to mention characters (optional)"
              className="bg-input border-border min-h-24 resize-none"
              maxLength={3000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, etc.</p>
          </div>

          <div className="flex items-center justify-between pt-4 gap-2">
            <DraftSavedIndicator status={draftStatus} lastSavedAt={draftSavedAt} />
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-blood hover:opacity-90" disabled={loading}>
                {loading ? "Logging..." : "Log Session"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
