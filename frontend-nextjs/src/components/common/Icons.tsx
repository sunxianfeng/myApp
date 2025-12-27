import * as LucideIcons from 'lucide-react'

export const IconFolder = LucideIcons.Folder
export const IconGrid = LucideIcons.LayoutGrid
export const IconList = LucideIcons.List
export const IconMore = LucideIcons.MoreHorizontal
export const IconPlus = LucideIcons.Plus
export const IconEdit = LucideIcons.FilePenLine
export const IconTrash = LucideIcons.Trash2
export const IconTag = LucideIcons.Tag
export const IconMove = LucideIcons.ArrowRightLeft

/**
 * 新版 App Logo 组件 - 新野兽派风格 (Neobrutalism)
 * 象征 OCR 扫描捕捉错题
 */
export const AppLogo = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <div className={`relative ${className} group inline-block`}>
      {/* 底部阴影层 - 新野兽派典型特征 */}
      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 rounded-md" />
      
      {/* 主体容器 */}
      <div className="absolute inset-0 bg-[#FFE000] border-2 border-black rounded-md flex items-center justify-center overflow-hidden transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5">
        
        {/* OCR 扫描框效果装饰 */}
        <div className="absolute inset-1 border border-black/20 border-dashed rounded-sm" />
        
        {/* 核心图标 SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5 relative z-10"
        >
          {/* 四角扫描线 */}
          <path d="M7 3H3v4" />
          <path d="M17 3h4v4" />
          <path d="M17 21h4v-4" />
          <path d="M7 21H3v-4" />
          
          {/* 居中的问号 (代表错题) */}
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    </div>
  );
};
