import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return <div className={cn('skeleton rounded-lg', className)} />;
}

export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                </div>
            ))}
        </div>
    );
}
