"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { App, Button, Skeleton, Typography, Popconfirm } from "antd";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import RecipeForm from "../../RecipeForm";
import PasswordGate from "../../../components/PasswordGate";
import { getRecipe, updateRecipe, deleteRecipe, uploadImages } from "../../../../lib/recipes";
import { withTimeout } from "../../../../lib/utils";

const { Title, Text } = Typography;

function EditPageInner() {
  const { id } = useParams();
  const router = useRouter();
  const { message } = App.useApp();

  const [unlocked, setUnlocked] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getRecipe(id)
      .then((data) => {
        if (!data) setError("not_found");
        else setRecipe(data);
      })
      .catch(() => setError("fetch_error"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    const key = "recipe-update";
    message.loading({ content: "Saving changes…", key, duration: 0 });

    try {
      const newImages = formData.images.filter((img) => img.file);
      let imageUrls = [];

      if (newImages.length > 0) {
        const files = newImages.map((img) => img.file);
        const uploaded = await withTimeout(uploadImages(files, id), 60000);
        let uploadIndex = 0;
        formData.images.forEach((img) => {
          if (img.file) { imageUrls.push(uploaded[uploadIndex]); uploadIndex++; }
          else { imageUrls.push(img.url || img.preview); }
        });
      } else {
        imageUrls = formData.images.map((img) => img.url || img.preview).filter(Boolean);
      }

      const coverImage = imageUrls[formData.coverIndex] || imageUrls[0] || null;

      await updateRecipe(id, {
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
        images: imageUrls,
        coverImage,
        published: formData.published,
      });

      message.success({ content: "Recipe updated! ✓", key, duration: 3 });
      setTimeout(() => router.push(`/recipe/${id}`), 1200);
    } catch (err) {
      console.error(err);
      message.error({ content: err?.message || "Something went wrong.", key, duration: 4 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const key = "recipe-delete";
    message.loading({ content: "Deleting recipe…", key, duration: 0 });
    try {
      await deleteRecipe(id);
      message.success({ content: "Recipe deleted.", key, duration: 2 });
      setTimeout(() => router.push("/"), 800);
    } catch (err) {
      console.error(err);
      message.error({ content: "Failed to delete recipe.", key, duration: 3 });
      setDeleting(false);
    }
  };

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  if (loading) return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>
      <Skeleton.Input active style={{ width: 200, height: 36, marginBottom: 32 }} />
      <Skeleton active paragraph={{ rows: 6 }} style={{ marginBottom: 24 }} />
      <Skeleton active paragraph={{ rows: 8 }} style={{ marginBottom: 24 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
  );

  if (error === "not_found") return (
    <div style={{ textAlign: "center", padding: "80px 24px", background: "#faf8f4", minHeight: "100vh" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
      <Title level={3} style={{ fontFamily: "'Georgia', serif", color: "#2a2420" }}>
        Recipe not found
      </Title>
      <Text type="secondary">This recipe may have been deleted or never existed.</Text>
      <br /><br />
      <Link href="/">
        <Button style={{ borderRadius: 10 }}>Back to recipes</Button>
      </Link>
    </div>
  );

  if (error === "fetch_error") return (
    <div style={{ textAlign: "center", padding: "80px 24px", background: "#faf8f4", minHeight: "100vh" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <Title level={3} style={{ fontFamily: "'Georgia', serif", color: "#2a2420" }}>
        Something went wrong
      </Title>
      <Text type="secondary">Could not load the recipe. Check your connection and try again.</Text>
      <br /><br />
      <Button onClick={() => window.location.reload()} style={{ borderRadius: 10 }}>
        Retry
      </Button>
    </div>
  );

  if (!recipe) return null;

  const coverIndex = recipe.coverImage
    ? Math.max((recipe.images ?? []).indexOf(recipe.coverImage), 0)
    : 0;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px", background: "#faf8f4", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <Link
            href={`/recipe/${id}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#9c9086", fontSize: 13, fontWeight: 500, marginBottom: 14, textDecoration: "none" }}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} />
            Back to recipe
          </Link>
          <Title level={2} style={{ fontFamily: "'Georgia', serif", color: "#2a2420", marginBottom: 4 }}>
            Edit Recipe
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Update the details below and save when you're done.
          </Text>
        </div>

        <Popconfirm
          title="Delete this recipe?"
          description="This action cannot be undone."
          onConfirm={handleDelete}
          okText="Yes, delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, style: { borderRadius: 8 } }}
          cancelButtonProps={{ style: { borderRadius: 8 } }}
        >
          <Button danger icon={<DeleteOutlined />} loading={deleting} style={{ borderRadius: 10, marginTop: 28 }}>
            Delete
          </Button>
        </Popconfirm>
      </div>

      <RecipeForm
        initialData={{
          ...recipe,
          images: recipe.images ?? [],
          coverIndex,
          // Fallback for existing recipes that predate this field
          defaultMultiplier: recipe.defaultMultiplier ?? 1,
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEditing
      />
    </div>
  );
}

export default function EditRecipePage() {
  return (
    <App>
      <EditPageInner />
    </App>
  );
}