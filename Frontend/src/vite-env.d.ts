/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GMAPS_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }