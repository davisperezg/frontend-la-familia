import axios from "axios";
import { Token } from "../../interface/Token";
import { API } from "../../lib/consts/const";

export const postLogin = async (
  username: string,
  password: string
): Promise<Token> => {
  console.log(`${API}/api/v1/auth/login`);
  return await axios.post(`${API}/api/v1/auth/login`, {
    username,
    password,
  });
};

export const getRefresh = async (
  username: string,
  refreshToken: string
): Promise<Token> => {
  return await axios.post(`${API}/api/v1/auth/token`, {
    username,
    refreshToken,
  });
};
