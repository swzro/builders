import { User, EducationItem, LanguageItem, SkillCategory } from '@/types/user';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  user: User;
  isCurrentUser?: boolean;
  onEditProfile?: () => void;
}

// 언어 레벨 표시 함수
function getLevelText(level: string): string {
  switch (level) {
    case 'beginner':
      return '초급';
    case 'intermediate':
      return '중급';
    case 'advanced':
      return '고급';
    case 'native':
      return '원어민';
    default:
      return level;
  }
}

export default function ProfileHeader({
  user,
  isCurrentUser = false,
  onEditProfile,
}: ProfileHeaderProps) {
  if (!user) {
    return (
      <div className="w-full py-12 bg-brand-surface border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-text">사용자를 찾을 수 없습니다</h1>
            <p className="mt-2 text-brand-textSecondary">해당 사용자가 존재하지 않거나 프로필이 설정되지 않았습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12 bg-brand-surface border-b border-brand-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4 md:mb-0">
            <span className="text-2xl md:text-4xl font-bold text-brand-primary">
              {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text">{user.name}</h1>
                <p className="text-brand-textSecondary mt-1">@{user.username}</p>
              </div>
              
              {isCurrentUser && onEditProfile && (
                <button
                  onClick={onEditProfile}
                  className="mt-4 md:mt-0 px-4 py-2 text-sm font-medium text-brand-textSecondary bg-brand-surface border border-brand-border rounded-md hover:bg-brand-surfaceHover hover:border-brand-borderHover transition-all"
                >
                  프로필 수정
                </button>
              )}
            </div>
            
            {user.bio && (
              <div className="mt-4 text-brand-textSecondary whitespace-pre-line">
                {user.bio}
              </div>
            )}
            
            <div className="mt-6 grid grid-cols-1 gap-4">
              {/* 학력 정보 */}
              {user.education && user.education.length > 0 && (
                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-sm uppercase tracking-wider text-brand-textSecondary font-medium mb-2">학력</h3>
                  <div className="space-y-3">
                    {(user.education as EducationItem[]).map((edu, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium text-brand-text">{edu.institution}</p>
                        <p className="text-brand-textSecondary">
                          {edu.degree} {edu.field && `· ${edu.field}`}
                        </p>
                        <p className="text-xs text-brand-textTertiary mt-1">
                          {edu.start_date} - {edu.is_current ? '현재' : edu.end_date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 외국어 */}
              {user.language && user.language.length > 0 && (
                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-sm uppercase tracking-wider text-brand-textSecondary font-medium mb-2">외국어</h3>
                  <div className="flex flex-wrap gap-2">
                    {(user.language as LanguageItem[]).map((lang, index) => (
                      <div key={index} className="text-xs px-2 py-1 bg-brand-surface border border-brand-border rounded-md">
                        {lang.name} · {getLevelText(lang.level)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 스킬 */}
              {user.skills && Array.isArray(user.skills) && user.skills.length > 0 && (
                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-sm uppercase tracking-wider text-brand-textSecondary font-medium mb-2">스킬</h3>
                  <div className="space-y-3">
                    {(user.skills as SkillCategory[]).map((category, index) => (
                      <div key={index}>
                        <p className="text-xs font-medium text-brand-textSecondary">{category.category}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {category.items.map((item, itemIndex) => (
                            <span key={itemIndex} className="text-xs px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 기타 정보 */}
              {user.etc && (
                <div className="border-t border-brand-border pt-4">
                  <h3 className="text-sm uppercase tracking-wider text-brand-textSecondary font-medium mb-2">기타</h3>
                  <p className="text-sm text-brand-textSecondary whitespace-pre-line">{user.etc}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 