declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
