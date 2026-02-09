'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Barber, Service, Client, Branch } from '../types';

interface BookingState {
  step: number;
  selectedBranch: Branch | null;
  selectedService: Service | null;
  selectedBarber: Barber | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  client: Client | null;
  clientPhoneInput: string;
}

interface BookingContextType extends BookingState {
  setStep: (step: number) => void;
  setBranch: (branch: Branch) => void;
  setService: (service: Service) => void;
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
  const [selectedService, setServiceState] = useState<Service | null>(null);
  const [selectedBarber, setBarberState] = useState<Barber | null>(null);
  const [selectedDate, setDateState] = useState<Date | null>(null);
  const [selectedTime, setTimeState] = useState<string | null>(null);
  const [client, setClientState] = useState<Client | null>(null);
  const [clientPhoneInput, setClientPhoneInputState] = useState<string>('');

  const resetBooking = () => {
    setStep(0);
    setBranchState(null);
    setServiceState(null);
    setBarberState(null);
    setDateState(null);
    setTimeState(null);
    setClientState(null);
    setClientPhoneInputState('');
  };

  return (
    <BookingContext.Provider
      value={{
        step,
        selectedBranch,
        selectedService,
        selectedBarber,
        selectedDate,
        selectedTime,
        client,
        clientPhoneInput,
        setStep,
        setBranch: setBranchState,
        setService: setServiceState,
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