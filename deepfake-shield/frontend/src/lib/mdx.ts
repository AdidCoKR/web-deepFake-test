/**
 * lib/mdx.ts
 * ==========
 * Utilitas untuk membaca dan memproses file MDX dari direktori content.
 * Menggunakan gray-matter untuk parsing frontmatter metadata.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Direktori konten MDX
const CONTENT_DIR = path.join(process.cwd(), "src", "content");

// Tipe metadata artikel dari frontmatter MDX
export interface ArticleMeta {
  slug         : string;
  title        : string;
  description  : string;
  chapter      : number;
  readTime     : string;
  tags         : string[];
  publishedAt  : string;
  coverColor   : string;   // Warna aksen artikel
}

/**
 * Baca semua artikel MDX dari direktori content.
 * Kembalikan metadata saja (tanpa konten penuh) untuk listing page.
 */
export function getAllArticles(): ArticleMeta[] {
  // Baca semua file .mdx di direktori content
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".mdx"));

  const articles = files.map(filename => {
    // Baca isi file
    const filePath = path.join(CONTENT_DIR, filename);
    const rawContent = fs.readFileSync(filePath, "utf-8");

    // Parse frontmatter dengan gray-matter
    const { data } = matter(rawContent);

    // Slug = nama file tanpa ekstensi
    const slug = filename.replace(/\.mdx$/, "");

    return {
      slug,
      ...data,
    } as ArticleMeta;
  });

  // Urutkan berdasarkan chapter number
  return articles.sort((a, b) => a.chapter - b.chapter);
}

/**
 * Baca satu artikel lengkap berdasarkan slug.
 * Kembalikan metadata + konten MDX string.
 */
export function getArticleBySlug(slug: string): {
  meta   : ArticleMeta;
  content: string;
} | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  // Cek apakah file ada
  if (!fs.existsSync(filePath)) return null;

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(rawContent);

  return {
    meta   : { slug, ...data } as ArticleMeta,
    content,
  };
}
