'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Ban } from 'lucide-react';
import { format, addDays, isSameDay, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useBooking } from '../../store/BookingContext';
import { supabaseApi } from '../../lib/supabaseApi';

export const TimeSelection: React.FC = () => {
  const { setStep, setDate, setTime, selectedBarber, selectedServices } = useBooking();
  const [selectedDay, setSelectedDay] = useState<Date>(startOfToday());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate next 14 days
  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

  // Time slots from 9:00 AM to 9:00 PM (21:00)
  const morningSlots = [
    '09:00', '10:00', '11:00', '12:00'
  ];
  const afternoonSlots = [
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  // Cache for slots: key = "YYYY-MM-DD_BARBER_ID", value = { slots: string[], timestamp: number }
  const slotsCache = React.useRef<Record<string, { slots: string[], timestamp: number }>>({});

  // Fetch availability when date or barber changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedBarber) return;

      const cacheKey = `${format(selectedDay, 'yyyy-MM-dd')}_${selectedBarber.id}`;
      const cached = slotsCache.current[cacheKey];

      // Use cache if less than 60 seconds old to respect real-time-ish nature but save excessive clicks
      if (cached && (Date.now() - cached.timestamp < 60000)) {
        setTakenSlots(cached.slots);
        return;
      }

      setLoadingSlots(true);
      setTakenSlots([]); // Reset visuals while loading
      setSelectedTimeSlot(null); // Deselect time when changing day

      try {
        const taken = await supabaseApi.getTakenSlots(selectedDay, selectedBarber.id);

        // Save to cache
        slotsCache.current[cacheKey] = {
          slots: taken,
          timestamp: Date.now()
        };

        setTakenSlots(taken);
      } catch (error) {
        console.error("Failed to fetch slots", error);
        toast.error("Error al cargar horarios. Intenta de nuevo.");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedDay, selectedBarber]);

  const handleConfirm = () => {
    if (selectedDay && selectedTimeSlot) {
      setDate(selectedDay);
      setTime(selectedTimeSlot);
      setStep(5); // Go to Identity
    }
  };

  const checkSlotAvailability = (time: string) => {
    const today = startOfToday();

    // If selected day is in the past (stale state)
    if (selectedDay < today) {
      return { isTaken: false, isPast: true };
    }

    // Check Past Time for Today
    const now = new Date();
    const isToday = isSameDay(selectedDay, now);
    let isPast = false;

    if (isToday) {
      const slotHour = parseInt(time.split(':')[0]);
      const currentHour = now.getHours();

      if (slotHour <= currentHour) {
        isPast = true;
      }
    }
    return { isPast };
  };

  // Helper to check if a sequence of slots is available
  const checkSequentialAvailability = (startTime: string) => {
    const serviceCount = selectedServices.length || 1;
    let startHour = parseInt(startTime.split(':')[0]);

    for (let i = 0; i < serviceCount; i++) {
      const currentSlot = `${startHour.toString().padStart(2, '0')}:00`;

      // 1. Is it a valid slot in our system?
      const isValidSlot = [...morningSlots, ...afternoonSlots].includes(currentSlot);
      if (!isValidSlot) return { isUnavailable: true, reason: 'exceeds_hours' };

      // 2. Is it taken?
      if (takenSlots.includes(currentSlot)) return { isUnavailable: true, reason: 'taken' };

      // 3. Is it in the past?
      const { isPast } = checkSlotAvailability(currentSlot);
      if (isPast) return { isUnavailable: true, reason: 'past' };

      startHour++;
    }
    return { isUnavailable: false };
  };

  const handleSlotClick = (time: string) => {
    if (loadingSlots) return;

    // Sequential Check
    const { isUnavailable, reason } = checkSequentialAvailability(time);

    if (isUnavailable) {
      if (reason === 'past') {
        toast.error('Horario no disponible (Pasado)');
      } else if (reason === 'taken') {
        toast.error('Uno de los horarios necesarios está ocupado');
      } else if (reason === 'exceeds_hours') {
        toast.error('La duración total excede el horario de atención');
      }
      return;
    }

    // Success selection
    setSelectedTimeSlot(time);
  };

  const renderTimeSlot = (time: string) => {
    const { isUnavailable } = checkSequentialAvailability(time);
    const isSelected = selectedTimeSlot === time;

    return (
      <button
        key={time}
        onClick={() => handleSlotClick(time)}
        className={`
                  relative py-3 rounded-xl text-xs font-medium border transition-all duration-200
                  ${loadingSlots ? 'opacity-50 cursor-wait' : ''}
                  ${isUnavailable
            ? 'bg-white/5 border-white/5 text-white/20 decoration-white/20 line-through cursor-pointer'
            : isSelected
              ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105'
              : 'bg-white/5 border-white/10 text-white/80 hover:border-amber-500/50 hover:text-amber-500'
          }
              `}
      >
        {time}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full pt-8 px-6 pb-6 max-h-screen">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => setStep(3)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs font-medium text-white/40 tracking-widest uppercase">Paso 4 de 5</span>
      </header>

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Reserva tu lugar</h2>
        <div className="flex items-center space-x-2 text-white/50">
          <span>Agenda con <span className="text-amber-500">{selectedBarber?.nombre}</span></span>
          {loadingSlots && <Loader2 className="w-3 h-3 animate-spin text-amber-500" />}
        </div>
        {selectedServices.length > 1 && (
          <p className="text-xs text-amber-500/80 mt-1 pl-1">
            Se buscarán {selectedServices.length} horas consecutivas.
          </p>
        )}
      </div>

      {/* Date Scroller */}
      <div className="mb-8">
        <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all duration-200 ${isSelected
                  ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
              >
                <span className="text-xs font-medium uppercase">{format(day, 'EEE', { locale: es })}</span>
                <span className="text-xl font-bold">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Mañana</h3>
          <div className="grid grid-cols-4 gap-2">
            {morningSlots.map(renderTimeSlot)}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Tarde / Noche</h3>
          <div className="grid grid-cols-4 gap-2">
            {afternoonSlots.map(renderTimeSlot)}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 mt-auto border-t border-white/10">
        <button
          onClick={handleConfirm}
          disabled={!selectedTimeSlot}
          className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 ${selectedTimeSlot
            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            : 'bg-white/10 text-white/20 cursor-not-allowed'
            }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};