import type { TemporalEvent } from "./types.js";

/**
 * The common temporal event bus (TraceLens_Master_Plan.md §16). Live sources
 * (browser today; terminal/Git later) publish fully-formed TemporalEvents
 * here; subscribers (persistence, a live CLI log, screenshot triggers) fan
 * out independently. This is the same TemporalEvent shape a replayed MP4
 * session produces -- Claude's queries don't need to know which produced it.
 */
export type EventListener = (event: TemporalEvent) => void;
export type Unsubscribe = () => void;

export interface EventBus {
  publish(event: TemporalEvent): void;
  subscribe(listener: EventListener): Unsubscribe;
}

export class InMemoryEventBus implements EventBus {
  private readonly listeners = new Set<EventListener>();

  publish(event: TemporalEvent): void {
    for (const listener of this.listeners) {
      // One subscriber's failure (e.g. a DB write) must not stop the others
      // (e.g. the live CLI log) from receiving the event.
      try {
        listener(event);
      } catch (err) {
        console.error("EventBus listener threw:", err);
      }
    }
  }

  subscribe(listener: EventListener): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
