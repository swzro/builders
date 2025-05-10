import { Build } from '@/types/build';
import BuildCard from './BuildCard';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface BuildListProps {
  userId?: string;
  username?: string;
  isOwner?: boolean;
}

export default function BuildList({
  userId,
  username,
  isOwner = false,
}: BuildListProps) {
  const router = useRouter();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuilds = async () => {
      setLoading(true);
      let query = getClient().from('builds').select('*');
      if (userId) query = query.eq('user_id', userId);
      if (username) query = query.eq('username', username);
      query = query.order('created_at', { ascending: false });
      const { data, error: buildsError } = await query;
      if (buildsError) {
        setError('Builds 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }
      setBuilds(data || []);
      setLoading(false);
    };
    fetchBuilds();
  }, [userId, username]);

  const handleEdit = (id: string) => {
    router.push(`/builds/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    const supabase = getClient();
    const { error } = await supabase
      .from('builds')
      .delete()
      .eq('id', id);
    if (!error) {
      setBuilds(builds => builds.filter(build => build.id !== id));
    }
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    const supabase = getClient();
    const { error } = await supabase
      .from('builds')
      .update({ is_public: isPublic })
      .eq('id', id);
    if (!error) {
      setBuilds(builds =>
        builds.map(build =>
          build.id === id
            ? { ...build, is_public: isPublic }
            : build
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-brand-textSecondary text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 px-4 bg-brand-error/10 border border-brand-error/20 rounded-lg text-brand-error">
        <div className="flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div className="py-12 px-4 bg-brand-surface border border-brand-border rounded-lg animate-fade-in">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-brand-textTertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h3 className="text-xl font-semibold text-brand-text mb-2">등록된 Builds가 없습니다</h3>
          <p className="text-brand-textSecondary mb-6">나의 프로젝트와 활동을 등록하여 포트폴리오를 완성해보세요.</p>
          {isOwner && (
            <Link 
              href="/builds/new" 
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary hover:bg-brand-primaryHover transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              새 Build 등록하기
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 gap-4">
        {builds.map(build => (
          <div 
            key={build.id} 
            className={cn(
              "transform transition-all duration-200 hover:-translate-y-1",
              !build.is_public && isOwner && "opacity-70"
            )}
          >
            <BuildCard
              build={build}
              isEditable={isOwner}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePublic={handleTogglePublic}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 