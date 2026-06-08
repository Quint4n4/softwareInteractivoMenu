import { api } from "./client";

export interface Tema {
  color_primario: string;
  color_secundario: string;
  tipografia: string;
  logo: string | null;
  portada: string | null;
}

export interface NegocioBrand {
  id: string;
  nombre: string;
  slug: string;
  tipo_negocio: string;
  modo_vitrina: string;
  idioma_default: string;
  idiomas: string[];
}

export interface Branding {
  negocio: NegocioBrand;
  tema: Tema;
}

export async function getBranding(): Promise<Branding> {
  const { data } = await api.get<Branding>("/auth/branding/");
  return data;
}

export async function patchBranding(payload: {
  negocio?: Partial<NegocioBrand>;
  tema?: Partial<Tema>;
}): Promise<Branding> {
  const { data } = await api.patch<Branding>("/auth/branding/", payload);
  return data;
}

export async function uploadLogo(file: File): Promise<Tema> {
  const form = new FormData();
  form.append("logo", file);
  const { data } = await api.post<{ tema: Tema }>("/auth/branding/logo/", form);
  return data.tema;
}

export async function deleteLogo(): Promise<Tema> {
  const { data } = await api.delete<{ tema: Tema }>("/auth/branding/logo/");
  return data.tema;
}
