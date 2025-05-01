"use client"

import { useEffect } from 'react';

export function ForceSidebarClosed() {
  useEffect(() => {
    const forceSidebarClosed = () => {
      // Force clear any stored sidebar state
      document.cookie = "sidebar:state=false; path=/; max-age=0";
      document.cookie = "sidebar-state=false; path=/; max-age=0";
      
      // Add a class to the root element to force the sidebar closed
      document.documentElement.style.setProperty('--sidebar-width', '4rem');
      document.documentElement.classList.add('force-sidebar-closed');
      
      // Force any sidebar elements to be collapsed
      const sidebarElements = document.querySelectorAll('[data-sidebar="sidebar"]');
      sidebarElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.width = '4rem';
          element.style.transition = 'none';
        }
      });
    };

    // Run immediately
    forceSidebarClosed();
    
    // Run again after a short delay to ensure it takes effect
    const timer = setTimeout(forceSidebarClosed, 100);
    
    // Run on any navigation or state changes
    const observer = new MutationObserver(forceSidebarClosed);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.documentElement.classList.remove('force-sidebar-closed');
    };
  }, []);

  return null;
} 