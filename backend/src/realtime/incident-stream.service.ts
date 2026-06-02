import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { bufferTime, filter, map, merge, Observable, Subject } from 'rxjs';
import { IncidentEvents } from '../incidents/incident.events';

export type IncidentMessage =
  | { type: 'incidents.changed'; data: { count: number } }
  | { type: 'incidents.cleared'; data: { cleared: true } };

const COALESCE_MS = 500;

@Injectable()
export class IncidentStreamService {
  private readonly changes = new Subject<void>();
  private readonly cleared = new Subject<void>();

  /**
   * Coalesces high-volume incident events into a periodic `incidents.changed` with a count
   * (the dashboard only needs "something changed, and how much", then refetches the
   * filtered/paginated list + stats), so a 10k-case run doesn't flood clients with tens of
   * thousands of messages. `incidents.cleared` is forwarded immediately so the dashboard
   * resets promptly. Its payload is a non-empty object on purpose: NestJS's SSE writer omits
   * the `data:` line when `data` is falsy, and the browser won't dispatch a data-less event.
   */
  asObservable(): Observable<IncidentMessage> {
    const changed$ = this.changes.pipe(
      bufferTime(COALESCE_MS),
      filter((batch) => batch.length > 0),
      map((batch): IncidentMessage => ({ type: 'incidents.changed', data: { count: batch.length } })),
    );
    const cleared$ = this.cleared.pipe(
      map((): IncidentMessage => ({ type: 'incidents.cleared', data: { cleared: true } })),
    );
    return merge(changed$, cleared$);
  }

  @OnEvent(IncidentEvents.Created)
  @OnEvent(IncidentEvents.Updated)
  onChange() {
    this.changes.next();
  }

  @OnEvent(IncidentEvents.Cleared)
  onCleared() {
    this.cleared.next();
  }
}
