import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const fetchStore = async () => {
  const { data } = await axios.get(`${API}/store`);
  return data;
};

export const fetchSidebar = async () => {
  const { data } = await axios.get(`${API}/sidebar`);
  return data;
};

export const createBasket = async (completeUrl, cancelUrl) => {
  const { data } = await axios.post(`${API}/basket/create`, {
    complete_url: completeUrl,
    cancel_url: cancelUrl,
  });
  return data;
};

export const addItemsToBasket = async (ident, items) => {
  const { data } = await axios.post(`${API}/basket/add`, { ident, items });
  return data;
};

export const formatPrice = (value, currency = "EUR") => {
  try {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(value);
  } catch {
    return `${Number(value).toFixed(2)} ${currency}`;
  }
};
