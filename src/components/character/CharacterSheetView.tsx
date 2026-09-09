import { Character, DicePoolConfig, SimpleDicePool, GeneralDicePool, StandardDicePool, CombinedDicePool } from "@/hooks/useCharacters";
import { useCharacters } from "@/hooks/useCharacters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Droplet, Download, Dices, X, BookOpen, Calendar, Skull, Brain, Crosshair } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getClanData, isInClanDiscipline } from "@/lib/v5/clanData";
import { getBloodPotencyEffects, getMaxBloodPotency } from "@/lib/v5/bloodPotencyData";
import { getPredatorTypeData } from "@/lib/v5/predatorTypeData";
import { QuickRollButton } from "@/components/dice/QuickRollButton";
import { CharacterAttachmentsGallery } from "./CharacterAttachmentsGallery";
import { BoonsSection } from "@/components/boons/BoonsSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { exportCharacterToPDF } from "@/lib/pdfExport";
import { PdfExportButton } from "@/components/PdfExportButton";
import { MentionText } from "@/components/mentions/MentionText";
import { ChronicleDate } from "@/components/ChronicleDate";
import { useCharacterSessions } from "@/hooks/useSessionCharacters";
import { useSessions } from "@/hooks/useSessions";
import { usePlots } from "@/hooks/usePlots";
import { usePlotCharacters } from "@/hooks/usePlotCharacters";
import { useRelationships } from "@/hooks/useRelationships";
import { useCoteries } from "@/hooks/useCoteries";

interface CharacterSheetViewProps {
  character: Character;
}

// Rules reference data
const rulesReference = {
  attributes: {
    strength: "Physical power and ability to exert force. Used for melee damage and feats of strength.",
    dexterity: "Agility, reflexes, and hand-eye coordination. Used for ranged attacks and dodging.",
    stamina: "Endurance and resilience. Determines Health tracker capacity and resisting physical hardship.",
    charisma: "Charm, magnetism, and force of personality. Used to inspire and lead.",
    manipulation: "Ability to influence and deceive others. Used for social maneuvering.",
    composure: "Self-control and emotional stability. Determines Willpower capacity and resisting frenzy.",
    intelligence: "Reasoning and learning capacity. Used for analysis and knowledge.",
    wits: "Quick thinking and awareness. Determines initiative and perception.",
    resolve: "Focus and determination. Used to resist mental influence and maintain concentration."
  },
  trackers: {
    health: "Physical damage capacity. Stamina + 3. Superficial (/) damage heals quickly; Aggravated (×) damage takes time.",
    willpower: "Mental fortitude. Composure + Resolve. Spend to reroll failures or resist compulsions.",
    humanity: "Moral compass and connection to morality. Lose when breaking Convictions. At 0, you're a mindless monster.",
    hunger: "Need for blood. Ranges 0-5. At 5, must make Hunger Frenzy tests. Rises when using disciplines or taking damage.",
    bloodPotency: "Power of vitae. Affects discipline strength, feeding restrictions, and blood surge capacity.",
    experience: "Character progression points. Spend to increase traits, learn disciplines, or gain advantages."
  },
  disciplines: {
    general: "Supernatural vampire powers. Each dot unlocks new powers. Some require Blood Potency minimums."
  },
  resonance: {
    general: "The emotional state of blood. Affects discipline usage and can grant temporary benefits.",
    choleric: "Angry, aggressive, violent emotions. Resonates with Celerity and Potence.",
    melancholic: "Sad, fearful, depressed emotions. Resonates with Fortitude and Obfuscate.",
    phlegmatic: "Calm, apathetic, peaceful emotions. Resonates with Auspex and Dominate.",
    sanguine: "Happy, joyful, passionate emotions. Resonates with Blood Sorcery and Presence.",
    animal: "Beast blood. Slakes less Hunger but no risk of killing. Resonates with Animalism and Protean."
  }
};

const RuleTooltip = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex items-center gap-1">
        {children}
        <HelpCircle className="h-3 w-3 text-muted-foreground" />
      </span>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p className="font-semibold mb-1">{title}</p>
      <p className="text-xs">{description}</p>
    </TooltipContent>
  </Tooltip>
);

const ResonanceDisplay = ({ resonance }: { resonance?: string }) => {
  const resonanceTypes = resonance?.toLowerCase().split(',').map(r => r.trim()) || [];
  
  const getResonanceColor = (type: string) => {
    switch(type) {
      case 'choleric': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'melancholic': return 'bg-info/20 text-info border-info/30';
      case 'phlegmatic': return 'bg-success/20 text-success border-success/30';
      case 'sanguine': return 'bg-crit/20 text-crit border-crit/30';
      case 'animal': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };
  
  if (!resonance || resonanceTypes.length === 0) {
    return <span className="text-xs text-muted-foreground">No resonance</span>;
  }
  
  return (
    <div className="flex flex-wrap gap-1">
      {resonanceTypes.map((type, idx) => (
        <Tooltip key={idx}>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getResonanceColor(type)}`}
            >
              <Droplet className="h-3 w-3 mr-1" />
              {type}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1 capitalize">{type} Resonance</p>
            <p className="text-xs">
              {rulesReference.resonance[type as keyof typeof rulesReference.resonance] || 
               rulesReference.resonance.general}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

const DotRating = ({ current, max = 5, filled = false }: { current: number; max?: number; filled?: boolean }) => {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            i < current
              ? filled 
                ? "bg-primary border-primary" 
                : "border-primary bg-background"
              : "border-muted-foreground/30 bg-background"
          }`}
        />
      ))}
    </div>
  );
};

const HealthTracker = ({ 
  max, 
  superficial = 0, 
  aggravated = 0 
}: { 
  max: number; 
  superficial?: number; 
  aggravated?: number;
}) => {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const isAggravated = i < aggravated;
        const isSuperficial = !isAggravated && i < (aggravated + superficial);
        
        return (
          <div
            key={i}
            className={`w-5 h-5 border-2 transition-colors flex items-center justify-center text-xs font-bold ${
              isAggravated
                ? "border-destructive bg-destructive text-destructive-foreground"
                : isSuperficial
                ? "border-primary bg-primary/20 text-primary"
                : "border-muted-foreground/30 bg-background"
            }`}
          >
            {isAggravated ? "×" : isSuperficial ? "/" : ""}
          </div>
        );
      })}
    </div>
  );
};

// Dice Pools Display Component
const DicePoolsDisplay = ({ dicePools }: { dicePools: DicePoolConfig }) => {
  if (dicePools.type === 'simple') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Simple Antagonist</div>
            <div className="text-4xl font-bold text-primary">{dicePools.difficulty}</div>
            <div className="text-sm text-muted-foreground mt-2">Difficulty</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Players roll against Difficulty {dicePools.difficulty}. This character rolls <strong>{dicePools.difficulty * 2} dice</strong>.
        </div>
      </div>
    );
  }

  if (dicePools.type === 'general') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Primary</div>
            <div className="text-3xl font-bold text-primary">{dicePools.primary}</div>
            <div className="text-xs text-muted-foreground mt-1">Areas of Expertise</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Secondary</div>
            <div className="text-3xl font-bold text-muted-foreground">{dicePools.secondary}</div>
            <div className="text-xs text-muted-foreground mt-1">Other Areas</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Format: {dicePools.primary}/{dicePools.secondary}
        </div>
      </div>
    );
  }

  if (dicePools.type === 'standard') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Physical</div>
            <div className="text-3xl font-bold text-primary">{dicePools.physical}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Social</div>
            <div className="text-3xl font-bold text-primary">{dicePools.social}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Mental</div>
            <div className="text-3xl font-bold text-primary">{dicePools.mental}</div>
          </div>
        </div>
        {dicePools.exceptional && dicePools.exceptional.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Exceptional Pools</div>
            <div className="grid grid-cols-2 gap-2">
              {dicePools.exceptional.map((exc, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-primary/10 rounded border border-primary/20">
                  <span className="text-sm font-medium">{exc.name}</span>
                  <span className="text-lg font-bold text-primary">{exc.pool}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (dicePools.type === 'combined') {
    const combined = dicePools as CombinedDicePool;
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-semibold">General Difficulties</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Primary</div>
              <div className="text-2xl font-bold text-primary">{combined.general.primary}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Secondary</div>
              <div className="text-2xl font-bold text-muted-foreground">{combined.general.secondary}</div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">Standard Pools</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Physical</div>
              <div className="text-xl font-bold text-primary">{combined.standard.physical}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Social</div>
              <div className="text-xl font-bold text-primary">{combined.standard.social}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Mental</div>
              <div className="text-xl font-bold text-primary">{combined.standard.mental}</div>
            </div>
          </div>
        </div>
        {combined.standard.exceptional && combined.standard.exceptional.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Exceptional Pools</div>
            <div className="grid grid-cols-2 gap-2">
              {combined.standard.exceptional.map((exc, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-primary/10 rounded border border-primary/20">
                  <span className="text-sm font-medium">{exc.name}</span>
                  <span className="text-lg font-bold text-primary">{exc.pool}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export function CharacterSheetView({ character }: CharacterSheetViewProps) {
  const safeCharacter = normalizeCharacter(character);
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <CharacterSheetContent character={safeCharacter} />
      </div>
    </TooltipProvider>
  );
}


function CharacterSheetContent({ character }: CharacterSheetViewProps) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const { coteries, allCoterieMembers } = useCoteries(character.chronicle_id);

  // Derive live coterie membership from the junction table (source of truth)
  const memberCoteries = allCoterieMembers
    .filter(m => m.character_id === character.id)
    .map(m => coteries.find(c => c.id === m.coterie_id))
    .filter(Boolean) as typeof coteries;

  const imageAttachments = (character.attachments || []).filter((a) =>
    a.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(a.name || '')
  );

  // Use stored max values (which may be overridden), fallback to computed values
  const computedHealthMax = (character.stamina || 1) + 3;
  const computedWillpowerMax = (character.composure || 1) + (character.resolve || 1);
  
  // Use character's saved values if they exist, otherwise use computed
  const healthMax = character.health_max ?? computedHealthMax;
  const willpowerMax = character.willpower_max ?? computedWillpowerMax;
  const physicalAttributes = [
    { name: "Strength", value: character.strength || 1 },
    { name: "Dexterity", value: character.dexterity || 1 },
    { name: "Stamina", value: character.stamina || 1 },
  ];

  const socialAttributes = [
    { name: "Charisma", value: character.charisma || 1 },
    { name: "Manipulation", value: character.manipulation || 1 },
    { name: "Composure", value: character.composure || 1 },
  ];

  const mentalAttributes = [
    { name: "Intelligence", value: character.intelligence || 1 },
    { name: "Wits", value: character.wits || 1 },
    { name: "Resolve", value: character.resolve || 1 },
  ];

  // VtM 5th Edition Skills organized by category
  const skillCategories = {
    Physical: ["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"],
    Social: ["animal_ken", "etiquette", "insight", "intimidation", "leadership", "performance", "persuasion", "streetwise", "subterfuge"],
    Mental: ["academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"]
  };

  return (
    <>
      {/* Character Header */}
      <Card className="p-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            {character.avatar_url ? (
              <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-border shadow-lg">
                <img 
                  src={character.avatar_url} 
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Avatar className="w-32 h-32">
                <AvatarFallback className="text-3xl">{character.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <PdfExportButton
              onExport={(theme) => { exportCharacterToPDF(character, theme); }}
            />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{character.name}</h2>
              <p className="text-muted-foreground">{character.concept || "No concept"}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{character.clan}</Badge>
              {character.clan !== "Human" && character.clan !== "Ghoul" && (
                <Badge variant="outline">Generation {character.generation || 13}</Badge>
              )}
              {character.predator_type && character.predator_type !== "None" && (
                <Badge variant="outline">{character.predator_type}</Badge>
              )}
              <Badge variant={character.type === "PC" ? "default" : "secondary"}>{character.type}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {character.sire && (
                <div>
                  <span className="text-muted-foreground">Sire:</span> {character.sire}
                </div>
              )}
              {memberCoteries.length > 0 && (
                <div>
                  <span className="text-muted-foreground">
                    {memberCoteries.length === 1 ? 'Coterie:' : 'Coteries:'}
                  </span>{' '}
                  {memberCoteries.map(c => c.name).join(', ')}
                </div>
              )}
            </div>
            
            {character.clan !== "Human" && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">Resonance:</span>
                </div>
                <ResonanceDisplay resonance={character.resonance} />
              </div>
            )}

            {/* Image Attachment Thumbnails */}
            {imageAttachments.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Attachments:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {imageAttachments.map((att: any) => (
                    <button
                      key={att.id}
                      onClick={() => setLightboxImage({ url: att.url, name: att.name })}
                      className="w-12 h-12 rounded-md overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer group relative"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent size="lg" className="p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="truncate">{lightboxImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2 flex items-center justify-center">
            {lightboxImage && (
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="disciplines">Disciplines</TabsTrigger>
          <TabsTrigger value="advantages">Advantages</TabsTrigger>
          <TabsTrigger value="beliefs">Beliefs</TabsTrigger>
          <TabsTrigger value="boons">Boons</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Trackers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Trackers</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <RuleTooltip title="Health" description={rulesReference.trackers.health}>
                    <span className="text-sm font-medium">Health</span>
                  </RuleTooltip>
                  <span className="text-xs text-muted-foreground">
                    {(character.health_aggravated || 0) + (character.health_superficial || 0)}/{healthMax} damage
                  </span>
                </div>
                <HealthTracker 
                  max={healthMax}
                  superficial={character.health_superficial}
                  aggravated={character.health_aggravated}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <RuleTooltip title="Willpower" description={rulesReference.trackers.willpower}>
                    <span className="text-sm font-medium">Willpower</span>
                  </RuleTooltip>
                  <span className="text-xs text-muted-foreground">
                    {(character.willpower_aggravated || 0) + (character.willpower_superficial || 0)}/{willpowerMax} damage
                  </span>
                </div>
                <HealthTracker 
                  max={willpowerMax}
                  superficial={character.willpower_superficial}
                  aggravated={character.willpower_aggravated}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <RuleTooltip title="Humanity" description={rulesReference.trackers.humanity}>
                    <span className="text-sm font-medium">Humanity</span>
                  </RuleTooltip>
                  <span className="text-xs text-muted-foreground">{character.humanity || 7}/10</span>
                </div>
                <DotRating current={character.humanity || 7} max={10} />
              </div>

              {character.clan !== "Human" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <RuleTooltip title="Hunger" description={rulesReference.trackers.hunger}>
                      <span className="text-sm font-medium">Hunger</span>
                    </RuleTooltip>
                    <span className="text-xs text-muted-foreground">{character.hunger || 1}/5</span>
                  </div>
                  <DotRating current={character.hunger || 1} max={5} filled />
                </div>
              )}

              {character.clan !== "Human" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <RuleTooltip title="Blood Potency" description={rulesReference.trackers.bloodPotency}>
                      <span className="text-sm font-medium">Blood Potency</span>
                    </RuleTooltip>
                    <span className="text-xs text-muted-foreground">{character.blood_potency || 0}</span>
                  </div>
                  <DotRating current={character.blood_potency || 0} max={10} />
                  {(() => {
                    const maxBP = getMaxBloodPotency(character.generation);
                    const currentBP = character.blood_potency || 0;
                    if (maxBP !== null && currentBP > maxBP) {
                      return (
                        <p className="text-xs text-warning mt-1 flex items-center gap-1">
                          <span>⚠</span> Exceeds Gen {character.generation} cap of {maxBP}
                        </p>
                      );
                    }
                    if (maxBP !== null && character.clan !== "Ghoul") {
                      return (
                        <p className="text-xs text-muted-foreground mt-1">Max BP: {maxBP} (Gen {character.generation})</p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

            </div>
          </Card>

          {/* Blood Potency Effects */}
          {character.clan !== "Human" && character.clan !== "Ghoul" && (
            (() => {
              const bpEffects = getBloodPotencyEffects(character.blood_potency || 0);
              return (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Blood Potency Effects</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="text-center p-3 rounded-md bg-muted/50">
                      <RuleTooltip title="Blood Surge" description="Spend a Rouse Check to add bonus dice to a single Attribute-based dice pool. The bonus equals your Blood Surge value.">
                        <p className="text-xs text-muted-foreground mb-1">Blood Surge</p>
                      </RuleTooltip>
                      <p className="text-lg font-bold text-primary">+{bpEffects.bloodSurge}</p>
                    </div>
                    <div className="text-center p-3 rounded-md bg-muted/50">
                      <RuleTooltip title="Power Bonus" description="Added to the dice pool or damage of Discipline powers that scale with Blood Potency.">
                        <p className="text-xs text-muted-foreground mb-1">Power Bonus</p>
                      </RuleTooltip>
                      <p className="text-lg font-bold text-primary">+{bpEffects.powerBonus}</p>
                    </div>
                    <div className="text-center p-3 rounded-md bg-muted/50">
                      <RuleTooltip title="Rouse Re-roll" description="Discipline powers at or below this level allow you to re-roll a failed Rouse Check (roll two dice, keep the best result).">
                        <p className="text-xs text-muted-foreground mb-1">Rouse Re-roll</p>
                      </RuleTooltip>
                      <p className="text-lg font-bold text-primary">Level {bpEffects.rouseReroll}</p>
                    </div>
                    <div className="text-center p-3 rounded-md bg-muted/50">
                      <RuleTooltip title="Mending" description="Amount of Superficial Health damage healed per Rouse Check. Aggravated damage always heals at 1 per night of rest plus a Rouse Check.">
                        <p className="text-xs text-muted-foreground mb-1">Mending</p>
                      </RuleTooltip>
                      <p className="text-lg font-bold text-primary">{bpEffects.mending} Superficial</p>
                    </div>
                    <div className="text-center p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <RuleTooltip title="Bane Severity" description="Intensifies your clan's Bane. Higher values make the Bane harder to avoid or more punishing when triggered.">
                        <p className="text-xs text-muted-foreground mb-1">Bane Severity</p>
                      </RuleTooltip>
                      <p className="text-lg font-bold text-destructive">{bpEffects.baneSeverity}</p>
                    </div>
                  </div>
                  {bpEffects.feedingPenalty !== "No effect" && (
                    <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border">
                      <RuleTooltip title="Feeding Restriction" description="As Blood Potency rises, lesser blood sources become unable to slake Hunger. At higher levels, only draining humans (or even Kindred) can sustain you.">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Feeding Restriction</p>
                      </RuleTooltip>
                      <p className="text-sm text-muted-foreground">{bpEffects.feedingPenalty}</p>
                    </div>
                  )}
                </Card>
              );
            })()
          )}

          {/* Attributes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Attributes</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Physical</h4>
                <div className="space-y-2">
                  {physicalAttributes.map((attr) => (
                    <div key={attr.name} className="flex justify-between items-center">
                      <RuleTooltip 
                        title={attr.name} 
                        description={rulesReference.attributes[attr.name.toLowerCase() as keyof typeof rulesReference.attributes]}
                      >
                        <span className="text-sm">{attr.name}</span>
                      </RuleTooltip>
                      <div className="flex items-center gap-1">
                        <DotRating current={attr.value} />
                        <QuickRollButton basePool={attr.value} hunger={character.hunger || 1} label={attr.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Social</h4>
                <div className="space-y-2">
                  {socialAttributes.map((attr) => (
                    <div key={attr.name} className="flex justify-between items-center">
                      <RuleTooltip 
                        title={attr.name} 
                        description={rulesReference.attributes[attr.name.toLowerCase() as keyof typeof rulesReference.attributes]}
                      >
                        <span className="text-sm">{attr.name}</span>
                      </RuleTooltip>
                      <div className="flex items-center gap-1">
                        <DotRating current={attr.value} />
                        <QuickRollButton basePool={attr.value} hunger={character.hunger || 1} label={attr.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Mental</h4>
                <div className="space-y-2">
                  {mentalAttributes.map((attr) => (
                    <div key={attr.name} className="flex justify-between items-center">
                      <RuleTooltip 
                        title={attr.name} 
                        description={rulesReference.attributes[attr.name.toLowerCase() as keyof typeof rulesReference.attributes]}
                      >
                        <span className="text-sm">{attr.name}</span>
                      </RuleTooltip>
                      <div className="flex items-center gap-1">
                        <DotRating current={attr.value} />
                        <QuickRollButton basePool={attr.value} hunger={character.hunger || 1} label={attr.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Skills or Dice Pools */}
          {character.use_dice_pools && character.dice_pools ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Dices className="h-5 w-5" />
                Dice Pools
              </h3>
              <DicePoolsDisplay dicePools={character.dice_pools} />
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Skills</h3>
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(skillCategories).map(([category, skillList]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h4>
                    <div className="space-y-2">
                      {skillList.map((skillKey) => {
                        const skill = character.skills?.[skillKey];
                        const rating = skill?.rating || 0;
                        const displayName = skillKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        
                        return (
                          <div key={skillKey} className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="text-sm">{displayName}</span>
                              {skill?.specialty && (
                                <span className="text-xs text-muted-foreground ml-1">({skill.specialty})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {rating > 0 && <DotRating current={rating} />}
                              {rating > 0 && (
                                <QuickRollButton basePool={rating} hunger={character.hunger || 1} label={displayName} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Clan Bane & Compulsion — bottom of Stats tab */}
          {(() => {
            const clanInfo = getClanData(character.clan);
            if (!clanInfo) return null;
            return (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Clan Bane & Compulsion</h3>
                <div className="space-y-3">
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                      <Skull className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-semibold text-destructive">Bane</span>
                      <span className="ml-auto text-xs text-muted-foreground group-data-[state=open]:hidden">Show</span>
                      <span className="ml-auto text-xs text-muted-foreground group-data-[state=closed]:hidden">Hide</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-muted-foreground">{clanInfo.bane}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                      <Brain className="h-4 w-4 text-messy" />
                      <span className="text-sm font-semibold text-messy">Compulsion</span>
                      <span className="ml-auto text-xs text-muted-foreground group-data-[state=open]:hidden">Show</span>
                      <span className="ml-auto text-xs text-muted-foreground group-data-[state=closed]:hidden">Hide</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 rounded-md bg-messy/10 border border-messy/20">
                        <p className="text-sm text-muted-foreground">{clanInfo.compulsion}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </Card>
            );
          })()}
          {/* Predator Type — gameplay effects only */}
          {(() => {
            const ptData = getPredatorTypeData(character.predator_type);
            if (!ptData) return null;
            return (
              <Card className="p-6">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                    <Crosshair className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Predator Type — {character.predator_type}</h3>
                    <span className="ml-auto text-xs text-muted-foreground group-data-[state=open]:hidden">Show</span>
                    <span className="ml-auto text-xs text-muted-foreground group-data-[state=closed]:hidden">Hide</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className="text-sm text-muted-foreground mt-2 mb-3">{ptData.summary}</p>
                    <ul className="space-y-1.5">
                      {ptData.gameplayEffects.map((effect, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })()}
        </TabsContent>

        {/* Disciplines Tab */}
        <TabsContent value="disciplines" className="space-y-6">
          <Card className="p-6">
            <RuleTooltip title="Disciplines" description={rulesReference.disciplines.general}>
              <h3 className="text-lg font-semibold mb-4">Disciplines & Powers</h3>
            </RuleTooltip>
            {character.disciplines && character.disciplines.length > 0 ? (
              (() => {
                // Group powers by discipline
                const powersByDiscipline = (character.powers || []).reduce((acc, power) => {
                  const discipline = power.discipline || 'Other';
                  if (!acc[discipline]) {
                    acc[discipline] = [];
                  }
                  acc[discipline].push(power);
                  return acc;
                }, {} as Record<string, typeof character.powers>);

                return (
                  <div className="space-y-6">
                    {character.disciplines.map((disc, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">{disc.name}</span>
                            {(() => {
                              const affinity = isInClanDiscipline(character.clan, disc.name);
                              if (affinity === null) return null;
                              return affinity ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary">In-Clan</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">Out-of-Clan</Badge>
                              );
                            })()}
                          </div>
                          <DotRating current={disc.level} />
                        </div>
                        {/* Powers for this discipline */}
                        {powersByDiscipline[disc.name] && powersByDiscipline[disc.name]!.length > 0 && (
                          <div className="space-y-3 ml-4 mt-2">
                            {powersByDiscipline[disc.name]!.map((power, powerIdx) => (
                              <div key={powerIdx} className="border-l-2 border-primary/50 pl-4">
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <h5 className="font-medium">{power.name}</h5>
                                    <p className="text-xs text-muted-foreground">
                                      {power.level && `Level ${power.level}`}
                                      {power.cost && ` • ${power.cost}`}
                                    </p>
                                  </div>
                                </div>
                                {power.description && (
                                  <p className="text-sm text-muted-foreground mt-2">{power.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Powers without a matching discipline */}
                    {powersByDiscipline['Other'] && powersByDiscipline['Other']!.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-muted-foreground">Other Powers</span>
                        </div>
                        <div className="space-y-3 ml-4 mt-2">
                          {powersByDiscipline['Other']!.map((power, powerIdx) => (
                            <div key={powerIdx} className="border-l-2 border-primary/50 pl-4">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <h5 className="font-medium">{power.name}</h5>
                                  <p className="text-xs text-muted-foreground">
                                    {power.level && `Level ${power.level}`}
                                    {power.cost && ` • ${power.cost}`}
                                  </p>
                                </div>
                              </div>
                              {power.description && (
                                <p className="text-sm text-muted-foreground mt-2">{power.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground">No disciplines assigned yet</p>
            )}
          </Card>
        </TabsContent>

        {/* Advantages Tab */}
        <TabsContent value="advantages" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Advantages</h3>
            {character.advantages && character.advantages.length > 0 ? (
              <div className="space-y-3">
                {character.advantages.map((adv, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{adv.name}</span>
                        <Badge variant="outline" className="text-xs">{adv.type}</Badge>
                      </div>
                      {adv.description && (
                        <p className="text-sm text-muted-foreground mt-1">{adv.description}</p>
                      )}
                    </div>
                    {adv.rating && <DotRating current={adv.rating} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No advantages assigned yet</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Flaws</h3>
            {character.flaws && character.flaws.length > 0 ? (
              <div className="space-y-3">
                {character.flaws.map((flaw, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="font-medium">{flaw.name}</span>
                      {flaw.description && (
                        <p className="text-sm text-muted-foreground mt-1">{flaw.description}</p>
                      )}
                    </div>
                    {flaw.rating && <DotRating current={flaw.rating} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No flaws assigned yet</p>
            )}
          </Card>

          {character.loresheets && character.loresheets.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Loresheets</h3>
              <div className="space-y-4">
                {character.loresheets.map((loresheet, idx) => (
                  <div key={idx}>
                    <h4 className="font-medium mb-2">{loresheet.name}</h4>
                    {loresheet.benefits && loresheet.benefits.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {loresheet.benefits.map((benefit, bIdx) => (
                          <li key={bIdx}>{benefit}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Beliefs Tab */}
        <TabsContent value="beliefs" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Convictions</h3>
            {character.convictions && character.convictions.length > 0 ? (
              <ul className="space-y-2">
                {character.convictions.map((conviction, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">{conviction}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No convictions defined yet</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Touchstones</h3>
            {character.touchstones && character.touchstones.length > 0 ? (
              <div className="space-y-4">
                {character.touchstones.map((touchstone, idx) => (
                  <div key={idx} className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">{touchstone.name}</h4>
                    {touchstone.conviction && (
                      <p className="text-sm text-muted-foreground">
                        Conviction: {touchstone.conviction}
                      </p>
                    )}
                    {touchstone.description && (
                      <p className="text-sm text-muted-foreground mt-1">{touchstone.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No touchstones defined yet</p>
            )}
          </Card>

          {character.ambition && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Ambition</h3>
              <p className="text-sm">{character.ambition}</p>
            </Card>
          )}

          {character.desire && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Desire</h3>
              <p className="text-sm">{character.desire}</p>
            </Card>
          )}
        </TabsContent>

        {/* Boons Tab */}
        <TabsContent value="boons" className="space-y-6">
          <BoonsTabContent character={character} />
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="space-y-6">
          <CharacterStoriesTab character={character} />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <CharacterSessionsTab character={character} />
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {character.appearance && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Appearance</h3>
              <MentionText text={character.appearance} className="text-sm whitespace-pre-wrap" />
            </Card>
          )}

          {character.distinguishing_features && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Distinguishing Features</h3>
              <p className="text-sm whitespace-pre-wrap">{character.distinguishing_features}</p>
            </Card>
          )}

          {character.history && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">History</h3>
              <MentionText text={character.history} className="text-sm whitespace-pre-wrap" />
            </Card>
          )}

          {character.notes && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <MentionText text={character.notes} className="text-sm whitespace-pre-wrap" />
            </Card>
          )}

          {character.resonance && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Resonance</h3>
              <Badge>{character.resonance}</Badge>
            </Card>
          )}

          {/* Attachments Gallery */}
          <CharacterAttachmentsGallery attachments={character.attachments || []} />
        </TabsContent>
      </Tabs>
    </>
  );
}

// Separate component for Boons tab to use hooks
function BoonsTabContent({ character }: { character: Character }) {
  const { characters } = useCharacters();
  
  // Filter to only characters in the same chronicle
  const chronicleCharacters = characters.filter(c => c.chronicle_id === character.chronicle_id);
  
  return (
    <BoonsSection 
      character={character} 
      characters={chronicleCharacters} 
      editable={false} 
    />
  );
}

// Cross-linked Stories tab
function CharacterStoriesTab({ character }: { character: Character }) {
  const { plotCharacters, loading: plotCharsLoading } = usePlotCharacters();
  const { plots, loading: plotsLoading } = usePlots();

  const characterPlotIds = plotCharacters
    .filter(pc => pc.character_id === character.id)
    .map(pc => pc.plot_id);

  const characterPlots = plots.filter(p => characterPlotIds.includes(p.id));

  if (plotCharsLoading || plotsLoading) {
    return <Card className="p-6 text-center"><p className="text-sm text-muted-foreground">Loading...</p></Card>;
  }

  if (characterPlots.length === 0) {
    return (
      <Card className="p-6 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Not assigned to any stories yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {characterPlots.map(plot => (
        <Card key={plot.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold">{plot.title}</h4>
              {plot.summary && (
                <MentionText text={plot.summary} className="text-sm text-muted-foreground mt-1" />
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Badge variant={plot.status === 'Active' ? 'default' : 'secondary'}>{plot.status}</Badge>
              <Badge variant="outline">{plot.priority}</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Cross-linked Sessions tab
function CharacterSessionsTab({ character }: { character: Character }) {
  const { sessionIds, isLoading } = useCharacterSessions(character.id);
  const { sessions, loading: sessionsLoading } = useSessions();

  // Only show sessions the character is directly tagged in via session_characters
  const characterSessions = sessions
    .filter(s => sessionIds.includes(s.id))
    .sort((a, b) => new Date(b.date_played).getTime() - new Date(a.date_played).getTime());

  if (isLoading || sessionsLoading) {
    return <Card className="p-6 text-center"><p className="text-sm text-muted-foreground">Loading...</p></Card>;
  }

  if (characterSessions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Not tagged in any sessions yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Add this character to sessions via the Sessions page.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {characterSessions.map(session => (
        <Card key={session.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold">{session.title}</h4>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <ChronicleDate value={session.date_played} />
                {session.experience_awarded ? <span>• {session.experience_awarded} XP</span> : null}
              </p>
              {session.summary && (
                <MentionText text={session.summary} className="text-sm text-muted-foreground mt-1 line-clamp-2" />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
