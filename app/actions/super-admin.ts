"use server";

import { createClient as createDirectClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/actions";
import { revalidatePath } from "next/cache";

export async function createOperator(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  const { data, error } = await supabase
    .from("operators")
    .insert({ name, contact: formData.get("contact") as string, status: "active" })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Failed to create operator" };

  const logoFile = formData.get("logo") as File | null;
  const logoUrl = formData.get("logo_url") as string | null;
  let logo_url: string | null = null;

  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop() ?? "png";
    const filePath = `operator-${data.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("operator-logos")
      .upload(filePath, logoFile, { upsert: true });
    if (uploadError) return { error: uploadError.message };
    logo_url = supabase.storage.from("operator-logos").getPublicUrl(filePath).data.publicUrl;
  } else if (logoUrl) {
    logo_url = logoUrl;
  }

  if (logo_url) {
    const { error: updateError } = await supabase
      .from("operators")
      .update({ logo_url })
      .eq("id", data.id);
    if (updateError) return { error: updateError.message };
  }

  revalidatePath("/super-admin/operators");
}

export async function updateOperator(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const updates: Record<string, string | null> = {
    name: formData.get("name") as string,
    contact: formData.get("contact") as string,
    status: formData.get("status") as string,
  };

  const removeLogo = formData.get("remove_logo") === "true";

  if (removeLogo) {
    updates.logo_url = null;
  } else {
    const logoFile = formData.get("logo") as File | null;
    if (logoFile && logoFile.size > 0) {
      const ext = logoFile.name.split(".").pop() ?? "png";
      const filePath = `operator-${id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("operator-logos")
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) return { error: uploadError.message };

      const { data: publicUrl } = supabase.storage
        .from("operator-logos")
        .getPublicUrl(filePath);

      updates.logo_url = publicUrl.publicUrl;
    } else {
      const logoUrl = formData.get("logo_url") as string | null;
      if (logoUrl) {
        updates.logo_url = logoUrl;
      }
    }
  }

  const { error } = await supabase.from("operators").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/super-admin/operators");
}

export async function toggleOperatorStatus(id: string, status: string) {
  const supabase = await createClient();
  const newStatus = status === "active" ? "inactive" : "active";

  const { error } = await supabase
    .from("operators")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/super-admin/operators");
}

export async function updateUserRole(id: string, role: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("users").update({ role }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/super-admin/users");
}

export async function createPromotion(formData: FormData) {
  const supabase = await createClient();

  const data: Record<string, string | number | boolean | null> = {
    code: (formData.get("code") as string).toUpperCase().trim(),
    discount_type: formData.get("discount_type") as string,
    discount_value: Number(formData.get("discount_value")),
  };

  const minPurchase = formData.get("min_purchase") as string;
  if (minPurchase) data.min_purchase = Number(minPurchase);

  const maxUsage = formData.get("max_usage") as string;
  if (maxUsage) data.max_usage = Number(maxUsage);

  const maxPerUser = formData.get("max_per_user") as string;
  if (maxPerUser) data.max_per_user = Number(maxPerUser);

  const expiresAt = formData.get("expires_at") as string;
  if (expiresAt) data.expires_at = expiresAt;

  const { error } = await supabase.from("promotions").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/super-admin/promotions");
}

export async function updatePromotion(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const data: Record<string, string | number | boolean | null> = {
    code: (formData.get("code") as string).toUpperCase().trim(),
    discount_type: formData.get("discount_type") as string,
    discount_value: Number(formData.get("discount_value")),
    is_active: formData.get("is_active") === "true",
  };

  const minPurchase = formData.get("min_purchase") as string;
  data.min_purchase = minPurchase ? Number(minPurchase) : null;

  const maxUsage = formData.get("max_usage") as string;
  data.max_usage = maxUsage ? Number(maxUsage) : null;

  const maxPerUser = formData.get("max_per_user") as string;
  data.max_per_user = maxPerUser ? Number(maxPerUser) : null;

  const expiresAt = formData.get("expires_at") as string;
  data.expires_at = expiresAt || null;

  const { error } = await supabase.from("promotions").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/super-admin/promotions");
}

export async function togglePromotionStatus(id: string, current: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("promotions")
    .update({ is_active: !current })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/super-admin/promotions");
}

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const operatorId = formData.get("operator_id") as string;

  const client = createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authData, error: signUpError } = await client.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });

  if (signUpError) return { error: signUpError.message };
  if (!authData.user) return { error: "Failed to create user" };

  const updates: Record<string, string> = { role, status: "active" };
  if (operatorId) updates.operator_id = operatorId;

  const { error: updateError } = await client
    .from("users")
    .update(updates)
    .eq("id", authData.user.id);

  if (updateError) return { error: updateError.message };
  revalidatePath("/super-admin/users");
}

export async function toggleUserStatus(id: string, status: string) {
  const supabase = await createClient();
  const newStatus = status === "active" ? "suspended" : "active";

  const { error } = await supabase
    .from("users")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/super-admin/users");
}
