import { useState, useEffect } from 'react';

type ScreenSizeCategory = 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

const BREAKPOINTS: Record<Exclude<ScreenSizeCategory, 'mobile'>, number> = {
  sm: 768,    // Petites tablettes, petits laptops
  md: 1024,   // Laptops classiques
  lg: 1280,   // Grands laptops / desktops standards
  xl: 1536,   // Écrans larges
  xxl: 1920,  // Ultra-wide / écrans 2K/4K
};

export function useScreenSizeCategory(): ScreenSizeCategory {
  const [category, setCategory] = useState<ScreenSizeCategory>(() => {
    // Initialisation côté serveur
    if (typeof window === 'undefined') return 'mobile';
    
    // Initialisation côté client
    const width = window.innerWidth;
    return Object.entries(BREAKPOINTS)
      .reverse()
      .find(([_, breakpoint]) => width >= breakpoint)?.[0] as ScreenSizeCategory || 'mobile';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newCategory = Object.entries(BREAKPOINTS)
        .reverse()
        .find(([_, breakpoint]) => width >= breakpoint)?.[0] as ScreenSizeCategory || 'mobile';
      
      if (newCategory !== category) {
        setCategory(newCategory);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [category]);

  return category;
}