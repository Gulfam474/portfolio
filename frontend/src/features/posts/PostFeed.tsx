import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { postApi } from "@/api/postApi";
import { PermissionGate } from "@/components/layout/PermissionGate";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PostCard } from "@/features/posts/PostCard";
import { PostEditor } from "@/features/posts/PostEditor";

const PAGE_SIZE = 3;

export function PostFeed() {
  const qc = useQueryClient();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["posts", "feed"],
      initialPageParam: 1,
      queryFn: async ({ pageParam }) =>
        (await postApi.list(pageParam, PAGE_SIZE)).data,
      getNextPageParam: (last) => {
        const loaded = last.page * last.page_size;
        return loaded < last.total ? last.page + 1 : undefined;
      },
    });

  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const refresh = () => qc.invalidateQueries({ queryKey: ["posts"] });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="label-mono">feed</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Posts</h1>
        <p className="mt-2 text-sm text-muted">
          Notes on systems, AI, and shipping production software.
        </p>
      </motion.div>

      <PermissionGate module="posts" action="edit">
        <PostEditor onCreated={refresh} />
      </PermissionGate>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="glass-card p-8 text-center text-sm text-muted">
          No posts yet. Be the first to publish.
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onChanged={refresh} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex flex-col items-center gap-2">
          <p className="font-mono text-xs text-muted">
            Showing {posts.length} of {total}
          </p>
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
