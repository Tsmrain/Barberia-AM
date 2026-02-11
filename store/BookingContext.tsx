'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Barber, Service, Client, Branch } from '../types';

interface BookingState {
  step: number;
  selectedBranch: Branch | null;
  selectedServices: Service[];
  selectedBarber: Barber | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  client: Client | null;
  clientPhoneInput: string;
}

interface BookingContextType extends BookingState {
  setStep: (step: number) => void;
  setBranch: (branch: Branch) => void;
  toggleService: (service: Service) => void;
  setBarber: (barber: Barber) => void;
  setDate: (date: Date) => void;
  setTime: (time: string) => void;
  setClient: (client: Client | null) => void;
  setClientPhoneInput: (phone: string) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [step, setStep] = useState(0);
  const [selectedBranch, setBranchState] = useState<Branch | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarber, setBarberState] = useState<Barber | null>(null);
  const [selectedDate, setDateState] = useState<Date | null>(null);
  const [selectedTime, setTimeState] = useState<string | null>(null);
  const [client, setClientState] = useState<Client | null>(null);
  const [clientPhoneInput, setClientPhoneInputState] = useState<string>('');

  const STORAGE_KEY = 'booking_session_v1';
  const TIMEOUT_MS = 60 * 60 * 1000; // 1 Hour

  // 1. Load Session on Mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const age = Date.now() - parsed.timestamp;

        if (age < TIMEOUT_MS) {
          // Restore State
          setStep(parsed.step || 0);
          setBranchState(parsed.selectedBranch);
          setSelectedServices(parsed.selectedServices || []);
          setBarberState(parsed.selectedBarber);
          // Restore Date object from string
          if (parsed.selectedDate) {
            setDateState(new Date(parsed.selectedDate));
          }
          setTimeState(parsed.selectedTime);
          setClientState(parsed.client);
          setClientPhoneInputState(parsed.clientPhoneInput || '');
        } else {
          // Verify timeout: Clear stale data
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error("Failed to restore session", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // 2. Save Session on Change
  useEffect(() => {
    const sessionData = {
      timestamp: Date.now(), // Refresh timer on activity
      step,
      selectedBranch,
      selectedServices,
      selectedBarber,
      selectedDate,
      selectedTime,
      client,
      clientPhoneInput
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  }, [step, selectedBranch, selectedServices, selectedBarber, selectedDate, selectedTime, client, clientPhoneInput]);

  const resetBooking = () => {
    localStorage.removeItem(STORAGE_KEY); // Clear session
    setStep(0);
    setBranchState(null);
    setSelectedServices([]);
    setBarberState(null);
    setDateState(null);
    setTimeState(null);
    setClientState(null);
    setClientPhoneInputState('');
  };

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  return (
    <BookingContext.Provider
      value={{
        step,
        selectedBranch,
        selectedServices,
        selectedBarber,
        selectedDate,
        selectedTime,
        client,
        clientPhoneInput,
        setStep,
        setBranch: setBranchState,
        toggleService,
        setBarber: setBarberState,
        setDate: (date: Date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Normalize to start of day

          // Allow setting "today" but not "yesterday"
          if (date < today) {
            console.error("Attempted to set a past date");
            return;
          }
          setDateState(date);
        },
        setTime: setTimeState,
        setClient: setClientState,
        setClientPhoneInput: setClientPhoneInputState,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};