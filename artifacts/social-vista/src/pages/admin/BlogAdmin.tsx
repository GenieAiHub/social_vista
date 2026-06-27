import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  useListAdminBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  getListAdminBlogPostsQueryKey,
  ApiError,
  type BlogPost,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Undo2,
  Redo2,
  ExternalLink,
  BookOpen,
  Eye,
  FileText,
} from "lucide-react";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

function errorMsg(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    const d = err.data as { error?: string } | undefined;
    if (d?.error) return d.error;
  }
  return fallback;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function RichEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your article here…" }),
      Link.configure({ openOnClick: false }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[320px] p-4 focus:outline-none text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-6 [&_ol]:list-decimal [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_hr]:border-border [&_a]:text-primary [&_a]:underline [&_.is-editor-empty:before]:content-[attr(data-placeholder)] [&_.is-editor-empty:before]:text-muted-foreground [&_.is-editor-empty:before]:pointer-events-none [&_.is-editor-empty:before]:absolute",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", false);
    }
  }, [content]);

  function addLink() {
    const url = window.prompt("Enter URL:");
    if (!url || !editor) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/40">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link">
          <ExternalLink className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  authorName: string;
  coverImageUrl: string;
  published: boolean;
}

const EMPTY_FORM: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "General",
  tags: [],
  authorName: "Social Vista Team",
  coverImageUrl: "",
  published: false,
};

function formFromPost(p: BlogPost): PostForm {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    category: p.category,
    tags: p.tags ?? [],
    authorName: p.authorName,
    coverImageUrl: p.coverImageUrl ?? "",
    published: p.published,
  };
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  function add() {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5"
          >
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-destructive ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type a tag and press Enter"
          className="h-8 text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} className="h-8">Add</Button>
      </div>
    </div>
  );
}

function PostEditor({
  post,
  onSaved,
  onCancel,
}: {
  post: BlogPost | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isNew = !post;
  const [form, setForm] = useState<PostForm>(post ? formFromPost(post) : EMPTY_FORM);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const { toast } = useToast();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const pending = createPost.isPending || updatePost.isPending;

  function setField<K extends keyof PostForm>(key: K, value: PostForm[K]) {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      if (key === "title" && !slugEdited) {
        updated.slug = slugify(String(value));
      }
      return updated;
    });
  }

  const handleContentChange = useCallback((html: string) => {
    setForm((f) => ({ ...f, content: html }));
  }, []);

  function save(publish?: boolean) {
    if (!form.title.trim()) {
      toast({ title: "Title is required.", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt,
      content: form.content,
      category: form.category || "General",
      tags: form.tags,
      authorName: form.authorName || "Social Vista Team",
      coverImageUrl: form.coverImageUrl || null,
      published: publish !== undefined ? publish : form.published,
    };

    if (isNew) {
      createPost.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: publish ? "Post published!" : "Draft saved." });
            onSaved();
          },
          onError: (err) => toast({ title: errorMsg(err, "Could not save post."), variant: "destructive" }),
        },
      );
    } else {
      updatePost.mutate(
        { id: post.id, data: payload },
        {
          onSuccess: () => {
            toast({ title: publish ? "Post published!" : "Changes saved." });
            onSaved();
          },
          onError: (err) => toast({ title: errorMsg(err, "Could not update post."), variant: "destructive" }),
        },
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to posts
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => save(false)} disabled={pending}>
            Save draft
          </Button>
          <Button size="sm" onClick={() => save(true)} disabled={pending} className="bg-primary hover:bg-primary/90 text-white">
            {form.published ? "Update & keep published" : "Publish post"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Post title…"
              className="text-2xl font-bold font-serif border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 h-auto py-3"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Excerpt (shown in listings &amp; SEO description)</Label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setField("excerpt", e.target.value)}
              placeholder="A short summary of what this post is about…"
              rows={2}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Content</Label>
            <RichEditor content={form.content} onChange={handleContentChange} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Post settings</h3>

            <div>
              <Label htmlFor="post-slug" className="text-xs text-muted-foreground">URL slug</Label>
              <Input
                id="post-slug"
                value={form.slug}
                onChange={(e) => { setSlugEdited(true); setField("slug", e.target.value); }}
                placeholder="my-post-title"
                className="mt-1 h-8 text-sm font-mono"
              />
              {form.slug && (
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  /blog/<span className="text-primary">{form.slug}</span>
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="post-category" className="text-xs text-muted-foreground">Category</Label>
              <Input
                id="post-category"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="e.g. Social Media"
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Tags</Label>
              <div className="mt-1">
                <TagInput tags={form.tags} onChange={(t) => setField("tags", t)} />
              </div>
            </div>

            <div>
              <Label htmlFor="post-author" className="text-xs text-muted-foreground">Author name</Label>
              <Input
                id="post-author"
                value={form.authorName}
                onChange={(e) => setField("authorName", e.target.value)}
                placeholder="Author name"
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="post-cover" className="text-xs text-muted-foreground">Cover image URL</Label>
              <Input
                id="post-cover"
                value={form.coverImageUrl}
                onChange={(e) => setField("coverImageUrl", e.target.value)}
                placeholder="https://…"
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <div>
                <div className="text-sm font-medium text-foreground">Published</div>
                <div className="text-xs text-muted-foreground">Visible on public blog</div>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setField("published", v)}
              />
            </div>
          </div>

          {form.slug && (
            <a
              href={`/blog/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Eye className="w-3.5 h-3.5" /> Preview public page
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlogAdmin() {
  const { data: posts, isLoading } = useListAdminBlogPosts();
  const deletePost = useDeleteBlogPost();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "editor">("list");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListAdminBlogPostsQueryKey() });
  }

  function openNew() {
    setEditingPost(null);
    setView("editor");
  }

  function openEdit(post: BlogPost) {
    setEditingPost(post);
    setView("editor");
  }

  function handleSaved() {
    invalidate();
    setView("list");
  }

  function handleDelete(post: BlogPost) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    deletePost.mutate(
      { id: post.id },
      {
        onSuccess: () => { toast({ title: "Post deleted." }); invalidate(); },
        onError: (err) => toast({ title: errorMsg(err, "Could not delete post."), variant: "destructive" }),
      },
    );
  }

  if (view === "editor") {
    return (
      <AdminLayout>
        <PostEditor
          post={editingPost}
          onSaved={handleSaved}
          onCancel={() => setView("list")}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Blog</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage articles. Published posts appear on the public blog.
            </p>
          </div>
          <Button size="sm" onClick={openNew} data-testid="button-new-post">
            <Plus className="w-4 h-4 mr-1" /> New post
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : (posts?.length ?? 0) === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No posts yet. Create your first article.</p>
            <Button size="sm" className="mt-4" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> New post
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {posts!.map((post) => (
              <div
                key={post.id}
                className="bg-card rounded-xl border border-border px-4 py-3 flex items-center gap-4"
                data-testid={`card-post-${post.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm truncate">{post.title}</span>
                    {post.published ? (
                      <span className="text-[10px] font-semibold bg-green-500/10 text-green-600 border border-green-500/20 rounded-full px-2 py-0.5 flex-shrink-0">
                        Published
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 flex-shrink-0">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <span className="text-primary/80 font-medium">{post.category}</span>
                    {post.tags.length > 0 && (
                      <span>{post.tags.slice(0, 3).join(", ")}{post.tags.length > 3 ? " …" : ""}</span>
                    )}
                    <span>{post.readTime}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="View post"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => openEdit(post)}
                    data-testid={`button-edit-${post.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(post)}
                    disabled={deletePost.isPending}
                    data-testid={`button-delete-${post.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(posts?.length ?? 0) > 0 && (
          <p className="text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            {posts!.filter((p) => p.published).length} published · {posts!.filter((p) => !p.published).length} draft
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
