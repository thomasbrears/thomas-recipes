"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Typography } from "antd";
import RecipeForm from "./RecipeForm";
import PasswordGate from "../components/PasswordGate";
import { addRecipe, uploadImages } from "../../lib/recipes";
import { withTimeout } from "../../lib/utils";

const { Title, Text } = Typography;

function AdminPageInner() {
  const router = useRouter();
  const { message } = App.useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    if (!formData.title) return;
    setSubmitting(true);
    const key = "recipe-save";
    message.loading({ content: "Saving recipe…", key, duration: 0 });

    try {
      const tempId = `temp_${Date.now()}`;
      const newImages = formData.images.filter((img) => img.file);
      const existingImages = formData.images.filter((img) => !img.file);
      let uploadedUrls = [];

      if (newImages.length > 0) {
        const files = newImages.map((img) => img.file);
        const uploaded = await withTimeout(uploadImages(files, tempId), 60000);
        let uploadIndex = 0;
        formData.images.forEach((img) => {
          if (img.file) { uploadedUrls.push(uploaded[uploadIndex]); uploadIndex++; }
          else { uploadedUrls.push(img.url); }
        });
      } else {
        uploadedUrls = existingImages.map((img) => img.url);
      }

      const coverImage = uploadedUrls[formData.coverIndex] || uploadedUrls[0] || null;

      const id = await addRecipe({
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        tags: formData.tags,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        servings: formData.servings,
        difficulty: formData.difficulty,
        defaultMultiplier: formData.defaultMultiplier ?? 1,
        ingredients: formData.ingredients,
        steps: formData.steps,
        notes: formData.notes,
        images: uploadedUrls,
        coverImage,
        published: formData.published,
      });

      message.success({
        content: formData.published ? "Recipe published! 🎉" : "Draft saved!",
        key,
        duration: 3,
      });

      setTimeout(() => {
        router.push(formData.published ? `/recipe/${id}` : "/admin");
      }, 1200);
    } catch (err) {
      console.error(err);
      message.error({
        content: err?.message || "Something went wrong. Please try again.",
        key,
        duration: 4,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px", background: "#faf8f4", minHeight: "100vh" }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ fontFamily: "'Georgia', serif", color: "#2a2420", marginBottom: 6 }}>
          Add New Recipe
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Fill in the details below and hit publish when you're ready.
        </Text>
      </div>
      <RecipeForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <App>
      <AdminPageInner />
    </App>
  );
}