import { fireEvent, render, screen } from '@testing-library/react';
import { IncidentFilters as Filters } from '../types/incident';
import { IncidentFilters } from './IncidentFilters';

const filters: Filters = { page: 1, pageSize: 20 };

describe('IncidentFilters', () => {
  it('emits the selected severity', () => {
    const onChange = vi.fn();
    render(<IncidentFilters filters={filters} onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue('All severities'), { target: { value: 'CRITICAL' } });
    expect(onChange).toHaveBeenCalledWith({ severity: 'CRITICAL' });
  });

  it('emits the typed device id', () => {
    const onChange = vi.fn();
    render(<IncidentFilters filters={filters} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('Device ID'), { target: { value: 'CAM-001' } });
    expect(onChange).toHaveBeenCalledWith({ deviceId: 'CAM-001' });
  });
});
