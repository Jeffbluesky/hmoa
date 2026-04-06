import { Input, InputProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchBarProps {
  /** 搜索关键词 */
  keyword: string;
  /** 关键词变化回调 */
  onKeywordChange: (value: string) => void;
  /** 搜索触发回调 */
  onSearch: (value: string) => void;
  /** 搜索框占位符 */
  placeholder?: string;
  /** 是否允许清空 */
  allowClear?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 输入框其他属性 */
  inputProps?: Omit<InputProps, 'value' | 'onChange' | 'onSearch'>;
}

/**
 * 通用搜索栏组件
 */
export function SearchBar({
  keyword,
  onKeywordChange,
  onSearch,
  placeholder = '搜索...',
  allowClear = true,
  style,
  inputProps,
}: SearchBarProps) {
  return (
    <Input.Search
      placeholder={placeholder}
      allowClear={allowClear}
      value={keyword}
      onChange={(e) => onKeywordChange(e.target.value)}
      onSearch={onSearch}
      style={{ width: 220, ...style }}
      enterButton={<SearchOutlined />}
      {...inputProps}
    />
  );
}