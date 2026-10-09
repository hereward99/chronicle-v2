import jsPDF from 'jspdf';
import { stripMentions } from './mentions';

// VtM Gothic Theme Colors (HSL to RGB)
type Palette = {
  background: { r: number; g: number; b: number };
  card: { r: number; g: number; b: number };
  foreground: { r: number; g: number; b: number };
  primary: { r: number; g: number; b: number };
  muted: { r: number; g: number; b: number };
  border: { r: number; g: number; b: number };
};

const DARK_PALETTE: Palette = {
  background: { r: 18, g: 21, b: 25 },
  card: { r: 27, g: 31, b: 35 },
  foreground: { r: 242, g: 242, b: 242 },
  primary: { r: 220, g: 38, b: 38 },
  muted: { r: 140, g: 148, b: 160 },
  border: { r: 45, g: 50, b: 58 },
};

// Printer-friendly: white background, dark text, very light tints (saves ink)
const LIGHT_PALETTE: Palette = {
  background: { r: 255, g: 255, b: 255 },
  card: { r: 240, g: 240, b: 240 },
  foreground: { r: 20, g: 20, b: 20 },
  primary: { r: 153, g: 27, b: 27 },
  muted: { r: 90, g: 90, b: 90 },
  border: { r: 200, g: 200, b: 200 },
};

// Mutable reference to the active palette. Swapped at the start of each export.
let COLORS: Palette = DARK_PALETTE;

export type PdfTheme = 'dark' | 'light';

function setPdfTheme(theme: PdfTheme) {
  COLORS = theme === 'light' ? LIGHT_PALETTE : DARK_PALETTE;
}

interface PDFOptions {
  title: string;
  subtitle?: string;
}

// Draw dots (filled and empty circles) for ratings
function drawDots(pdf: jsPDF, x: number, y: number, filled: number, max: number = 5, dotRadius: number = 1.2): number {
  const spacing = 3.5;
  
  for (let i = 0; i < max; i++) {
    const dotX = x + (i * spacing);
    const dotY = y - 1;
    
    if (i < filled) {
      // Filled dot
      pdf.setFillColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.circle(dotX, dotY, dotRadius, 'F');
    } else {
      // Empty dot (ring)
      pdf.setDrawColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setLineWidth(0.3);
      pdf.circle(dotX, dotY, dotRadius, 'S');
    }
  }
  
  return x + (max * spacing);
}

function paintPageHeader(pdf: jsPDF, options: PDFOptions) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background
  pdf.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header bar
  pdf.setFillColor(COLORS.card.r, COLORS.card.g, COLORS.card.b);
  pdf.rect(0, 0, pageWidth, 25, 'F');

  // Red accent line
  pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.rect(0, 25, pageWidth, 1.5, 'F');

  // Title
  pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(options.title, 15, 16);

  // Subtitle
  if (options.subtitle) {
    pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(options.subtitle, pageWidth - 15, 16, { align: 'right' });
  }
}

function createThemedPDF(options: PDFOptions): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  paintPageHeader(pdf, options);
  return pdf;
}

function addSection(pdf: jsPDF, title: string, y: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Section background
  pdf.setFillColor(COLORS.card.r, COLORS.card.g, COLORS.card.b);
  pdf.roundedRect(15, y, pageWidth - 30, 8, 2, 2, 'F');
  
  // Section title
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 20, y + 5.5);
  
  return y + 12;
}

function addText(pdf: jsPDF, text: string, y: number, options?: { 
  indent?: number; 
  maxWidth?: number;
  fontSize?: number;
  color?: 'foreground' | 'muted';
}): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const indent = options?.indent ?? 20;
  const maxWidth = options?.maxWidth ?? (pageWidth - 40);
  const fontSize = options?.fontSize ?? 10;
  const color = options?.color ?? 'foreground';
  
  const textColor = color === 'muted' ? COLORS.muted : COLORS.foreground;
  pdf.setTextColor(textColor.r, textColor.g, textColor.b);
  pdf.setFontSize(fontSize);
  pdf.setFont('helvetica', 'normal');
  
  const lines = pdf.splitTextToSize(stripMentions(text), maxWidth);
  const lineHeight = fontSize * 0.5;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const bottomMargin = 20;

  let currentY = y;
  for (const line of lines) {
    if (currentY + lineHeight > pageHeight - bottomMargin) {
      pdf.addPage();
      pdf.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pageHeight, 'F');
      currentY = 20;
      pdf.setTextColor(textColor.r, textColor.g, textColor.b);
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'normal');
    }
    pdf.text(line, indent, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function addLabelValue(pdf: jsPDF, label: string, value: string, y: number, x: number = 20, maxWidth?: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label + ':', x, y);
  
  const labelWidth = pdf.getTextWidth(label + ': ') + 2;
  const valueX = x + labelWidth;
  // maxWidth is the total available width from x; subtract the label portion for the value
  const totalAvailable = maxWidth ?? (pageWidth - x - 15);
  const valueMaxWidth = totalAvailable - labelWidth;
  
  pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(stripMentions(value), valueMaxWidth);
  const lineHeight = 5;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const bottomMargin = 20;

  let currentY = y;
  let isFirst = true;
  for (const line of lines) {
    if (currentY + lineHeight > pageHeight - bottomMargin) {
      pdf.addPage();
      pdf.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pageHeight, 'F');
      currentY = 20;
      isFirst = false;
    }
    pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(line, isFirst ? valueX : x, currentY);
    currentY += lineHeight;
    isFirst = false;
  }

  return currentY;
}

function addBadge(pdf: jsPDF, text: string, x: number, y: number, isPrimary: boolean = false): number {
  const color = isPrimary ? COLORS.primary : COLORS.border;
  const textColor = COLORS.foreground;
  
  const textWidth = pdf.getTextWidth(text);
  const padding = 3;
  const height = 6;
  
  pdf.setFillColor(color.r, color.g, color.b);
  pdf.roundedRect(x, y - 4, textWidth + padding * 2, height, 1.5, 1.5, 'F');
  
  pdf.setTextColor(textColor.r, textColor.g, textColor.b);
  pdf.setFontSize(8);
  pdf.text(text, x + padding, y);
  
  return x + textWidth + padding * 2 + 4;
}

function checkNewPage(pdf: jsPDF, currentY: number, neededSpace: number = 30): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (currentY + neededSpace > pageHeight - 20) {
    pdf.addPage();
    // Background for new page
    pdf.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pageHeight, 'F');
    return 20;
  }
  return currentY;
}

// Export a Plot/Story to PDF
export function exportPlotToPDF(plot: {
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}, assignedCharacters: { name: string; clan: string }[] = [], theme: PdfTheme = 'dark') {
  setPdfTheme(theme);
  const pdf = createThemedPDF({
    title: plot.title,
    subtitle: 'Story / Plot'
  });
  
  let y = 35;
  
  // Status and Priority badges
  pdf.setFontSize(8);
  let badgeX = 20;
  badgeX = addBadge(pdf, plot.status, badgeX, y, true);
  addBadge(pdf, plot.priority + ' Priority', badgeX, y);
  y += 10;
  
  // Description
  if (plot.description) {
    y = addSection(pdf, 'Description', y);
    y = addText(pdf, plot.description, y + 4);
    y += 8;
  }
  
  // Assigned Characters
  if (assignedCharacters.length > 0) {
    y = checkNewPage(pdf, y);
    y = addSection(pdf, 'Assigned Characters', y);
    y += 4;
    assignedCharacters.forEach(char => {
      y = addText(pdf, `• ${char.name} (${char.clan})`, y);
      y += 2;
    });
    y += 4;
  }
  
  // Metadata
  y = checkNewPage(pdf, y);
  y = addSection(pdf, 'Metadata', y);
  y += 4;
  y = addLabelValue(pdf, 'Created', new Date(plot.created_at).toLocaleDateString(), y);
  y = addLabelValue(pdf, 'Updated', new Date(plot.updated_at).toLocaleDateString(), y);
  
  pdf.save(`${plot.title.replace(/[^a-z0-9]/gi, '_')}_story.pdf`);
}

export interface SessionCoverRecap {
  sourceTitle: string;
  sourceDate: string;
  items: string[];
  looseEnds: string[];
  fallback?: string;
}

export interface SessionCoverOptions {
  storyTitle?: string | null;
  recap?: SessionCoverRecap | null;
}

function formatLongDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

// Draws a themed title page (page 1) for a session export
function drawSessionCover(pdf: jsPDF, session: { title: string; date_played: string }, options: SessionCoverOptions) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const cx = pageWidth / 2;
  const maxWidth = pageWidth - 50;
  const color = (c: { r: number; g: number; b: number }) => pdf.setTextColor(c.r, c.g, c.b);
  const rule = (y: number, w: number) => {
    pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.rect(cx - w / 2, y, w, 0.8, 'F');
  };

  pdf.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.rect(0, 0, pageWidth, 3, 'F');
  pdf.rect(0, pageHeight - 3, pageWidth, 3, 'F');

  // Kicker
  let y = 62;
  color(COLORS.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('S E S S I O N   L O G', cx, y, { align: 'center' });
  y += 8;
  rule(y, 40);

  // Title
  y += 20;
  color(COLORS.foreground);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(30);
  const titleLines: string[] = pdf.splitTextToSize(session.title, maxWidth).slice(0, 4);
  for (const line of titleLines) {
    pdf.text(line, cx, y, { align: 'center' });
    y += 13;
  }

  // Story + date
  y += 2;
  if (options.storyTitle) {
    color(COLORS.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    const storyLines: string[] = pdf.splitTextToSize(options.storyTitle, maxWidth).slice(0, 2);
    for (const line of storyLines) {
      pdf.text(line, cx, y, { align: 'center' });
      y += 7;
    }
  }
  color(COLORS.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text(formatLongDate(session.date_played), cx, y + 1, { align: 'center' });
  y += 14;
  rule(y, 20);
  y += 14;

  // Recap
  const recap = options.recap;
  if (recap) {
    const left = 25;
    const bottom = pageHeight - 28;
    color(COLORS.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('PREVIOUSLY ON\u2026', cx, y, { align: 'center' });
    y += 7;
    color(COLORS.muted);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text(`${recap.sourceTitle} \u00b7 ${formatLongDate(recap.sourceDate)}`, cx, y, { align: 'center', maxWidth });
    y += 9;

    const writeList = (items: string[]) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      color(COLORS.foreground);
      for (const item of items) {
        const lines: string[] = pdf.splitTextToSize(stripMentions(item), maxWidth - 8);
        if (y + lines.length * 5 > bottom) return;
        pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
        pdf.circle(left + 1, y - 1, 0.7, 'F');
        pdf.text(lines, left + 6, y);
        y += lines.length * 5 + 2;
      }
    };

    if (recap.items.length) writeList(recap.items);
    else if (recap.fallback) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      color(COLORS.foreground);
      const lines: string[] = pdf.splitTextToSize(stripMentions(recap.fallback), maxWidth).slice(0, 8);
      pdf.text(lines, left, y);
      y += lines.length * 5 + 2;
    } else if (!recap.looseEnds.length) {
      color(COLORS.muted);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.text('No beats were recorded for that session.', cx, y, { align: 'center' });
      y += 8;
    }

    if (recap.looseEnds.length && y < bottom - 12) {
      y += 3;
      color(COLORS.muted);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('UNRESOLVED LOOSE ENDS', left, y);
      y += 6;
      writeList(recap.looseEnds);
    }
  }

  // Footer
  color(COLORS.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Kindred Chronicle Scribe', cx, pageHeight - 10, { align: 'center' });
}

// Export a Session to PDF (cover page + session log)
export function exportSessionToPDF(session: {
  title: string;
  summary?: string | null;
  date_played: string;
  experience_awarded?: number | null;
  created_at: string;
}, theme: PdfTheme = 'dark', cover: SessionCoverOptions = {}) {
  setPdfTheme(theme);
  const pdf = new jsPDF('p', 'mm', 'a4');
  drawSessionCover(pdf, session, cover);
  pdf.addPage();
  paintPageHeader(pdf, {
    title: session.title,
    subtitle: 'Session Log'
  });
  
  let y = 35;
  
  // Date and XP
  y = addLabelValue(pdf, 'Date Played', new Date(session.date_played).toLocaleDateString(), y);
  if (session.experience_awarded) {
    y = addLabelValue(pdf, 'Experience Awarded', session.experience_awarded.toString() + ' XP', y);
  }
  y += 5;
  
  // Summary
  if (session.summary) {
    y = addSection(pdf, 'Session Summary', y);
    y = addText(pdf, session.summary, y + 4);
  }
  
  pdf.save(`${session.title.replace(/[^a-z0-9]/gi, '_')}_session.pdf`);
}

// Helper to load image and convert to base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Dice Pool types for PDF export
interface SimpleDicePool {
  type: 'simple';
  difficulty: number;
}

interface GeneralDicePool {
  type: 'general';
  primary: number;
  secondary: number;
}

interface ExceptionalPool {
  name: string;
  pool: number;
}

interface StandardDicePool {
  type: 'standard';
  physical: number;
  social: number;
  mental: number;
  exceptional: ExceptionalPool[];
}

interface CombinedDicePool {
  type: 'combined';
  general: { primary: number; secondary: number };
  standard: { physical: number; social: number; mental: number; exceptional: ExceptionalPool[] };
}

type DicePoolConfig = SimpleDicePool | GeneralDicePool | StandardDicePool | CombinedDicePool;

// Export a Character to PDF
export async function exportCharacterToPDF(character: {
  name: string;
  clan: string;
  type: string;
  status: string;
  concept?: string | null;
  sire?: string | null;
  coterie?: string | null;
  generation?: number | null;
  predator_type?: string | null;
  resonance?: string | null;
  ambition?: string | null;
  desire?: string | null;
  appearance?: string | null;
  history?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  strength?: number | null;
  dexterity?: number | null;
  stamina?: number | null;
  charisma?: number | null;
  manipulation?: number | null;
  composure?: number | null;
  intelligence?: number | null;
  wits?: number | null;
  resolve?: number | null;
  humanity?: number | null;
  hunger?: number | null;
  blood_potency?: number | null;
  experience_total?: number | null;
  experience_spent?: number | null;
  skills?: Record<string, { rating: number; specialty?: string }> | null;
  disciplines?: { name: string; level: number }[] | null;
  powers?: { name: string; discipline: string; level: number }[] | null;
  advantages?: { name: string; rating?: number; type: string }[] | null;
  flaws?: { name: string; rating?: number }[] | null;
  convictions?: string[] | null;
  touchstones?: { name: string; conviction?: string }[] | null;
  loresheets?: { name: string; benefits?: string[] }[] | null;
  distinguishing_features?: string | null;
  use_dice_pools?: boolean | null;
  skip_attributes?: boolean | null;
  dice_pools?: DicePoolConfig | null;
}, theme: PdfTheme = 'dark') {
  setPdfTheme(theme);
  const pdf = createThemedPDF({
    title: character.name,
    subtitle: `${character.clan} • ${character.type}`
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 35;
  
  // Track portrait area to constrain text
  const portraitW = 35;
  const portraitH = 45;
  const portraitPadding = 5;
  const portraitX = pageWidth - 15 - portraitW;
  const portraitY = 30;
  const portraitBottomY = portraitY + portraitH + 3; // including border
  let hasPortrait = false;
  
  // Add portrait if available
  if (character.avatar_url) {
    try {
      const imageData = await loadImageAsBase64(character.avatar_url);
      if (imageData) {
        hasPortrait = true;
        
        // Draw border/frame for portrait
        pdf.setFillColor(COLORS.card.r, COLORS.card.g, COLORS.card.b);
        pdf.roundedRect(portraitX - 1.5, portraitY - 1.5, portraitW + 3, portraitH + 3, 2, 2, 'F');
        pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(portraitX - 1.5, portraitY - 1.5, portraitW + 3, portraitH + 3, 2, 2, 'S');
        
        // Add the portrait image (portrait-oriented rectangle)
        pdf.addImage(imageData, 'JPEG', portraitX, portraitY, portraitW, portraitH);
      }
    } catch (e) {
      console.warn('Failed to load portrait for PDF:', e);
    }
  }
  const isVampire = character.clan !== 'Human' && character.clan !== 'Ghoul';
  
  // Calculate max width for text in the portrait zone
  const textMaxWidthInPortraitZone = hasPortrait ? (portraitX - portraitPadding - 20) : undefined;
  
  // Badges row
  pdf.setFontSize(8);
  let badgeX = 20;
  badgeX = addBadge(pdf, character.clan, badgeX, y, true);
  if (isVampire && character.generation) {
    badgeX = addBadge(pdf, `Gen ${character.generation}`, badgeX, y);
  }
  if (character.predator_type && character.predator_type !== 'None') {
    badgeX = addBadge(pdf, character.predator_type, badgeX, y);
  }
  addBadge(pdf, character.type, badgeX, y);
  y += 10;
  
  // Basic Info — constrain width while portrait is beside text
  const infoMaxWidth = (hasPortrait && y < portraitBottomY) ? textMaxWidthInPortraitZone : undefined;
  if (character.concept) {
    y = addLabelValue(pdf, 'Concept', character.concept, y, 20, infoMaxWidth);
  }
  if (character.sire) {
    y = addLabelValue(pdf, 'Sire', character.sire, y, 20, infoMaxWidth);
  }
  if (character.coterie) {
    y = addLabelValue(pdf, 'Coterie', character.coterie, y, 20, infoMaxWidth);
  }
  if (character.resonance && isVampire) {
    y = addLabelValue(pdf, 'Resonance', character.resonance, y, 20, infoMaxWidth);
  }
  // Ensure we're past the portrait before full-width sections
  if (hasPortrait && y < portraitBottomY) {
    y = portraitBottomY;
  }
  y += 5;
  
  // Dice Pools section (for Storyteller Characters)
  if (character.use_dice_pools && character.dice_pools) {
    y = checkNewPage(pdf, y, 50);
    y = addSection(pdf, 'Dice Pools', y);
    y += 4;
    
    const pools = character.dice_pools;
    
    if (pools.type === 'simple') {
      // Simple antagonist: single difficulty number
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      y = addLabelValue(pdf, 'Difficulty', pools.difficulty.toString(), y);
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text(`Players roll against Difficulty ${pools.difficulty}. This character rolls ${pools.difficulty * 2} dice.`, 20, y);
      y += 8;
    } else if (pools.type === 'general') {
      // General format: Primary/Secondary
      y = addLabelValue(pdf, 'Primary Pool', `${pools.primary} dice (areas of expertise)`, y);
      y = addLabelValue(pdf, 'Secondary Pool', `${pools.secondary} dice (other areas)`, y);
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text(`Format: ${pools.primary}/${pools.secondary}`, 20, y);
      y += 8;
    } else if (pools.type === 'standard') {
      // Standard format: Physical/Social/Mental + Exceptional
      const colWidth = (pageWidth - 40) / 3;
      
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      // Column headers
      pdf.text('Physical', 20, y);
      pdf.text('Social', 20 + colWidth, y);
      pdf.text('Mental', 20 + colWidth * 2, y);
      y += 5;
      
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      
      // Pool values
      pdf.text(`${pools.physical}`, 20, y);
      pdf.text(`${pools.social}`, 20 + colWidth, y);
      pdf.text(`${pools.mental}`, 20 + colWidth * 2, y);
      y += 8;
      
      // Exceptional pools
      if (pools.exceptional && pools.exceptional.length > 0) {
        pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Exceptional Pools:', 20, y);
        y += 5;
        
        pools.exceptional.forEach(exc => {
          pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
          pdf.setFontSize(9);
          pdf.text(`• ${exc.name}:`, 25, y);
          const textWidth = pdf.getTextWidth(`• ${exc.name}:`);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${exc.pool}`, 25 + textWidth + 3, y);
          pdf.setFont('helvetica', 'normal');
          y += 5;
        });
      }
      y += 3;
    } else if (pools.type === 'combined') {
      // Combined format: General + Standard
      const combined = pools as CombinedDicePool;
      
      // General section
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('General Difficulties:', 20, y);
      y += 5;
      y = addLabelValue(pdf, 'Primary', `${combined.general.primary} dice`, y, 25);
      y = addLabelValue(pdf, 'Secondary', `${combined.general.secondary} dice`, y, 25);
      y += 3;
      
      // Standard section
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('Standard Pools:', 20, y);
      y += 5;
      
      const colWidth = (pageWidth - 60) / 3;
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(9);
      pdf.text(`Physical: ${combined.standard.physical}`, 25, y);
      pdf.text(`Social: ${combined.standard.social}`, 25 + colWidth, y);
      pdf.text(`Mental: ${combined.standard.mental}`, 25 + colWidth * 2, y);
      y += 6;
      
      // Exceptional pools
      if (combined.standard.exceptional && combined.standard.exceptional.length > 0) {
        pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        pdf.setFontSize(9);
        pdf.text('Exceptional Pools:', 25, y);
        y += 5;
        
        combined.standard.exceptional.forEach(exc => {
          pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
          pdf.setFontSize(9);
          pdf.text(`• ${exc.name}:`, 30, y);
          const textWidth = pdf.getTextWidth(`• ${exc.name}:`);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${exc.pool}`, 30 + textWidth + 3, y);
          pdf.setFont('helvetica', 'normal');
          y += 5;
        });
      }
      y += 3;
    }
  }
  
  // Attributes (only show if not using dice pools OR if skip_attributes is false)
  const showAttributes = !character.use_dice_pools || !character.skip_attributes;
  
  if (showAttributes) {
    y = checkNewPage(pdf, y, 50);
    y = addSection(pdf, 'Attributes', y);
    y += 4;
    
    const colWidth = (pageWidth - 40) / 3;
    const attributes = {
      Physical: [
        { name: 'Strength', value: character.strength || 1 },
        { name: 'Dexterity', value: character.dexterity || 1 },
        { name: 'Stamina', value: character.stamina || 1 },
      ],
      Social: [
        { name: 'Charisma', value: character.charisma || 1 },
        { name: 'Manipulation', value: character.manipulation || 1 },
        { name: 'Composure', value: character.composure || 1 },
      ],
      Mental: [
        { name: 'Intelligence', value: character.intelligence || 1 },
        { name: 'Wits', value: character.wits || 1 },
        { name: 'Resolve', value: character.resolve || 1 },
      ],
    };
    
    Object.entries(attributes).forEach(([category, attrs], colIndex) => {
      const x = 20 + colIndex * colWidth;
      let attrY = y;
      
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category, x, attrY);
      attrY += 5;
      
      attrs.forEach(attr => {
        pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${attr.name}:`, x, attrY);
        const textWidth = pdf.getTextWidth(`${attr.name}:`);
        drawDots(pdf, x + textWidth + 3, attrY, attr.value, 5);
        attrY += 5;
      });
    });
    y += 25;
  }
  
  // Trackers
  y = checkNewPage(pdf, y, 30);
  y = addSection(pdf, 'Trackers', y);
  y += 4;
  
  const trackerY = y;
  y = addLabelValue(pdf, 'Humanity', `${character.humanity || 7}/10`, y, 20);
  if (isVampire) {
    y = addLabelValue(pdf, 'Hunger', `${character.hunger || 1}/5`, y, 20);
    y = addLabelValue(pdf, 'Blood Potency', `${character.blood_potency || 0}`, y, 20);
  }
  
  const expUnspent = (character.experience_total || 0) - (character.experience_spent || 0);
  addLabelValue(pdf, 'Experience', `${character.experience_total || 0} total (${expUnspent} unspent)`, trackerY, pageWidth / 2);
  y += 5;
  
  // Skills - grouped by category (only show if not using dice pools)
  if (!character.use_dice_pools && character.skills && Object.keys(character.skills).length > 0) {
    y = checkNewPage(pdf, y, 50);
    y = addSection(pdf, 'Skills', y);
    y += 4;
    
    const skills = character.skills as Record<string, { rating: number; specialty?: string }>;
    
    // Define skill categories
    const skillCategories: Record<string, string[]> = {
      Physical: ['athletics', 'brawl', 'craft', 'drive', 'firearms', 'larceny', 'melee', 'stealth', 'survival'],
      Social: ['animal_ken', 'etiquette', 'insight', 'intimidation', 'leadership', 'performance', 'persuasion', 'streetwise', 'subterfuge'],
      Mental: ['academics', 'awareness', 'finance', 'investigation', 'medicine', 'occult', 'politics', 'science', 'technology'],
    };
    
    const colWidth = (pageWidth - 40) / 3;
    const skillStartY = y;
    
    Object.entries(skillCategories).forEach(([category, skillNames], colIndex) => {
      const x = 20 + colIndex * colWidth;
      let skillY = skillStartY;
      
      // Category header
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category, x, skillY);
      skillY += 5;
      
      // Skills in this category
      skillNames.forEach(skillName => {
        const skill = skills[skillName];
        if (skill && skill.rating > 0) {
          const displayName = skillName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const label = skill.specialty 
            ? `${displayName} (${skill.specialty}):`
            : `${displayName}:`;
          pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(label, x, skillY);
          const textWidth = pdf.getTextWidth(label);
          drawDots(pdf, x + textWidth + 3, skillY, skill.rating, 5, 1);
          skillY += 4;
        }
      });
    });
    
    // Calculate max height used by any column
    const maxSkillsInCategory = Math.max(
      ...Object.values(skillCategories).map(names => 
        names.filter(name => skills[name]?.rating > 0).length
      )
    );
    y = skillStartY + 5 + (maxSkillsInCategory * 4) + 5;
  }
  
  // Disciplines and Powers - grouped together
  if (isVampire && character.disciplines && (Array.isArray(character.disciplines) && character.disciplines.length) > 0) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Disciplines & Powers', y);
    y += 4;
    
    const powers = (character.powers as { name: string; discipline: string; level: number }[]) || [];
    
    (character.disciplines as { name: string; level: number }[]).forEach(disc => {
      // Discipline name with dots
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${disc.name}:`, 20, y);
      const textWidth = pdf.getTextWidth(`${disc.name}:`);
      drawDots(pdf, 20 + textWidth + 3, y, disc.level, 5);
      y += 5;
      
      // Powers for this discipline
      const disciplinePowers = powers.filter(p => 
        p.discipline.toLowerCase() === disc.name.toLowerCase()
      );
      
      if (disciplinePowers.length > 0) {
        pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        disciplinePowers.forEach(power => {
          pdf.text(`• ${power.name} (Level ${power.level})`, 25, y);
          y += 4;
        });
      }
      y += 2;
    });
    y += 3;
  }
  
  // Beliefs & Touchstones
  const hasTouchstones = character.touchstones && (Array.isArray(character.touchstones) && character.touchstones.length) > 0;
  if (character.ambition || character.desire || (character.convictions && character.convictions.length > 0) || hasTouchstones) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Beliefs & Touchstones', y);
    y += 4;
    
    if (character.ambition) {
      y = addLabelValue(pdf, 'Ambition', character.ambition, y);
    }
    if (character.desire) {
      y = addLabelValue(pdf, 'Desire', character.desire, y);
    }
    if (character.convictions && character.convictions.length > 0) {
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('Convictions:', 20, y);
      y += 4;
      character.convictions.forEach(conv => {
        pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
        pdf.setFontSize(8);
        pdf.text(`• ${conv}`, 25, y);
        y += 4;
      });
    }
    if (hasTouchstones) {
      y += 2;
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('Touchstones:', 20, y);
      y += 4;
      (character.touchstones as { name: string; conviction?: string }[]).forEach(ts => {
        pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
        pdf.setFontSize(8);
        const label = ts.conviction ? `• ${ts.name} (${ts.conviction})` : `• ${ts.name}`;
        pdf.text(label, 25, y);
        y += 4;
      });
    }
    y += 3;
  }
  
  // Advantages & Flaws
  const hasAdvantages = character.advantages && (Array.isArray(character.advantages) && character.advantages.length) > 0;
  const hasFlaws = character.flaws && (Array.isArray(character.flaws) && character.flaws.length) > 0;
  
  if (hasAdvantages || hasFlaws) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Advantages & Flaws', y);
    y += 4;
    
    if (hasAdvantages) {
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('Advantages:', 20, y);
      y += 4;
      (character.advantages as { name: string; rating?: number; type: string }[]).forEach(adv => {
        pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
        pdf.setFontSize(8);
        const rating = adv.rating || 1;
        const label = `• ${adv.name} (${adv.type})`;
        pdf.text(label, 25, y);
        const textWidth = pdf.getTextWidth(label);
        drawDots(pdf, 25 + textWidth + 3, y, rating, 5, 1);
        y += 4;
      });
      y += 2;
    }
    
    if (hasFlaws) {
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(9);
      pdf.text('Flaws:', 20, y);
      y += 4;
      (character.flaws as { name: string; rating?: number }[]).forEach(flaw => {
        pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
        pdf.setFontSize(8);
        const rating = flaw.rating || 1;
        const label = `• ${flaw.name}`;
        pdf.text(label, 25, y);
        const textWidth = pdf.getTextWidth(label);
        drawDots(pdf, 25 + textWidth + 3, y, rating, 5, 1);
        y += 4;
      });
    }
    y += 3;
  }
  
  // Loresheets
  if (character.loresheets && (Array.isArray(character.loresheets) && character.loresheets.length) > 0) {
    y = checkNewPage(pdf, y, 25);
    y = addSection(pdf, 'Loresheets', y);
    y += 4;
    (character.loresheets as { name: string; benefits?: string[] }[]).forEach(ls => {
      pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${ls.name}`, 20, y);
      y += 4;
      if (ls.benefits && ls.benefits.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        ls.benefits.forEach(benefit => {
          pdf.text(`• ${benefit}`, 25, y);
          y += 4;
        });
      }
      y += 2;
    });
    y += 3;
  }
  
  // Background sections
  if (character.appearance) {
    y = checkNewPage(pdf, y, 25);
    y = addSection(pdf, 'Appearance', y);
    y = addText(pdf, character.appearance, y + 4, { fontSize: 9 });
    y += 5;
  }
  
  if (character.distinguishing_features) {
    y = checkNewPage(pdf, y, 25);
    y = addSection(pdf, 'Distinguishing Features', y);
    y = addText(pdf, character.distinguishing_features, y + 4, { fontSize: 9 });
    y += 5;
  }
  
  if (character.history) {
    y = checkNewPage(pdf, y, 25);
    y = addSection(pdf, 'History', y);
    y = addText(pdf, character.history, y + 4, { fontSize: 9 });
    y += 5;
  }
  
  if (character.notes) {
    y = checkNewPage(pdf, y, 25);
    y = addSection(pdf, 'Notes', y);
    y = addText(pdf, character.notes, y + 4, { fontSize: 9 });
  }
  
  pdf.save(`${character.name.replace(/[^a-z0-9]/gi, '_')}_character.pdf`);
}

// Export a Session Prep Checklist to PDF
export function exportChecklistToPDF(checklist: {
  title: string;
  notes?: string | null;
  items: { text: string; is_completed: boolean }[];
  created_at: string;
}, theme: PdfTheme = 'dark') {
  setPdfTheme(theme);
  const pdf = createThemedPDF({
    title: checklist.title,
    subtitle: 'Session Prep Checklist'
  });
  
  let y = 35;
  
  // Progress summary
  const completedCount = checklist.items.filter(item => item.is_completed).length;
  const totalCount = checklist.items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  pdf.setFontSize(10);
  pdf.text(`Progress: ${completedCount}/${totalCount} items (${progressPercent}%)`, 20, y);
  y += 8;
  
  // Notes
  if (checklist.notes) {
    y = addSection(pdf, 'Notes', y);
    y = addText(pdf, checklist.notes, y + 4, { fontSize: 9 });
    y += 8;
  }
  
  // Checklist items
  y = addSection(pdf, 'Checklist Items', y);
  y += 4;
  
  checklist.items.forEach((item) => {
    y = checkNewPage(pdf, y, 8);
    
    // Draw checkbox
    const checkboxSize = 3;
    const checkboxX = 20;
    const checkboxY = y - 2.5;
    
    pdf.setDrawColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    pdf.setLineWidth(0.3);
    pdf.rect(checkboxX, checkboxY, checkboxSize, checkboxSize, 'S');
    
    if (item.is_completed) {
      // Draw checkmark
      pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.setLineWidth(0.5);
      pdf.line(checkboxX + 0.5, checkboxY + 1.5, checkboxX + 1.2, checkboxY + 2.3);
      pdf.line(checkboxX + 1.2, checkboxY + 2.3, checkboxX + 2.5, checkboxY + 0.5);
    }
    
    // Item text
    const textColor = item.is_completed ? COLORS.muted : COLORS.foreground;
    pdf.setTextColor(textColor.r, textColor.g, textColor.b);
    pdf.setFontSize(10);
    pdf.text(item.text, 26, y);
    
    y += 6;
  });
  
  // Metadata
  y += 5;
  y = checkNewPage(pdf, y, 15);
  pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  pdf.setFontSize(8);
  pdf.text(`Created: ${new Date(checklist.created_at).toLocaleDateString()}`, 20, y);
  
  pdf.save(`${checklist.title.replace(/[^a-z0-9]/gi, '_')}_checklist.pdf`);
}

// Parse the JSON-in-text dot-rated list format used by coteries
function parseDotRatedItemsForPDF(value: string | null | undefined): { name: string; dots: number }[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    if (value.trim()) return [{ name: value.trim(), dots: 0 }];
  }
  return [];
}

// Export a Coterie to PDF
export function exportCoterieToPDF(
  coterie: {
    name: string;
    description?: string | null;
    coterie_type?: string | null;
    city?: string | null;
    is_primary?: boolean;
    chasse: number;
    portillon: number;
    lien: number;
    domain_merits?: string | null;
    domain_resonance?: string | null;
    haven_location?: string | null;
    haven_merits_and_flaws?: string | null;
    coterie_advantages_and_flaws?: string | null;
    coterie_boons_and_debts?: string | null;
    chronicle_tenets?: string | null;
    coterie_goals?: string | null;
    created_at?: string;
    updated_at?: string;
  },
  members: { name: string; clan: string }[] = [],
  theme: PdfTheme = 'dark',
) {
  setPdfTheme(theme);
  const subtitleParts: string[] = [];
  if (coterie.coterie_type) subtitleParts.push(coterie.coterie_type);
  if (coterie.city) subtitleParts.push(coterie.city);

  const pdf = createThemedPDF({
    title: coterie.name,
    subtitle: subtitleParts.join(' • ') || 'Coterie',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 35;

  // Primary badge
  if (coterie.is_primary) {
    pdf.setFontSize(8);
    addBadge(pdf, 'Primary Coterie', 20, y, true);
    y += 10;
  }

  // Description
  if (coterie.description) {
    y = addSection(pdf, 'Description', y);
    y = addText(pdf, coterie.description, y + 4);
    y += 6;
  }

  // Domain
  const hasDomain =
    coterie.chasse > 0 || coterie.portillon > 0 || coterie.lien > 0 ||
    coterie.domain_merits || coterie.domain_resonance;
  if (hasDomain) {
    y = checkNewPage(pdf, y, 40);
    y = addSection(pdf, 'Domain', y);
    y += 4;

    pdf.setTextColor(COLORS.foreground.r, COLORS.foreground.g, COLORS.foreground.b);
    pdf.setFontSize(10);

    const drawRating = (label: string, value: number) => {
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(10);
      pdf.text(label, 20, y);
      drawDots(pdf, 55, y, value, 5);
      y += 6;
    };
    drawRating('Chasse', coterie.chasse);
    drawRating('Portillon', coterie.portillon);
    drawRating('Lien', coterie.lien);

    if (coterie.domain_resonance) {
      y = addLabelValue(pdf, 'Resonance', coterie.domain_resonance, y);
    }

    const merits = parseDotRatedItemsForPDF(coterie.domain_merits);
    merits.forEach(m => {
      y = checkNewPage(pdf, y, 8);
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(10);
      pdf.text(m.name, 20, y);
      drawDots(pdf, 55, y, m.dots, 5);
      y += 6;
    });
    y += 4;
  }

  // Haven / Hangout
  if (coterie.haven_location || coterie.haven_merits_and_flaws) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Haven / Hangout', y);
    y += 4;
    if (coterie.haven_location) {
      y = addText(pdf, coterie.haven_location, y);
      y += 2;
    }
    const havenMerits = parseDotRatedItemsForPDF(coterie.haven_merits_and_flaws);
    havenMerits.forEach(m => {
      y = checkNewPage(pdf, y, 8);
      pdf.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      pdf.setFontSize(10);
      pdf.text(m.name, 20, y);
      drawDots(pdf, 55, y, m.dots, 5);
      y += 6;
    });
    y += 4;
  }

  // Social Ledger
  if (coterie.coterie_advantages_and_flaws || coterie.coterie_boons_and_debts) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Social Ledger', y);
    y += 4;
    if (coterie.coterie_advantages_and_flaws) {
      y = addLabelValue(pdf, 'Advantages & Flaws', coterie.coterie_advantages_and_flaws, y);
    }
    if (coterie.coterie_boons_and_debts) {
      y = addLabelValue(pdf, 'Boons & Debts', coterie.coterie_boons_and_debts, y);
    }
    y += 4;
  }

  // Ideology & Ambition
  if (coterie.chronicle_tenets || coterie.coterie_goals) {
    y = checkNewPage(pdf, y, 30);
    y = addSection(pdf, 'Ideology & Ambition', y);
    y += 4;
    if (coterie.chronicle_tenets) {
      y = addLabelValue(pdf, 'Tenets', coterie.chronicle_tenets, y);
    }
    if (coterie.coterie_goals) {
      y = addLabelValue(pdf, 'Goals', coterie.coterie_goals, y);
    }
    y += 4;
  }

  // Members
  y = checkNewPage(pdf, y, 20);
  y = addSection(pdf, `Members (${members.length})`, y);
  y += 4;
  if (members.length === 0) {
    y = addText(pdf, 'No members yet', y, { color: 'muted' });
  } else {
    members.forEach(m => {
      y = checkNewPage(pdf, y, 6);
      y = addText(pdf, `• ${m.name} (${m.clan})`, y);
      y += 1;
    });
  }
  y += 4;

  // Metadata
  if (coterie.created_at || coterie.updated_at) {
    y = checkNewPage(pdf, y, 20);
    y = addSection(pdf, 'Metadata', y);
    y += 4;
    if (coterie.created_at) {
      y = addLabelValue(pdf, 'Created', new Date(coterie.created_at).toLocaleDateString(), y);
    }
    if (coterie.updated_at) {
      y = addLabelValue(pdf, 'Updated', new Date(coterie.updated_at).toLocaleDateString(), y);
    }
  }

  pdf.save(`${coterie.name.replace(/[^a-z0-9]/gi, '_')}_coterie.pdf`);
}
