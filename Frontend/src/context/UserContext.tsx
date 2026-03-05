import { createContext, useContext, useState } from "react";

interface UserContextType {
  avatar: string | null;
  setAvatar: (userId: string, avatar: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [avatar, setAvatarState] = useState<string | null>(null);

  const setAvatar = (userId: string, newAvatar: string) => {
    // Store with user-specific key
    localStorage.setItem(`userAvatar_${userId}`, newAvatar);
    setAvatarState(newAvatar);
  };

  const getAvatarForUser = (userId: string) => {
    return localStorage.getItem(`userAvatar_${userId}`);
  };

  return (
    <UserContext.Provider
      value={{
        avatar,
        setAvatar,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
