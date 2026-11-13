import { useState, useMemo, useEffect } from 'react';
import { useRestorableState, useScrollRestore } from '@/hooks/useRestorableState';
import { EmptyState } from '@/components/onboarding/EmptyState';
import { LocationCardSkeleton } from '@/components/skeletons/CardSkeleton';
import { Button } from '@/components/ui/button';
import { EntityCard, EntityCardContent, EntityCardHeaderBar, CardIconAction } from '@/components/ui/entity-card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, Search, MapPin, Eye, Pencil, Trash2, ChevronRight } from 'lucide-react';

import { useLocations, Location } from '@/hooks/useLocations';
import { CreateLocationDialog } from '@/components/dialogs/CreateLocationDialog';
import { EditLocationDialog } from '@/components/dialogs/EditLocationDialog';
import { LocationPreview } from '@/components/locations/LocationPreview';
import { MentionText } from '@/components/mentions/MentionText';
import { useSearchHighlight } from '@/hooks/useSearchHighlight';
import { TextHighlight } from '@/components/ui/text-highlight';
import { getZoomForCoordinates } from '@/lib/coordinateZoom';

interface GroupedLocations {
  [country: string]: {
    [cityRegion: string]: Location[];
  };
}

function LocationCard({
  location,
  highlightQuery,
  onView,
  onEdit,
  onDelete,
  selected,
}: {
  location: Location;
  highlightQuery: string;
  onView: (l: Location) => void;
  onEdit: (l: Location) => void;
  onDelete: (l: Location) => void;
  selected: boolean;
}) {
  return (
    <EntityCard
      entityId={location.id}
      className={`hover:border-primary/50 cursor-pointer group ${selected ? 'ring-2 ring-primary' : ''}`}
      onClick={() => onView(location)}
    >
      <EntityCardHeaderBar
        leading={<MapPin className="h-4 w-4 text-primary" />}
        title={
          <span className="text-base break-words">
            <TextHighlight text={location.name} highlight={highlightQuery} />
          </span>
        }
        titleClassName="text-base font-medium"
        actions={
          <>
            <CardIconAction
              label={`Preview ${location.name}`}
              onClick={(e) => { e.stopPropagation(); onView(location); }}
            >
              <Eye className="h-4 w-4" />
            </CardIconAction>
            <CardIconAction
              label="Edit location"
              onClick={(e) => { e.stopPropagation(); onEdit(location); }}
            >
              <Pencil className="h-4 w-4" />
            </CardIconAction>
            <CardIconAction
              label="Delete location"
              className="text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(location); }}
            >
              <Trash2 className="h-4 w-4" />
            </CardIconAction>
          </>
        }
      />
      <EntityCardContent className="pt-0 space-y-2">
        {location.coordinates && (
          <a
            href={`https://www.google.com/maps/d/u/0/viewer?mid=1Y2Zyar_gNkgjPoLZ7Q9Vmo5x-obp4WA&ll=${encodeURIComponent(location.coordinates)}&z=${getZoomForCoordinates(location.coordinates)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin className="h-3 w-3" />
            {location.coordinates}
          </a>
        )}
        {location.description && (
          <MentionText
            text={location.description}
            className="text-sm text-muted-foreground line-clamp-2"
          />
        )}
      </EntityCardContent>
    </EntityCard>
  );
}


export default function Locations() {
  useScrollRestore("/locations");
  const { locations, isLoading, deleteLocation, chronicleId } = useLocations();
  const [searchQuery, setSearchQuery] = useRestorableState('locations:search', '');
  const { searchQuery: highlightQuery } = useSearchHighlight();
  const [createOpen, setCreateOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [previewIdentity, setPreviewIdentity] = useState<{ id: string; chronicleId: typeof chronicleId } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.city_region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = useMemo<GroupedLocations>(() => {
    const result: GroupedLocations = {};
    for (const loc of filteredLocations) {
      const country = loc.country?.trim() || 'Ungrouped';
      const city = loc.city_region?.trim() || 'Other';
      if (!result[country]) result[country] = {};
      if (!result[country][city]) result[country][city] = [];
      result[country][city].push(loc);
    }
    return result;
  }, [filteredLocations]);

  const hasGroups = Object.keys(grouped).some(k => k !== 'Ungrouped');
  const sortedCountries = Object.keys(grouped).sort((a, b) => {
    if (a === 'Ungrouped') return 1;
    if (b === 'Ungrouped') return -1;
    return a.localeCompare(b);
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteLocation(deleteTarget.id);
    setDeleteTarget(null);
  };

  const orderedLocations = hasGroups ? sortedCountries.flatMap(country =>
    Object.keys(grouped[country]).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    }).flatMap(city => grouped[country][city])
  ) : filteredLocations;
  const previewPosition = previewIdentity?.chronicleId === chronicleId
    ? orderedLocations.findIndex(location => location.id === previewIdentity?.id) : -1;
  const preview = previewPosition >= 0 ? orderedLocations[previewPosition] : null;
  useEffect(() => {
    if (!isLoading && previewIdentity && previewPosition < 0) setPreviewIdentity(null);
  }, [isLoading, previewIdentity, previewPosition]);
  const showPreview = (location: Location) => setPreviewIdentity({ id: location.id, chronicleId });
  const gridColumns = preview ? 'md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';

  const cardProps = {
    highlightQuery,
    onView: showPreview,
    onEdit: setEditLocation,
    onDelete: setDeleteTarget,
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Locations</h1>
            <p className="text-muted-foreground mt-1">
              Manage places in your chronicle
            </p>
          </div>
          <Button data-shortcut="new" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className={preview ? 'grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]' : 'min-w-0'}>
        <div className="min-w-0">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <LocationCardSkeleton key={i} />)}
          </div>
        ) : filteredLocations.length === 0 ? (
          searchQuery ? (
            <EmptyState
              icon={<MapPin className="h-7 w-7" />}
              title="No locations found"
              description="Try adjusting your search."
            />
          ) : (
            <EmptyState
              icon={<MapPin className="h-7 w-7" />}
              title="No locations yet"
              description="Locations ground your chronicle in the real (or imagined) world — Elysiums, havens, hunting grounds, and contested domains."
              tip="Use @ in location notes to link characters who frequent or control each place."
              action={
                <Button onClick={() => setCreateOpen(true)} className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Location
                </Button>
              }
            />
          )
        ) : !hasGroups ? (
          // No grouping data — flat grid like before
          <div className={`grid gap-4 ${gridColumns}`}>
            {filteredLocations.map(location => (
              <LocationCard key={location.id} location={location} selected={preview?.id === location.id} {...cardProps} />
            ))}
          </div>
        ) : (
          // Grouped view
          <div className="space-y-4">
            {sortedCountries.map(country => {
              const cities = grouped[country];
              const sortedCities = Object.keys(cities).sort((a, b) => {
                if (a === 'Other') return 1;
                if (b === 'Other') return -1;
                return a.localeCompare(b);
              });

              return (
                <Collapsible key={country} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group/country py-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/country:rotate-90" />
                    <h2 className="text-lg font-semibold">{country}</h2>
                    <span className="text-xs text-muted-foreground">
                      ({Object.values(cities).flat().length})
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-3 mt-1">
                    {sortedCities.map(city => {
                      const locs = cities[city];
                      const showCityHeader = sortedCities.length > 1 || city !== 'Other';

                      return (
                        <div key={city}>
                          {showCityHeader && (
                            <Collapsible defaultOpen>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group/city py-1">
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/city:rotate-90" />
                                <h3 className="text-sm font-medium text-muted-foreground">{city}</h3>
                                <span className="text-xs text-muted-foreground">({locs.length})</span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className={`grid gap-3 mt-2 pl-2 ${gridColumns}`}>
                                  {locs.map(location => (
                                    <LocationCard key={location.id} location={location} selected={preview?.id === location.id} {...cardProps} />
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          {!showCityHeader && (
                            <div className={`grid gap-3 ${gridColumns}`}>
                              {locs.map(location => (
                                <LocationCard key={location.id} location={location} selected={preview?.id === location.id} {...cardProps} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
        </div>
        {preview && <LocationPreview location={preview} position={previewPosition} total={orderedLocations.length}
          onClose={() => setPreviewIdentity(null)}
          onPrevious={() => showPreview(orderedLocations[previewPosition - 1] ?? preview)}
          onNext={() => showPreview(orderedLocations[previewPosition + 1] ?? preview)}
          onEdit={setEditLocation} />}
        </div>
      </div>

      <CreateLocationDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditLocationDialog location={editLocation} open={!!editLocation} onOpenChange={(open) => !open && setEditLocation(null)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}