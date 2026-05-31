import { supabase } from "../lib/supabase";

export interface ProductSummary {
  id: string;
  product_code: string;
  name: string;
  category: string | null;
  unit: string | null;
  batch_count: number;
  stock_quantity: number;
  created_at: string;
}

type ProductRow = {
  product_id: string;
  product_code: string;
  product_name: string;
  product_category: string | null;
  unit: string | null;
  deleted_at: string | null;
};

type BatchRow = {
  product_id: string | null;
  quantity: number | null;
  deleted_at: string | null;
};

export const productsService = {
  async createProduct(productData: {
    product_code: string;
    product_name: string;
    product_category?: string | null;
    unit?: string | null;
  }): Promise<ProductSummary> {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          product_code: productData.product_code,
          product_name: productData.product_name,
          product_category: productData.product_category || null,
          unit: productData.unit || null,
        },
      ])
      .select("product_id, product_code, product_name, product_category, unit")
      .single();

    if (error) throw error;

    return {
      id: data.product_id,
      product_code: data.product_code,
      name: data.product_name,
      category: data.product_category,
      unit: data.unit,
      batch_count: 0,
      stock_quantity: 0,
      created_at: "",
    };
  },

  async getProducts(): Promise<ProductSummary[]> {
    const [productsResult, batchesResult] = await Promise.all([
      supabase
        .from("products")
        .select(
          "product_id, product_code, product_name, product_category, unit, deleted_at",
        )
        .is("deleted_at", null)
        .order("product_code", { ascending: true }),
      supabase
        .from("product_batch")
        .select("product_id, quantity, deleted_at, status"),
    ]);

    const { data: products, error: productsError } = productsResult;
    const { data: batches, error: batchesError } = batchesResult;

    if (productsError) throw productsError;
    if (batchesError) throw batchesError;

    const totals = new Map<
      string,
      { batch_count: number; stock_quantity: number }
    >();

    (batches || []).forEach((batch: BatchRow) => {
      if (!batch.product_id || batch.deleted_at) {
        return;
      }

      const current = totals.get(batch.product_id) || {
        batch_count: 0,
        stock_quantity: 0,
      };
      current.batch_count += 1;
      current.stock_quantity += batch.quantity || 0;
      totals.set(batch.product_id, current);
    });

    return ((products || []) as ProductRow[]).map((product) => {
      const totalsForProduct = totals.get(product.product_id) || {
        batch_count: 0,
        stock_quantity: 0,
      };

      return {
        id: product.product_id,
        product_code: product.product_code,
        name: product.product_name,
        category: product.product_category,
        unit: product.unit,
        batch_count: totalsForProduct.batch_count,
        stock_quantity: totalsForProduct.stock_quantity,
        created_at: "",
      };
    });
  },

  async updateProduct(
    id: string,
    updates: {
      product_code?: string;
      product_name?: string;
      product_category?: string | null;
      unit?: string | null;
    },
  ): Promise<void> {
    const { error } = await supabase
      .from("products")
      .update({
        product_code: updates.product_code,
        product_name: updates.product_name,
        product_category: updates.product_category,
        unit: updates.unit,
      })
      .eq("product_id", id);

    if (error) throw error;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("product_id", id);

    if (error) throw error;
  },

  async deleteProducts(ids: string[]): Promise<void> {
    if (!ids.length) {
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .in("product_id", ids);

    if (error) throw error;
  },
};
