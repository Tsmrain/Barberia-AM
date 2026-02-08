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
  client: Client | null; // El cliente identificado
  clientPhoneInput: string; // Input temporal
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
  // Steps mapping:
  // 0: Hero
  // 1: Branch Selection (NEW)
  // 2: Services
  // 3: Barbers
  // 4: DateTime
  // 5: Identity
  // 6: Confirmation
  // 7: Success
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
        setDate: setDateState,
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