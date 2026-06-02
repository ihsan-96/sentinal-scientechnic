import { fireEvent, render, screen } from '@testing-library/react';
import { IncidentFilters as Filters } from '../types/incident';
import { IncidentFilters } from './IncidentFilters';

const filters: Filters = { page: 1, pageSize: 20 };

describe('IncidentFilters', () => {
  it('emits the selected severity', () => {
    const onChange = vi.fn();
    render(<IncidentFilters filters={filters} onChange={onChange} count={0} />);

    fireEvent.change(screen.getByDisplayValue('All severities'), { target: { value: 'CRITICAL' } });
    expect(onChange).toHaveBeenCalledWith({ severity: 'CRITICAL' });
  });

  it('emits the typed device id', () => {
    const onChange = vi.fn();
    render(<IncidentFilters filters={filters} onChange={onChange} count={0} />);

    fireEvent.change(screen.getByPlaceholderText(/search device/i), { target: { value: 'CAM-001' } });
    expect(onChange).toHaveBeenCalledWith({ deviceId: 'CAM-001' });
  });

  it('applies a saved view preset', () => {
    const onChange = vi.fn();
    render(<IncidentFilters filters={filters} onChange={onChange} count={0} />);

    fireEvent.click(screen.getByRole('button', { name: 'Critical Open' }));
    expect(onChange).toHaveBeenCalledWith({ severity: 'CRITICAL', status: 'OPEN' });
  });
});
