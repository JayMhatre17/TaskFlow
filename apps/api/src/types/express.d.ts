declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string;
      role: "USER" | "ADMIN";
      isProtectedAdmin: boolean;
      mustChangePassword: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
