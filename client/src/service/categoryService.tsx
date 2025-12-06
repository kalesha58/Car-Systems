import {appAxios} from './apiInterceptors';

export interface ICategory {
  id: string;
  name: string;
  description?: string;
  status: string;
  products?: number;
  createdAt: string;
}

export interface ICategoriesResponse {
  categories: ICategory[];
}

export const getCategories = async (status?: string): Promise<ICategoriesResponse> => {
  try {
    const params = status ? {status} : {};
    const response = await appAxios.get<{categories: ICategory[]}>('/admin/categories', {
      params,
    });
    return {
      categories: response.data.categories || [],
    };
  } catch (error) {
    throw error;
  }
};

