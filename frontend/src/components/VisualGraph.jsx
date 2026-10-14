import { ArrowRight, User, Film } from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';

export function VisualGraph({ chain, targetActor, onStepClick }) {
  if (!chain || chain.length === 0) return null;

  return (
    <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/80 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between flex-wrap gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-cinema-muted">
          Current Chain Trail ({chain.length - 1} hops)
        </h3>
        <span className="text-[11px] text-cinema-muted">
          Goal: Reach <strong className="text-gold font-medium">{targetActor?.name}</strong>
          {chain.length > 1 && <span className="hidden sm:inline text-gold/80"> (click previous step to revert)</span>}
        </span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
        {chain.map((node, index) => {
          const isOrigin = index === 0;
          const isTargetReached = targetActor && node.actor.id === targetActor.id;
          const isPrevious = index < chain.length - 1;

          return (
            <div key={`${node.actor.id}-${index}`} className="flex items-center gap-3 shrink-0">
              {/* If there was a connecting movie before this actor */}
              {node.movie && (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-cinema-border bg-cinema-card px-2.5 py-1.5 shadow-sm">
                    <div className="h-9 w-6 shrink-0 overflow-hidden rounded bg-cinema-border">
                      {node.movie.posterPath ? (
                        <img
                          src={getTmdbImageUrl(node.movie.posterPath)}
                          alt={node.movie.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                          <Film className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className="max-w-[120px] truncate">
                      <span className="block truncate text-xs font-medium text-slate-200">
                        {node.movie.title}
                      </span>
                      <span className="text-[10px] text-cinema-muted">
                        {node.movie.year}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-gold/70 shrink-0" />
                </>
              )}

              {/* Actor node */}
              <div
                onClick={() => onStepClick && isPrevious && onStepClick(index)}
                role={isPrevious ? "button" : undefined}
                title={isPrevious ? `Click to step back to ${node.actor.name}` : undefined}
                className={`flex items-center gap-2 rounded-xl border p-2 shadow-sm transition ${
                  isPrevious ? 'cursor-pointer hover:border-gold hover:bg-gold/10 hover:shadow-gold-glow' : ''
                } ${
                  isTargetReached
                    ? 'border-gold bg-gold/10 shadow-gold-glow'
                    : isOrigin
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-cinema-border bg-cinema-card'
                }`}
              >
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-cinema-border bg-cinema-surface">
                  {node.actor.profilePath ? (
                    <img
                      src={getTmdbImageUrl(node.actor.profilePath)}
                      alt={node.actor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="max-w-[110px]">
                  <span className={`block truncate text-xs font-semibold ${
                    isTargetReached ? 'text-gold' : 'text-white'
                  }`}>
                    {node.actor.name}
                  </span>
                  {node.character ? (
                    <span className="block truncate text-[10px] text-cinema-muted">
                      as {node.character}
                    </span>
                  ) : isOrigin ? (
                    <span className="text-[10px] text-emerald-400 font-medium">Origin</span>
                  ) : null}
                </div>
              </div>

              {index < chain.length - 1 && (
                <ArrowRight className="h-4 w-4 text-cinema-muted shrink-0" />
              )}
            </div>
          );
        })}

        {/* Ghost node if target is not yet reached */}
        {targetActor && chain[chain.length - 1]?.actor.id !== targetActor.id && (
          <div className="flex items-center gap-3 shrink-0 opacity-60">
            <ArrowRight className="h-4 w-4 text-cinema-muted/50 shrink-0" />
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-gold/40 bg-gold/5 p-2">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gold/30 bg-cinema-surface">
                {targetActor.profilePath ? (
                  <img
                    src={getTmdbImageUrl(targetActor.profilePath)}
                    alt={targetActor.name}
                    className="h-full w-full object-cover grayscale"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="max-w-[100px]">
                <span className="block truncate text-xs font-medium text-gold/80">
                  {targetActor.name}
                </span>
                <span className="text-[10px] text-cinema-muted">Target Goal</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
