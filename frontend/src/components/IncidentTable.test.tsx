import { fireEvent, render, screen } from '@testing-library/react';
import { Incident } from '../types/incident';
import { IncidentTable } from './IncidentTable';

const incident: Incident = {
  id: 'abc',
  deviceId: 'CAM-001',
  location: 'Sheikh Zayed Road',
  eventType: 'ACCIDENT',
  severity: 'HIGH',
  status: 'OPEN',
  occurredAt: '2026-06-01T10:30:00Z',
  lastEventAt: '2026-06-01T10:30:00Z',
  createdAt: '2026-06-01T10:30:01Z',
  updatedAt: '2026-06-01T10:30:01Z',
};

describe('IncidentTable', () => {
  it('shows an empty state when there are no incidents', () => {
    render(<IncidentTable incidents={[]} onSelect={() => {}} />);
    expect(screen.getByText(/no incidents match/i)).toBeInTheDocument();
  });

  it('renders a row and selects it on click', () => {
    const onSelect = vi.fn();
    render(<IncidentTable incidents={[incident]} onSelect={onSelect} />);

    expect(screen.getByText('Sheikh Zayed Road')).toBeInTheDocument();
    fireEvent.click(screen.getByText('CAM-001'));
    expect(onSelect).toHaveBeenCalledWith(incident);
  });

  it('renders an advance action and does not select the row when clicked', () => {
    const onSelect = vi.fn();
    const onAdvance = vi.fn();
    render(<IncidentTable incidents={[incident]} onSelect={onSelect} onAdvance={onAdvance} />);

    // OPEN advances to ACKNOWLEDGED ("Ack")
    fireEvent.click(screen.getByRole('button', { name: /ack/i }));
    expect(onAdvance).toHaveBeenCalledWith('abc', 'ACKNOWLEDGED');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
