'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useBooking } from '../../store/BookingContext';
import { supabaseApi } from '../../lib/supabaseApi';
import { Client } from '../../types';

export const Identity: React.FC = () => {
  const { setStep, setClient, setClientPhoneInput, clientPhoneInput, client } = useBooking();

  const COUNTRY_CODE = '+591'; // Bolivia Only
  const [phone, setPhone] = useState(clientPhoneInput.replace(/^\+591\s?/, ''));
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [possibleMatches, setPossibleMatches] = useState<Client[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Debounce phone check
  useEffect(() => {
    const fullPhone = `${COUNTRY_CODE}${phone}`;

    // Validación más flexible (8 a 12 dígitos)
    const isValidLength = /^[67]\d{7}$/.test(phone);

    const checkPhone = async () => {
      if (isValidLength && !isEditingProfile) {
        setIsChecking(true);
        setError(null);
        try {
          const foundClient = await supabaseApi.checkClientByPhone(fullPhone);
          if (foundClient) {
            setClient(foundClient);
            setIsNewUser(false);
          } else {
            setClient(null);
            setIsNewUser(true);
          }
        } catch (e) {
          setError('Error de conexión');
        } finally {
          setIsChecking(false);
        }
      } else if (!isValidLength) {
        setClient(null);
        setIsNewUser(false);
      }
    };

    const timer = setTimeout(checkPhone, 500);
    return () => clearTimeout(timer);
  }, [phone, setClient, isEditingProfile]);

  // Debounce Name Search for New Users
  useEffect(() => {
    if (!isNewUser || !name || name.length <= 3) {
      setPossibleMatches([]);
      return;
    }

    const searchMatches = async () => {
      try {
        const matches = await supabaseApi.searchClientsByName(name);
        const fullPhone = `${COUNTRY_CODE}${phone}`;
        const others = matches.filter(m => m.celular !== fullPhone);
        setPossibleMatches(others);
      } catch (e) {
        console.error("Error searching clients", e);
      }
    };

    const timer = setTimeout(searchMatches, 600);
    return () => clearTimeout(timer);
  }, [name, isNewUser, phone]);

  const handleUpdateProfile = async () => {
    if (!client) return;

    const fullNewPhone = `${COUNTRY_CODE}${tempPhone}`;
    const oldPhone = client.celular;

    // Validación estricta para Bolivia
    if (!/^[67]\d{7}$/.test(tempPhone)) {
      setError('Número de teléfono inválido (debe ser 8 dígitos comenzando con 6 o 7)');
      return;
    }

    if (!name.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // 1. Update name if changed
      if (name !== client.nombre_completo) {
        await supabaseApi.updateClient(oldPhone, { nombre_completo: name });
      }

      // 2. Update phone if changed
      if (fullNewPhone !== oldPhone) {
        await supabaseApi.updateClientPhone(oldPhone, fullNewPhone);
        setPhone(tempPhone); // Sync main phone input
      }

      // 3. Refresh and exit
      const updated = await supabaseApi.checkClientByPhone(fullNewPhone);
      setClient(updated);
      setIsEditingProfile(false);
    } catch (e) {
      setError('Error al actualizar datos');
    } finally {
      setIsChecking(false);
    }
  };

  const handleContinue = async () => {
    const fullPhone = `${COUNTRY_CODE}${phone}`;
    setClientPhoneInput(fullPhone);

    if (isNewUser) {
      if (!name.trim()) {
        setError('Por favor escribe tu nombre');
        return;
      }
      // Create temp client in state
      setClient({
        celular: fullPhone,
        nombre_completo: name,
        ranking: 'nuevo' as any
      });
    }
    setStep(6); // Go to Confirmation
  };

  // Validation: 8 digits, starts with 6 or 7
  const isValidLength = /^[67]\d{7}$/.test(phone);

  return (
    <div className="flex flex-col h-full pt-8 px-6 pb-6">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => setStep(4)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs font-medium text-white/40 tracking-widest uppercase">Identificación</span>
      </header>

      <div className="flex-1 flex flex-col justify-center pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          {!isEditingProfile && (
            <>
              <h2 className="text-2xl font-medium text-white/80">
                ¿Cuál es tu número celular?
              </h2>

              {/* Phone Input Container */}
              <div className="relative max-w-sm mx-auto flex items-end gap-3 justify-center">

                {/* Static Country Code */}
                <div className="flex items-center border-b-2 border-white/20 pb-2 mb-[1px]">
                  <span className="text-3xl mr-2">🇧🇴</span>
                  <span className="text-xl font-bold text-white/50">{COUNTRY_CODE}</span>
                </div>

                {/* Number Input */}
                <div className="relative flex-1">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      // Only numbers, max 8
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setPhone(val);
                    }}
                    placeholder="70000000"
                    className="w-full bg-transparent border-b-2 border-white/20 text-3xl font-bold text-white placeholder-white/10 focus:outline-none focus:border-amber-500 transition-colors py-2 text-left tracking-widest"
                    autoFocus
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    {isChecking && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
                    {!isChecking && client && isValidLength && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </div>
                </div>
              </div>
              {!isValidLength && phone.length > 0 && (
                <p className="text-red-500 text-xs mt-2">Debe ser un número válido (8 dígitos comenzando con 6 o 7)</p>
              )}
            </>
          )}

          <AnimatePresence mode="wait">
            {/* CASE A: RETURNING USER */}
            {!isChecking && client && !isNewUser && (
              <motion.div
                key="returning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 rounded-3xl p-6 border border-white/10 w-full max-w-sm mx-auto shadow-2xl backdrop-blur-sm"
              >
                {isEditingProfile ? (
                  <div className="space-y-6">
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4">Actualizar Datos</h3>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-white/30 ml-1">Nombre Completo</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s\u00C0-\u00FF]/g, ''))}
                            placeholder="Tu nombre"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all"
                            autoFocus
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-white/30 ml-1">Número de Celular</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-medium">
                              {COUNTRY_CODE}
                            </span>
                            <input
                              type="tel"
                              value={tempPhone}
                              onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-16 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 transition-colors"
                      >
                        CANCELAR
                      </button>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={isChecking}
                        className="flex-1 py-3 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                      >
                        {isChecking ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'GUARDAR'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xl text-white font-medium">
                      ¡Hola de nuevo, <span className="text-amber-500 font-bold">{client.nombre_completo}</span>! 👋
                    </p>
                    <div className="flex items-center justify-center gap-4">

                      <button
                        onClick={() => {
                          setName(client.nombre_completo);
                          setTempPhone(client.celular.replace(COUNTRY_CODE, ''));
                          setIsEditingProfile(true);
                        }}
                        className="text-xs text-amber-500/70 hover:text-amber-500 transition-colors underline underline-offset-4"
                      >
                        Actualizar datos
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* CASE B: NEW USER */}
            {!isChecking && isNewUser && isValidLength && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 pt-4 w-full max-w-md mx-auto"
              >
                <div className="space-y-4">
                  <p className="text-white/60 text-sm">Parece que es tu primera vez. ¿Cómo te llamas?</p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value.replace(/[^a-zA-Z\s\u00C0-\u00FF]/g, ''));
                    }}
                    placeholder="Tu Nombre Completo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                {/* RECOVERY SUGGESTION */}
                {possibleMatches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-left space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-full text-blue-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">¿Ya tienes cuenta?</p>
                        <p className="text-blue-200/60 text-xs mt-1">
                          Encontramos un cliente registrado como <strong>{possibleMatches[0].nombre_completo}</strong> con otro número.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const oldClient = possibleMatches[0];
                        const newPhone = `${COUNTRY_CODE}${phone}`;

                        // Update in backend
                        await supabaseApi.updateClientPhone(oldClient.celular, newPhone);


                        // Update local state
                        const updated = await supabaseApi.checkClientByPhone(newPhone);
                        setClient(updated);
                        setIsNewUser(false);
                        setPossibleMatches([]);
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                      Si, soy yo. Actualizar mi número
                    </button>
                    <p className="text-center text-[10px] text-white/20">
                      Si no eres tú, simplemente ignora esto y continúa.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-red-500 text-sm">{error}</p>}

        </motion.div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleContinue}
          disabled={!isValidLength || (isNewUser && name.length < 2) || isChecking || isEditingProfile}
          className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 ${isValidLength && (!isNewUser || name.length >= 2) && !isEditingProfile
            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transform hover:scale-[1.02]'
            : 'bg-white/10 text-white/20 cursor-not-allowed'
            }`}
        >
          {client && !isNewUser ? 'Confirmar Identidad' : 'Guardar y Continuar'}
        </button>
      </div>
    </div>
  );
};