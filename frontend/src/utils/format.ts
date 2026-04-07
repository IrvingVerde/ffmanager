import { format } from 'date-fns';
import { MonedaType } from '../types';

export const formatCurrency = (amount: number, currency: MonedaType): string => {
  const symbol = currency === 'PEN' ? 'S/' : '$';
  return `${symbol} ${amount.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM, yyyy");
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, "d 'de' MMM, yyyy HH:mm");
  } catch {
    return dateString;
  }
};
