import { createContext } from 'react';

export const LanguageChosenContext = createContext<{
  chosen: boolean;
  markChosen: () => void;
}>({ chosen: false, markChosen: () => {} });