import argon2 from "argon2";

export const hashpassword = (password: string) => {
  return argon2.hash(password);
};

export const verifypassword = (password: string, hash: string) => {
  return argon2.verify(hash, password);
};
