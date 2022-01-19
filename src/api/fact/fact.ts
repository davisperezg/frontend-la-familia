import axios from "axios";
import { Fact } from "../../interface/Fact";
import { API } from "../../lib/consts/const";

export const postCreateFact = async (fact: Fact) => {
  return await axios.post(`${API}/api/v1/facts`, fact);
};

export const getFacts = async () => {
  return await axios.get(`${API}/api/v1/facts`);
};

export const getFactDeleted = async () => {
  return await axios.get(`${API}/api/v1/facts/removes`);
};

export const deleteFact = async (id: string) => {
  return await axios.delete(`${API}/api/v1/facts/${id}`);
};

export const restoreFact = async (id: string) => {
  return await axios.put(`${API}/api/v1/facts/restore/${id}`);
};

export const updateFact = async (id: string, fact: Fact) => {
  return await axios.put(`${API}/api/v1/facts/${id}`, fact);
};
