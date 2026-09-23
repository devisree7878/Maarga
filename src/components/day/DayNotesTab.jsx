import React, { useState, useEffect, useRef } from 'react';
import { Textarea, FieldGroup } from '../ui/Field';
import { useApp } from '../../context/AppContext';

export default function DayNotesTab({ dayNumber }) {
  const { data, updateDayNotes } = useApp();
  const day = data.days[dayNumber];
  const [value, setValue] = useState(day.notes || '');
  const timer = useRef(null);

  useEffect(() => {
    setValue(day.notes || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNumber]);

  const onChange = (e) => {
    const v = e.target.value;
    setValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => updateDayNotes(dayNumber, v), 400);
  };

  return (
    <div>
      <FieldGroup label="Day notes">
        <Textarea rows={10} value={value} onChange={onChange} placeholder="Reflections, plans, links, anything about this day..." />
      </FieldGroup>
      <p className="text-[11px] text-[rgb(var(--text-dim))] mt-2">Saved automatically as you type.</p>
    </div>
  );
}
