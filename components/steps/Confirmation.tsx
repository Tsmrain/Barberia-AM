'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, MapPin, Scissors, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBooking } from '../../store/BookingContext';
import { supabaseApi } from '../../lib/supabaseApi';

export const Confirmation: React.FC = () => {
  const { setStep, selectedService, selectedBarber, selectedDate, selectedTime, selectedBranch, client } = useBooking();
  const [isBooking, setIsBooking] = useState(false);

  const handleBooking = async () => {
    setIsBooking(true);
    try {
      // 1. Ensure client exists in DB (Idempotency Check)
      const existing = await supabaseApi.checkClientByPhone(client!.celular);

      if (!existing) {
        // If not found, create it now
        await supabaseApi.createClient(client!.celular, client!.nombre_completo);
      } else if (client!.ranking === 'nuevo' && existing.ranking !== 'nuevo') {
        // Optional: Update local context if DB has better info
      }

      // 2. Create Booking
      await supabaseApi.createBooking({
        clientPhone: client!.celular,
        serviceId: selectedService!.id,
        barberId: selectedBarber!.id,
        date: selectedDate!,
        time: selectedTime!,
        branchId: selectedBranch!.id
      });

      setStep(7); // Success
    } catch (error) {
      console.error("Booking Error:", error);
      alert("Ocurrió un error al confirmar la reserva. Por favor intenta de nuevo.");
      setIsBooking(false);
    }
  };

  if (!selectedService || !selectedBarber || !selectedDate || !client || !selectedBranch) return null;

  return (
    <div className="flex flex-col h-full pt-8 px-6 pb-6">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => setStep(5)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs font-medium text-white/40 tracking-widest uppercase">Confirmación</span>
      </header>

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">Todo listo, {client.nombre_completo.split(' ')[0]}.</h2>
        <p className="text-white/50">Revisa los detalles antes de confirmar.</p>
      </div>

      {/* Ticket Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white text-black rounded-3xl overflow-hidden relative shadow-2xl"
      >
        {/* Perforated Top Effect */}
        <div className="h-4 bg-amber-500 w-full" />

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start border-b border-black/10 pb-4">
            <div>
              <p className="text-xs text-black/50 uppercase tracking-wider mb-1">Servicio</p>
              <h3 className="text-xl font-bold">{selectedService.nombre}</h3>
              <p className="text-sm text-black/60">{selectedService.precio} Bs • {selectedService.duracion_min} min</p>
            </div>
            <Scissors className="w-6 h-6 text-amber-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-black/50 uppercase tracking-wider mb-1">Barbero</p>
              <div className="flex items-center space-x-2">
                <img src={selectedBarber.foto_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                <span className="font-semibold">{selectedBarber.nombre}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-black/50 uppercase tracking-wider mb-1">Ubicación</p>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-black/60" />
                <span className="font-semibold text-sm">{selectedBranch.nombre}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-black/50 uppercase tracking-wider mb-1">Fecha</p>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-black/60" />
                <span className="font-semibold capitalize">{format(selectedDate, 'MMM dd', { locale: es })}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-black/50 uppercase tracking-wider mb-1">Hora</p>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-black/60" />
                <span className="font-semibold">{selectedTime}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
              {client.nombre_completo.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-black/50 uppercase">Cliente</p>
              <p className="font-medium text-sm">{client.nombre_completo}</p>
              <p className="text-xs text-black/40">{client.celular}</p>
            </div>
          </div>
        </div>

        {/* Ticket Rip Effect Bottom */}
        <div className="relative h-4 bg-gray-50 mt-2">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{
              background: "radial-gradient(circle, transparent 5px, #f9fafb 5px)",
              backgroundSize: "15px 15px",
              backgroundPosition: "0 10px"
            }}
          />
        </div>
      </motion.div>

      <div className="mt-auto pt-6">
        <button
          onClick={handleBooking}
          disabled={isBooking}
          className="w-full py-4 rounded-full bg-amber-500 text-black font-bold text-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300 flex items-center justify-center space-x-2"
        >
          {isBooking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Confirmando...</span>
            </>
          ) : (
            <span>Confirmar Reserva</span>
          )}
        </button>
      </div>
    </div>
  );
};