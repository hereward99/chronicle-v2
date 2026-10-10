import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Dices,
  History,
  ListChecks,
  Pencil,
  Plus,
  Scroll,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityCard, EntityCardContent, EntityCardHeaderBar, CardIconAction } from "@/components/ui/entity-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { undoableAction } from "@/lib/undoableAction";
import { stripMentions } from "@/lib/mentions";
import { ChronicleDate } from "@/components/ChronicleDate";
import { MentionText } from "@/components/mentions/MentionText";
import { EmptyState } from "@/components/onboarding/EmptyState";
import { ChronicleManager } from "@/components/chronicle/ChronicleManager";
import { CreateChecklistDialog } from "@/components/checklists/CreateChecklistDialog";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { CreatePlotDialog } from "@/components/dialogs/CreatePlotDialog";
import { CreateSessionDialog } from "@/components/dialogs/CreateSessionDialog";
import { CreateNoteDialog } from "@/components/dialogs/CreateNoteDialog";
import { EditNoteDialog } from "@/components/dialogs/EditNoteDialog";
import { useChronicleStats } from "@/hooks/useChronicleStats";
import { useChronicles } from "@/hooks/useChronicles";
import { useChecklists } from "@/hooks/useChecklists";
import { useNotes, Note } from "@/hooks/useNotes";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePlots } from "@/hooks/usePlots";
import { useSessionBeats, LOOSE_ENDS_CHECKLIST_TITLE } from "@/hooks/useSessionBeats";
import { useSessions } from "@/hooks/useSessions";
import { formatDistanceToNow } from "date-fns";

const excerpt = (text: string | null, n = 160) => {
  if (!text) return "";
  const plain = stripMentions(text).replace(/\s+/g, " ").trim();
  return plain.length > n ? plain.slice(0, n).trimEnd() + "…" : plain;
};

function PanelHeading({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

export default function Chronicle() {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [headerEditOpen, setHeaderEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSetting, setEditSetting] = useState("");
  const [showAllNotes, setShowAllNotes] = useState(false);

  const { currentChronicle, updateChronicle } = useChronicles();
  const { stats, loading: statsLoading } = useChronicleStats();
  const { plots, loading: plotsLoading } = usePlots();
  const { notes, loading: notesLoading, deleteNote } = useNotes();
  const { sessions, loading: sessionsLoading } = useSessions();
  const { checklists, loading: checklistsLoading, toggleItem } = useChecklists();
  const { isOnline } = useOnlineStatus();

  const lastSession = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => b.date_played.localeCompare(a.date_played) || b.created_at.localeCompare(a.created_at))[0],
    [sessions],
  );
  const { beats, isLoading: beatsLoading } = useSessionBeats(
    lastSession?.id,
    lastSession?.chronicle_id ?? currentChronicle?.id,
  );

  const xpAwarded = useMemo(() => sessions.reduce((sum, s) => sum + (s.experience_awarded || 0), 0), [sessions]);

  const activeStories = useMemo(
    () => plots.filter((p) => p.status === "Active" || p.status === "Critical"),
    [plots],
  );

  const looseEndsChecklist = useMemo(
    () => checklists.find((c) => c.title === LOOSE_ENDS_CHECKLIST_TITLE),
    [checklists],
  );
  const prepChecklist = useMemo(
    () =>
      checklists.find((c) => c.title !== LOOSE_ENDS_CHECKLIST_TITLE && c.items.some((i) => !i.is_completed)) ??
      checklists.find((c) => c.title !== LOOSE_ENDS_CHECKLIST_TITLE),
    [checklists],
  );

  const openHeaderEdit = () => {
    if (!currentChronicle) return;
    setEditName(currentChronicle.name);
    setEditDescription(currentChronicle.description || "");
    setEditSetting(currentChronicle.setting || "");
    setHeaderEditOpen(true);
  };

  const handleHeaderSave = async () => {
    if (!currentChronicle) return;
    await updateChronicle(currentChronicle.id, { name: editName, description: editDescription, setting: editSetting });
    setHeaderEditOpen(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditDialogOpen(true);
  };

  const handleDeleteNote = (note: Note) => {
    undoableAction({
      description: `Deleted "${note.title}"`,
      perform: () => deleteNote(note.id),
    });
  };

  const togglePrepItem = (itemId: string, next: boolean) => {
    if (!isOnline) return;
    toggleItem(itemId, next);
  };

  const recapBeats = beats.filter((b) => b.kind === "beat").slice(0, 3);
  const recapConsequences = beats.filter((b) => b.kind === "consequence").slice(0, 2);
  const recapLooseEnds = beats.filter((b) => b.kind === "loose_end");

  const prepOpen = prepChecklist?.items.filter((i) => !i.is_completed) ?? [];
  const prepDone = (prepChecklist?.items.length ?? 0) - prepOpen.length;
  const prepPercent = prepChecklist?.items.length ? Math.round((prepDone / prepChecklist.items.length) * 100) : 0;
  const looseOpen = looseEndsChecklist?.items.filter((i) => !i.is_completed) ?? [];

  const visibleNotes = showAllNotes ? notes : notes.slice(0, 3);

  const ribbon = [
    { label: "Sessions played", value: stats.sessions.total, to: "/sessions" },
    { label: "XP awarded", value: xpAwarded, to: "/sessions" },
    { label: "Characters", value: stats.characters.total, to: "/characters" },
    { label: "Stories", value: stats.plots.total, to: "/stories" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div
          className="group cursor-pointer flex items-start gap-3 min-w-0"
          onClick={openHeaderEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openHeaderEdit()}
        >
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 group-hover:text-primary/80 transition-colors break-words">
              {currentChronicle?.name || "Chronicle Dashboard"}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground group-hover:text-foreground/70 transition-colors break-words">
              {currentChronicle?.description || "Your Vampire: The Masquerade tabletop roleplaying game chronicle"}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 md:mt-3 mt-0 md:opacity-0 opacity-60 transition-opacity shrink-0" />
            </TooltipTrigger>
            <TooltipContent>Edit chronicle details</TooltipContent>
          </Tooltip>
        </div>
        <CreateSessionDialog>
          <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson shrink-0 self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-2" />
            Log Session
          </Button>
        </CreateSessionDialog>
      </div>

      {/* Stats ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ribbon.map((r) => (
          <Link
            key={r.label}
            to={r.to}
            className="rounded-lg border bg-surface-1 p-3 hover:border-primary/50 transition-colors"
          >
            {statsLoading ? (
              <Skeleton className="h-7 w-12 mb-1" />
            ) : (
              <div className="font-label text-2xl text-foreground leading-none">{r.value}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">{r.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Revisit & prep ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Last session */}
          <EntityCard variant="panel">
            <CardHeader className="pb-3">
              <PanelHeading
                icon={<History className="h-3.5 w-3.5" />}
                title={lastSession ? "Where we left off" : "No session yet"}
                action={
                  lastSession ? (
                    <Link
                      to={`/sessions/${lastSession.id}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      Open session <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : undefined
                }
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionsLoading ? (
                <>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </>
              ) : !lastSession ? (
                <EmptyState
                  icon={<Calendar className="h-7 w-7" />}
                  title="The chronicle hasn't met yet"
                  description="Log your first session and every recording you make will gather here."
                  action={
                    <CreateSessionDialog>
                      <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                        <Plus className="h-4 w-4 mr-2" /> Log First Session
                      </Button>
                    </CreateSessionDialog>
                  }
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      to={`/sessions/${lastSession.id}`}
                      className="font-label text-xl text-foreground hover:text-primary"
                    >
                      {lastSession.title}
                    </Link>
                    {!!lastSession.experience_awarded && (
                      <Badge variant="secondary" className="text-xs">
                        {lastSession.experience_awarded} XP
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                    <ChronicleDate value={lastSession.date_played} variant="long" />
                    <ChronicleDate
                      inGameStart={lastSession.in_game_date_start}
                      inGameEnd={lastSession.in_game_date_end}
                      prefix="Set in"
                    />
                    <span>
                      · played{" "}
                      {formatDistanceToNow(new Date(lastSession.date_played), { addSuffix: true })}
                    </span>
                  </div>

                  {beatsLoading ? (
                    <div className="space-y-2 pt-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  ) : recapBeats.length || recapConsequences.length ? (
                    <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                      {recapBeats.map((b) => (
                        <li key={b.id}>
                          <MentionText text={b.body} />
                        </li>
                      ))}
                      {recapConsequences.map((b) => (
                        <li key={b.id} className="text-foreground">
                          <MentionText text={b.body} />
                        </li>
                      ))}
                    </ul>
                  ) : lastSession.summary ? (
                    <p className="text-sm italic text-muted-foreground font-serif">
                      {excerpt(lastSession.summary, 320)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nothing was recorded for this session yet — open it to add beats.
                    </p>
                  )}

                  {recapLooseEnds.length > 0 && (
                    <div className="text-sm border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        {recapLooseEnds.length} loose end{recapLooseEnds.length > 1 ? "s" : ""} left hanging
                      </p>
                      <ul className="space-y-1 list-disc pl-5">
                        {recapLooseEnds.slice(0, 3).map((b) => (
                          <li key={b.id}>
                            <MentionText text={b.body} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </EntityCard>

          {/* Active stories */}
          <EntityCard variant="panel">
            <CardHeader className="pb-3">
              <PanelHeading
                icon={<BookOpen className="h-3.5 w-3.5" />}
                title="Threads in play"
                action={
                  <Link to="/stories" className="text-xs text-muted-foreground hover:text-primary">
                    All stories
                  </Link>
                }
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {plotsLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              ) : activeStories.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">No stories are running right now.</p>
                  <CreatePlotDialog>
                    <Button size="sm" className="mt-2" variant="outline">
                      Start a story
                    </Button>
                  </CreatePlotDialog>
                </div>
              ) : (
                activeStories.slice(0, 4).map((plot) => (
                  <div key={plot.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/stories/${plot.id}`}
                        className="font-label text-base text-foreground hover:text-primary"
                      >
                        {plot.title}
                      </Link>
                      <Badge
                        variant={plot.status === "Critical" ? "destructive" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {plot.status}
                      </Badge>
                    </div>
                    <MentionText
                      text={plot.summary || plot.description || "No summary provided"}
                      className="text-sm text-muted-foreground block line-clamp-2"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </EntityCard>
        </div>

        {/* ── Tonight & at the table ─────────────────────────────────── */}
        <div className="space-y-6">
          {/* Prep */}
          <EntityCard variant="panel">
            <CardHeader className="pb-3">
              <PanelHeading
                icon={<ListChecks className="h-3.5 w-3.5" />}
                title="Next session prep"
                action={
                  <Link to="/sessions" className="text-xs text-muted-foreground hover:text-primary">
                    All prep
                  </Link>
                }
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : !prepChecklist ? (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    Nothing is prepped. A checklist keeps the next night at the table tidy.
                  </p>
                  <CreateChecklistDialog>
                    <Button size="sm" variant="outline" className="mt-3">
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> New checklist
                    </Button>
                  </CreateChecklistDialog>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate pr-2">{prepChecklist.title}</span>
                      <span className="shrink-0">
                        {prepDone}/{prepChecklist.items.length}
                      </span>
                    </div>
                    <Progress value={prepPercent} className="h-1.5" />
                  </div>
                  {prepOpen.length === 0 ? (
                    <p className="text-sm text-success">Everything on this list is done.</p>
                  ) : (
                    <ul className="space-y-2">
                      {prepOpen.slice(0, 5).map((item) => (
                        <li key={item.id} className="flex items-start gap-2.5">
                          <Checkbox
                            checked={false}
                            disabled={!isOnline}
                            onCheckedChange={(v) => togglePrepItem(item.id, Boolean(v))}
                            aria-label={`Mark "${item.text}" done`}
                            className="mt-0.5 shrink-0"
                          />
                          <span className="text-sm text-foreground/90 leading-snug">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </CardContent>
          </EntityCard>

          {/* Loose ends */}
          <EntityCard variant="panel">
            <CardHeader className="pb-3">
              <PanelHeading
                icon={<Sparkles className="h-3.5 w-3.5" />}
                title="Loose ends"
                action={
                  looseOpen.length > 0 ? (
                    <Badge variant="outline" className="text-xs">
                      {looseOpen.length} open
                    </Badge>
                  ) : undefined
                }
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : looseOpen.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open threads. Carry loose ends forward from a session and they wait for you here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {looseOpen.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-start gap-2.5">
                      <Checkbox
                        checked={false}
                        disabled={!isOnline}
                        onCheckedChange={(v) => togglePrepItem(item.id, Boolean(v))}
                        aria-label={`Mark "${item.text}" resolved`}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="text-sm text-foreground/90 leading-snug">{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </EntityCard>

          {/* At the table */}
          <EntityCard variant="panel">
            <CardHeader className="pb-3">
              <PanelHeading icon={<Dices className="h-3.5 w-3.5" />} title="At the table" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <CreateSessionDialog>
                <Button variant="outline" className="h-16 flex-col gap-1.5 border-border hover:bg-secondary">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Log session</span>
                </Button>
              </CreateSessionDialog>
              <CreateNoteDialog>
                <Button variant="outline" className="h-16 flex-col gap-1.5 border-border hover:bg-secondary">
                  <Scroll className="h-4 w-4" />
                  <span className="text-xs">Add note</span>
                </Button>
              </CreateNoteDialog>
              <CreateCharacterDialog>
                <Button variant="outline" className="h-16 flex-col gap-1.5 border-border hover:bg-secondary">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Add character</span>
                </Button>
              </CreateCharacterDialog>
              <CreatePlotDialog>
                <Button variant="outline" className="h-16 flex-col gap-1.5 border-border hover:bg-secondary">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs">New story</span>
                </Button>
              </CreatePlotDialog>
              <Link to="/dice" className="col-span-2">
                <Button variant="outline" className="w-full h-10 gap-2 border-border hover:bg-secondary">
                  <Dices className="h-4 w-4" />
                  <span className="text-xs">Roll dice</span>
                </Button>
              </Link>
            </CardContent>
          </EntityCard>
        </div>
      </div>

      {/* Chronicle notes */}
      <EntityCard variant="panel">
        <CardHeader className="pb-3">
          <PanelHeading
            icon={<Scroll className="h-3.5 w-3.5" />}
            title="Chronicle notes"
            action={
              <div className="flex items-center gap-3">
                {notes.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllNotes((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    {showAllNotes ? "Show fewer" : `Show all ${notes.length}`}
                  </button>
                )}
                <CreateNoteDialog>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Note
                  </Button>
                </CreateNoteDialog>
              </div>
            }
          />
        </CardHeader>
        <CardContent>
          {notesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              icon={<Scroll className="h-7 w-7" />}
              title="No notes yet"
              description="Notes capture lore, rumours, NPC quirks, and anything that doesn't belong in a session log."
              tip="Use @mentions to link a note back to a character, story, or session."
              action={
                <CreateNoteDialog>
                  <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                    <Plus className="h-4 w-4 mr-2" /> Create First Note
                  </Button>
                </CreateNoteDialog>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleNotes.map((note) => (
                <EntityCard key={note.id} entityId={note.id}>
                  <EntityCardHeaderBar
                    leading={<Scroll className="h-4 w-4 text-primary" />}
                    title={<span className="text-base">{note.title}</span>}
                    titleClassName="text-base"
                    badge={<Badge variant="outline">{note.category || "General"}</Badge>}
                    actions={
                      <>
                        <CardIconAction label="Edit note" onClick={() => handleEditNote(note)}>
                          <Pencil className="h-4 w-4" />
                        </CardIconAction>
                        <CardIconAction
                          label="Delete note"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteNote(note)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </CardIconAction>
                      </>
                    }
                  />
                  <EntityCardContent className="pt-0 space-y-2">
                    <MentionText
                      text={note.content || "No content"}
                      className="text-sm text-muted-foreground line-clamp-3 block"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at))} ago
                    </p>
                  </EntityCardContent>
                </EntityCard>
              ))}
            </div>
          )}
        </CardContent>
      </EntityCard>

      {/* Chronicle management */}
      <ChronicleManager title="Chronicle Management" />

      {/* Header edit dialog */}
      <Dialog open={headerEditOpen} onOpenChange={setHeaderEditOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Edit Chronicle Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chronicle-name">Name</Label>
              <Input id="chronicle-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chronicle-description">Description</Label>
              <Textarea
                id="chronicle-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chronicle-setting">Setting</Label>
              <Input
                id="chronicle-setting"
                value={editSetting}
                onChange={(e) => setEditSetting(e.target.value)}
                placeholder="e.g. Modern Nights"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHeaderEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleHeaderSave} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditNoteDialog note={editingNote} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </div>
  );
}
