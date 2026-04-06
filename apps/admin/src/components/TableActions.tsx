import { Button, Space, Popconfirm, PopconfirmProps } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface TableActionsProps<T> {
  /** 当前行数据 */
  record: T;
  /** 编辑回调 */
  onEdit: (record: T) => void;
  /** 删除回调 */
  onDelete: (record: T) => void | Promise<void>;
  /** 是否禁用编辑按钮 */
  editDisabled?: boolean;
  /** 是否禁用删除按钮 */
  deleteDisabled?: boolean;
  /** 是否隐藏删除按钮 */
  hideDelete?: boolean;
  /** 编辑按钮文本 */
  editText?: string;
  /** 删除按钮文本 */
  deleteText?: string;
  /** 删除确认框配置 */
  deleteConfirmProps?: Omit<PopconfirmProps, 'title' | 'description' | 'onConfirm'>;
  /** 自定义确认标题 */
  confirmTitle?: string;
  /** 自定义确认描述 */
  confirmDescription?: string;
}

/**
 * 表格操作列通用组件
 */
export function TableActions<T>({
  record,
  onEdit,
  onDelete,
  editDisabled = false,
  deleteDisabled = false,
  hideDelete = false,
  editText = '编辑',
  deleteText = '删除',
  deleteConfirmProps,
  confirmTitle = '确认删除',
  confirmDescription = '删除后不可恢复，是否继续？',
}: TableActionsProps<T>) {
  const handleDelete = async () => {
    await onDelete(record);
  };

  return (
    <Space>
      <Button
        type="text"
        icon={<EditOutlined />}
        onClick={() => onEdit(record)}
        disabled={editDisabled}
      >
        {editText}
      </Button>
      {!hideDelete && (
        <Popconfirm
          title={confirmTitle}
          description={confirmDescription}
          onConfirm={handleDelete}
          okText="确认"
          cancelText="取消"
          {...deleteConfirmProps}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={deleteDisabled}
          >
            {deleteText}
          </Button>
        </Popconfirm>
      )}
    </Space>
  );
}