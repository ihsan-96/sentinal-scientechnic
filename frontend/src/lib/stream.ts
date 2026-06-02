import { STREAM_URL } from '../config';

export function createIncidentStream(): EventSource {
  return new EventSource(STREAM_URL);
}
