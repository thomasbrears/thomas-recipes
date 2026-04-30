import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

const colors = {
  title: "#1a1a1a",
  heading: "#2d2d2d",
  body: "#3d3d3d",
  muted: "#777777",
  accent: "#c0392b",
  border: "#e8e8e8",
  tagBg: "#f5f5f5",
  infoBg: "#fafafa",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: colors.white,
    paddingTop: 48,
    paddingBottom: 72,
    paddingHorizontal: 48,
  },
  titleBlock: { marginBottom: 16 },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: colors.title,
    lineHeight: 1.25,
    marginBottom: 4,
  },
  subtitle: { fontSize: 12, color: colors.muted, lineHeight: 1.5 },
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  infoCard: {
    flex: 1,
    backgroundColor: colors.infoBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.heading,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 16 },
  tag: {
    backgroundColor: colors.tagBg,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 9, color: colors.muted },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border, marginVertical: 16 },
  description: { fontSize: 11, color: colors.body, lineHeight: 1.7, marginBottom: 4 },
  sectionHeading: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: colors.heading,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  ingredientsGrid: { flexDirection: "row", flexWrap: "wrap" },
  ingredientItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
    paddingRight: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    marginTop: 4,
    marginRight: 8,
    flexShrink: 0,
  },
  ingredientText: { fontSize: 10, color: colors.body, lineHeight: 1.5, flex: 1 },
  stepItem: { flexDirection: "row", marginBottom: 12, alignItems: "flex-start" },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumberText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.white },
  stepText: { fontSize: 10, color: colors.body, lineHeight: 1.65, flex: 1 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  footerPageNum: { fontSize: 8, color: colors.muted },
  footerSource: { fontSize: 7.5, color: colors.muted, lineHeight: 1.5 },
  footerLink: { fontSize: 7.5, color: colors.accent, textDecoration: "none" },
});

function ingredientLabel(item) {
  if (typeof item === "string") return item;
  return [item.qty, item.unit, item.name, item.notes ? `(${item.notes})` : ""]
    .filter(Boolean)
    .join(" ");
}

export function RecipePDF({ recipe }) {
  const infoItems = [
    { label: "Prep", value: recipe.prepTime },
    { label: "Cook", value: recipe.cookTime },
    { label: "Servings", value: recipe.servings },
    { label: "Difficulty", value: recipe.difficulty },
  ].filter((i) => i.value);

  return (
    <Document title={recipe.title} author="Thomas' Recipes">
      <Page size="A4" style={styles.page}>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.subtitle && <Text style={styles.subtitle}>{recipe.subtitle}</Text>}
        </View>

        {infoItems.length > 0 && (
          <View style={styles.infoRow}>
            {infoItems.map((item) => (
              <View key={item.label} style={styles.infoCard}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.description && (
          <>
            <View style={styles.divider} />
            <Text style={styles.description}>{recipe.description}</Text>
          </>
        )}

        {recipe.ingredients?.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionHeading}>Ingredients</Text>
            <View style={styles.ingredientsGrid}>
              {recipe.ingredients.map((item, i) => (
                <View key={i} style={styles.ingredientItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>{ingredientLabel(item)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {recipe.steps?.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionHeading}>Method</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepItem} wrap={false}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </>
        )}

        {/* Footer — fixed so it appears on every page */}
        <View style={styles.footer} fixed>
          <View style={styles.footerTop}>
            <Text style={styles.footerPageNum}>
              {recipe.title}
            </Text>
            <Text
              style={styles.footerPageNum}
              render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            />
          </View>
          <Text style={styles.footerSource}>
            From Thomas&apos; Recipes ({recipe.downloadedAt ?? ""}{") — "}
            <Link src={recipe.pageUrl ?? ""} style={styles.footerLink}>
              {recipe.pageUrl ?? ""}
            </Link>
          </Text>
        </View>
      </Page>
    </Document>
  );
}