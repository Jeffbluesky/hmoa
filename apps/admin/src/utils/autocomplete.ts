import { AutoComplete } from 'antd'

/**
 * Renders AutoComplete options with an optional "create new" entry
 * when the current value doesn't match any existing item.
 */
export function renderAutoCompleteOptions(
  items: string[],
  currentValue: string,
  createLabel = '创建'
) {
  const options = items.map((item) => (
    <AutoComplete.Option key={item} value={item}>
      {item}
    </AutoComplete.Option>
  ))

  if (currentValue && !items.includes(currentValue)) {
    options.push(
      <AutoComplete.Option
        key={`__create__:${currentValue}`}
        value={currentValue}
        style={{ color: '#0071e3', borderTop: '1px solid #f0f0f0' }}
      >
        {createLabel} "{currentValue}"
      </AutoComplete.Option>
    )
  }

  return options
}
