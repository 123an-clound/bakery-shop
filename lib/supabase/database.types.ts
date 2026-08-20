export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      bakery: {
        Row: {
          created_at: string;
          data: Json;
          id: number;
          parent_id: number | null;
          slug: string | null;
          sort_order: number;
          status: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          id?: number;
          parent_id?: number | null;
          slug?: string | null;
          sort_order?: number;
          status?: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          id?: number;
          parent_id?: number | null;
          slug?: string | null;
          sort_order?: number;
          status?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bakery_parent_fk";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "bakery";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bakery_parent_fk";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "v_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bakery_parent_fk";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "v_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bakery_parent_fk";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "v_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bakery_parent_fk";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "v_reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          display_order: number;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          display_order?: number;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          display_order?: number;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      kho_iphone: {
        Row: {
          "Dung Lượng RAM/ROM": string | null;
          Giá: string | null;
          "Hình ảnh sản phẩm 1": string | null;
          "Hình ảnh sản phẩm 2": string | null;
          "Hình ảnh sản phẩm 3": string | null;
          "Hình ảnh sản phẩm 4": string | null;
          "Hình ảnh sản phẩm 5": string | null;
          "Hình ảnh sản phẩm 6": string | null;
          id: number;
          "Mã sản phẩm": string | null;
          "Mô tả": string | null;
          stt: string | null;
          "Tên sản phẩm": string | null;
        };
        Insert: {
          "Dung Lượng RAM/ROM"?: string | null;
          Giá?: string | null;
          "Hình ảnh sản phẩm 1"?: string | null;
          "Hình ảnh sản phẩm 2"?: string | null;
          "Hình ảnh sản phẩm 3"?: string | null;
          "Hình ảnh sản phẩm 4"?: string | null;
          "Hình ảnh sản phẩm 5"?: string | null;
          "Hình ảnh sản phẩm 6"?: string | null;
          id: number;
          "Mã sản phẩm"?: string | null;
          "Mô tả"?: string | null;
          stt?: string | null;
          "Tên sản phẩm"?: string | null;
        };
        Update: {
          "Dung Lượng RAM/ROM"?: string | null;
          Giá?: string | null;
          "Hình ảnh sản phẩm 1"?: string | null;
          "Hình ảnh sản phẩm 2"?: string | null;
          "Hình ảnh sản phẩm 3"?: string | null;
          "Hình ảnh sản phẩm 4"?: string | null;
          "Hình ảnh sản phẩm 5"?: string | null;
          "Hình ảnh sản phẩm 6"?: string | null;
          id?: number;
          "Mã sản phẩm"?: string | null;
          "Mô tả"?: string | null;
          stt?: string | null;
          "Tên sản phẩm"?: string | null;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          category_id: string;
          created_at: string;
          description: string;
          display_order: number;
          id: string;
          image_url: string;
          is_available: boolean;
          is_featured: boolean;
          name: string;
          price: number;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string;
          display_order?: number;
          id?: string;
          image_url?: string;
          is_available?: boolean;
          is_featured?: boolean;
          name: string;
          price: number;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string;
          display_order?: number;
          id?: string;
          image_url?: string;
          is_available?: boolean;
          is_featured?: boolean;
          name?: string;
          price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_categories: {
        Row: {
          created_at: string | null;
          data: Json | null;
          icon: string | null;
          id: number | null;
          name_i18n: Json | null;
          parent_id: number | null;
          slug: string | null;
          sort_order: number | null;
          status: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bakery_parent_fk";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "bakery";
            referencedColumns: ["id"];
          },
        ];
      };
      v_orders: {
        Row: {
          code: string | null;
          created_at: string | null;
          customer_name: string | null;
          data: Json | null;
          discount: number | null;
          id: number | null;
          payment_method: string | null;
          phone: string | null;
          shipping_fee: number | null;
          status: string | null;
          subtotal: number | null;
          total: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      v_products: {
        Row: {
          category_id: number | null;
          created_at: string | null;
          data: Json | null;
          id: number | null;
          images: Json | null;
          is_featured: boolean | null;
          name_i18n: Json | null;
          price: number | null;
          sale_price: number | null;
          sku: string | null;
          slug: string | null;
          sort_order: number | null;
          status: string | null;
          stock: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bakery_parent_fk";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "bakery";
            referencedColumns: ["id"];
          },
        ];
      };
      v_revenue_daily: {
        Row: {
          day: string | null;
          orders_count: number | null;
          revenue: number | null;
        };
        Relationships: [];
      };
      v_reviews: {
        Row: {
          author: string | null;
          content: string | null;
          created_at: string | null;
          data: Json | null;
          id: number | null;
          product_id: number | null;
          rating: number | null;
          status: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bakery_parent_fk";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "bakery";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      bakery_next_order_code: { Args: Record<string, never>; Returns: string };
      bakery_unaccent: { Args: { txt: string }; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
