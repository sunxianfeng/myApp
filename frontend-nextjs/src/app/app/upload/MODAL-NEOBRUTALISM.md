# 错题本弹窗 - Neobrutalism 设计

## 🎨 设计改造说明

原来的弹窗使用了常规的设计风格（圆角、蓝色按钮、灰色边框等），现已完全改造为 **Neobrutalism 风格**，与整个上传页面保持一致。

## ✨ 主要改动

### 1. 弹窗容器 (Modal Container)
**改前:**
```css
rounded-lg          /* 圆角 */
bg-white           
border border-gray-300  /* 细灰色边框 */
```

**改后:**
```css
border: 5px solid #000000           /* 粗黑边框 */
box-shadow: 16px 16px 0px 0px       /* 大偏移阴影 */
animation: modalSlideIn             /* 滑入动画 */
```

### 2. 标题 (Modal Title)
```css
font-size: 2rem                     /* 大字体 */
font-weight: 900                    /* 极粗 */
text-transform: uppercase           /* 全大写 */
border-bottom: 4px solid #000000    /* 粗下划线 */
```

### 3. 输入框 (Input/Select)
**改前:**
```css
border border-gray-300              /* 细边框 */
rounded-lg                          /* 圆角 */
focus:ring-blue-500                 /* 蓝色聚焦环 */
```

**改后:**
```css
border: 4px solid #000000           /* 粗黑边框 */
font-weight: 700                    /* 粗体 */
focus: border-color: #6366f1        /* 紫色边框 */
focus: box-shadow: 4px 4px 0px      /* 紫色阴影 */
```

### 4. 创建错题本按钮
**改前:**
```css
border-dashed border-blue-400       /* 蓝色虚线 */
text-blue-600                       /* 蓝色文字 */
rounded-lg                          /* 圆角 */
```

**改后:**
```css
border: 4px dashed #000000          /* 黑色粗虚线 */
background: #FFD100                 /* 亮黄色背景 */
font-weight: 900                    /* 极粗 */
text-transform: uppercase           /* 全大写 */
box-shadow: 4px 4px 0px             /* 偏移阴影 */
```

### 5. 操作按钮
**改前 - 取消按钮:**
```css
text-gray-700
hover:bg-gray-100
rounded-lg
```

**改后 - 取消按钮:**
```css
border: 4px solid #000000
background: #FFFFFF
font-weight: 900
text-transform: uppercase
box-shadow: 4px 4px 0px
hover: transform: translate(-2px, -2px)
hover: box-shadow: 6px 6px 0px
```

**改前 - 确认按钮:**
```css
bg-blue-500                         /* 蓝色 */
text-white
rounded-lg
```

**改后 - 确认按钮:**
```css
border: 4px solid #000000
background: #A3E635                 /* 亮绿色 */
color: #000000                      /* 黑色文字 */
font-weight: 900
text-transform: uppercase
box-shadow: 6px 6px 0px
hover: transform: translate(-3px, -3px)
hover: box-shadow: 9px 9px 0px
```

### 6. 错误消息
**改前:**
```css
bg-red-50                           /* 浅红色 */
border border-red-200               /* 细边框 */
text-red-700
rounded
```

**改后:**
```css
background: #FF7A00                 /* 亮橙色 */
border: 4px solid #000000           /* 粗黑边框 */
color: #FFFFFF                      /* 白色文字 */
font-weight: 900                    /* 极粗 */
box-shadow: 4px 4px 0px
```

## 🎭 交互动画

### 弹窗出现
```css
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### 按钮悬停
```css
/* 取消按钮 */
hover: translate(-2px, -2px) + shadow 6px

/* 确认按钮 */
hover: translate(-3px, -3px) + shadow 9px + 颜色变深
```

### 按钮点击
```css
active: translate(2px, 2px) + shadow 2px
```

### 创建按钮悬停
```css
hover: translate(-2px, -2px) + shadow 6px + 黄色加深
```

## 📱 响应式设计

### 移动端适配 (< 768px)
```css
.modal-container {
  padding: 2rem                     /* 减小内边距 */
  box-shadow: 12px 12px 0px        /* 减小阴影 */
}

.modal-title {
  font-size: 1.5rem                /* 缩小标题 */
}

.modal-actions {
  flex-direction: column           /* 按钮纵向排列 */
}

.modal-btn-cancel,
.modal-btn-confirm {
  width: 100%                      /* 按钮全宽 */
}
```

## 🎨 CSS 类名对照表

| 用途 | 旧类名 | 新类名 |
|------|--------|--------|
| 遮罩层 | `fixed inset-0 bg-black bg-opacity-50` | `modal-overlay` |
| 弹窗容器 | `bg-white rounded-lg p-6` | `modal-container` |
| 标题 | `text-xl font-bold mb-4` | `modal-title` |
| 内容区 | `space-y-4` | `modal-content` |
| 字段容器 | `<div>` | `modal-field` |
| 标签 | `block text-sm font-medium text-gray-700` | `modal-label` |
| 下拉框 | `border border-gray-300 rounded-lg` | `modal-select` |
| 输入框 | `border border-gray-300 rounded-lg` | `modal-input` |
| 创建按钮 | `border-dashed border-blue-400 text-blue-600 rounded-lg` | `create-collection-btn` |
| 按钮区 | `flex justify-end gap-3` | `modal-actions` |
| 取消按钮 | `text-gray-700 hover:bg-gray-100 rounded-lg` | `modal-btn-cancel` |
| 确认按钮 | `bg-blue-500 text-white rounded-lg` | `modal-btn-confirm` |
| 错误消息 | `bg-red-50 border border-red-200` | `modal-error` |

## ✅ Neobrutalism 设计检查清单

- [x] 使用 4-5px 粗黑边框
- [x] 使用偏移阴影（无模糊）
- [x] 使用鲜艳颜色（黄、绿、橙）
- [x] 使用极粗字体（900）
- [x] 使用全大写文字
- [x] 无圆角或最小圆角
- [x] 悬停时有明显的阴影/位移动画
- [x] 点击时有按下效果
- [x] 高对比度
- [x] 响应式设计

## 🚀 使用示例

### 选择现有错题本
```tsx
<div className="modal-overlay">
  <div className="modal-container">
    <h2 className="modal-title">保存到错题本</h2>
    <div className="modal-content">
      <div className="modal-field">
        <label className="modal-label">选择错题本</label>
        <select className="modal-select">
          <option>错题本 A</option>
          <option>错题本 B</option>
        </select>
      </div>
      <div className="modal-actions">
        <button className="modal-btn-cancel">取消</button>
        <button className="modal-btn-confirm">确认保存</button>
      </div>
    </div>
  </div>
</div>
```

### 创建新错题本
```tsx
<div className="modal-content">
  <div className="modal-field">
    <label className="modal-label">新错题本名称 *</label>
    <input className="modal-input" placeholder="例如：数学错题集" />
  </div>
  <div className="modal-actions">
    <button className="modal-btn-cancel">返回</button>
    <button className="modal-btn-confirm">创建并保存</button>
  </div>
</div>
```

## 💡 设计亮点

1. **视觉冲击力强** - 大标题 + 粗边框 + 鲜艳颜色
2. **交互反馈明显** - 悬停和点击都有明显的视觉变化
3. **一致性高** - 与页面其他元素风格完全统一
4. **可访问性好** - 高对比度，清晰的视觉层次
5. **响应式友好** - 移动端自动调整布局

## 🔗 相关文件

- CSS: `/result/result-neobrutalism.css` (第 401-590 行)
- TSX: `/result/page.tsx` (第 398-496 行)

---

**设计风格**: Neobrutalism  
**更新日期**: 2025年12月  
**状态**: ✅ 已完成

