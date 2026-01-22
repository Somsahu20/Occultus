import { useEffect } from "react";

export const useDocumentTitle = (title: string, resetOnUnmount: boolean = true) => {
    useEffect(() => {
      
      const previousTitle = document.title;
  
      // Update the tab title
      document.title = `${title} | Occultus`;
  
      
      return () => {
        if (resetOnUnmount) {
          document.title = previousTitle;
        }
      };
    }, [title, resetOnUnmount]);
  };